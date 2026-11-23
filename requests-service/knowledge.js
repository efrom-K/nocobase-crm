'use strict';

const { DatabaseSync } = require('node:sqlite');

class KnowledgeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const audiences = ['all', 'managers', 'accounting_dept', 'legal_dept', 'rental_dept', 'hr', 'aho'];
const states = ['draft', 'published', 'archived'];
const topics = ['CRM и рабочие сервисы', 'Для управляющих', 'Аренда', 'Оплата и бухгалтерия',
  'Кадры', 'АХО', 'Приказы и регламенты', 'Объекты'];

function createKnowledge(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS articles(
      id INTEGER PRIMARY KEY, topic TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
      audience TEXT NOT NULL, state TEXT NOT NULL, owner TEXT NOT NULL, review TEXT NOT NULL,
      editor TEXT NOT NULL, updated TEXT NOT NULL, version INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS revisions(
      article_id INTEGER NOT NULL, version INTEGER NOT NULL, snapshot TEXT NOT NULL,
      PRIMARY KEY(article_id,version)
    );`);
  function visible(article, user) {
    return user.isAdmin || article.state === 'published' &&
      (article.audience === 'all' || user.knowledgeAudiences.includes(article.audience));
  }
  function read(user, id) {
    const article = db.prepare('SELECT * FROM articles WHERE id=?').get(id);
    if (!article || !visible(article, user)) throw new KnowledgeError(404, 'Статья не найдена');
    return article;
  }
  function save(user, input) {
    if (!user.isAdmin || user.readOnly) throw new KnowledgeError(403, 'Нужны права редактора');
    const {id, version, title, body, topic, audience, state, owner, review} = input || {};
    if ((id !== undefined && (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(version))) ||
        typeof title !== 'string' || !title.trim() || title.length > 180 ||
        typeof body !== 'string' || !body.trim() || body.length > 70000 ||
        typeof topic !== 'string' || !topic.trim() || topic.length > 100 || !audiences.includes(audience) || !states.includes(state) ||
        typeof owner !== 'string' || owner.length > 120 ||
        typeof review !== 'string' || (review !== '' && (!/^\d{4}-\d{2}-\d{2}$/.test(review) ||
          !Number.isFinite(Date.parse(review)) || new Date(review).toISOString().slice(0,10) !== review))) {
      throw new KnowledgeError(400, 'Проверьте поля статьи');
    }
    const values = [topic.trim(),title.trim(),body.trim(),audience,state,owner.trim(),review,user.name,new Date().toISOString()];
    db.exec('BEGIN IMMEDIATE');
    try {
      let articleId = id;
      if (id === undefined) {
        articleId = Number(db.prepare(`INSERT INTO articles
          (topic,title,body,audience,state,owner,review,editor,updated,version) VALUES (?,?,?,?,?,?,?,?,?,1)`).run(...values).lastInsertRowid);
      } else {
        const saved = db.prepare(`UPDATE articles SET topic=?,title=?,body=?,audience=?,state=?,
          owner=?,review=?,editor=?,updated=?,version=version+1 WHERE id=? AND version=?`).run(...values,id,version);
        if (!saved.changes) throw new KnowledgeError(409, 'Статья уже изменена. Откройте свежую версию');
      }
      const article = read(user,articleId);
      db.prepare('INSERT INTO revisions VALUES (?,?,?)').run(articleId,article.version,JSON.stringify(article));
      db.exec('COMMIT');
      return article;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  function browse(user, query) {
    const words = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
    return db.prepare('SELECT * FROM articles ORDER BY updated DESC,id DESC').all().filter(article => {
      if (!visible(article,user)) return false;
      const text = (article.title + ' ' + article.topic + ' ' + article.body).toLocaleLowerCase('ru');
      return words.every(word => text.includes(word));
    }).map(({body, ...summary}) => summary);
  }
  function history(user,id) {
    if (!user.isAdmin || user.readOnly) throw new KnowledgeError(403,'История доступна редакторам');
    read(user,id);
    return db.prepare('SELECT snapshot FROM revisions WHERE article_id=? ORDER BY version DESC').all(id)
      .map(row => JSON.parse(row.snapshot));
  }
  return {browse,read,save,history};
}

module.exports = {createKnowledge,KnowledgeError,topics,audiences};
