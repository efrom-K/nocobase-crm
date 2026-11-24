// One-time read-only Pyrus export into the CRM payments database. Run with the requests-service environment.
'use strict';

const { createHash } = require('node:crypto');
const { createPayments, STATUS, FILE_LABELS } = require('./payments');

const API = 'https://api.pyrus.com/v4/';
const FORM = 'forms/2483476';
const env = process.env;
const post = value => ({method:'POST',headers:{'Content-Type':'application/json','X-Authenticator':'basic'},body:JSON.stringify(value)});
const bearer = token => ({headers:{Authorization:'Bearer ' + token,'X-Authenticator':'basic'}});
async function request(url, options) {
  const response = await fetch(url, {...options, redirect:'error', signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error('HTTP ' + response.status + ' from ' + new URL(url).hostname);
  return response;
}
async function json(url, options) { return (await request(url,options)).json(); }
function name(person) { return [person?.last_name,person?.first_name].filter(Boolean).join(' ') || '—'; }
function normalized(value) { return String(value || '').trim().toLowerCase(); }
async function run() {
  const {access_token,api_url} = await json('https://accounts.pyrus.com/api/v4/auth',post({
    login:env.PYRUS_PAYMENTS_LOGIN, security_key:env.PYRUS_PAYMENTS_KEY
  }));
  if (api_url !== API || !access_token) throw new Error('Unexpected Pyrus authorization response');
  const auth = bearer(access_token);
  const pyrus = path => json(API + path,auth);
  const signIn = await json(env.NB_URL + '/api/auth:signIn',post({account:env.NB_SERVICE_USER,password:env.NB_SERVICE_PASSWORD}));
  if (!signIn.data?.token) throw new Error('CRM authorization failed');
  const [catalog,people,crm,register] = await Promise.all([
    pyrus('catalogs/287919'), pyrus('members'),
    json(env.NB_URL + '/api/users:list?paginate=false&fields=id,email',bearer(signIn.data.token)),
    pyrus(FORM + '/register?include_archived=y')
  ]);
  if (catalog.deleted || !catalog.items?.length || !Array.isArray(people.members) || !Array.isArray(crm.data)
      || !register.tasks?.length || register.tasks.length >= 20000) throw new Error('Incomplete payment export');
  const accountIds = new Map();
  for (const u of crm.data) {
    const email = normalized(u.email);
    if (email) accountIds.set(email,accountIds.has(email) ? null : Number(u.id));
  }
  const memberIds = new Map(people.members.map(p => [p.id,accountIds.get(normalized(p.email))]));
  const crmId = p => memberIds.get(Number(p?.id ?? p)) || accountIds.get(normalized(p?.email)) || null;
  const routes = catalog.items.filter(x => !x.deleted).map(x => {
    const [name,,senior,accountant,chief,approver] = x.values;
    const route = { id:x.item_id, name, senior:crmId(senior), accountant:crmId(accountant), chief:crmId(chief), approver:crmId(approver) };
    if (!Number.isSafeInteger(route.id) || !name || [route.senior,route.accountant,route.chief,route.approver].some(id => !id)) {
      throw new Error('Unmapped payment route ' + x.item_id);
    }
    return route;
  });
  const routesById = new Map(routes.map(r => [r.id,r]));
  const flatFields = fields => fields.flatMap(f => [f,...flatFields(f.value?.fields || [])]);
  const statuses = new Map(Object.entries(STATUS).map(([id,label]) => [label,Number(id)]));
  async function readFile(f, kind) {
    if (!Number.isSafeInteger(f.id) || !Number.isSafeInteger(f.size) || f.size < 0 || f.size > 100 * 1024 * 1024 || typeof f.name !== 'string') {
      throw new Error('Invalid attachment descriptor');
    }
    const response = await request(API + 'files/download/' + f.id,auth);
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash('md5').update(bytes).digest();
    if (bytes.length !== f.size || (f.md5 && f.md5 !== hash.toString('base64') && f.md5.toLowerCase() !== hash.toString('hex'))) {
      throw new Error('Attachment verification failed for ' + f.id);
    }
    return {name:f.name.replace(/[/\\\x00-\x1f]/g,'_'), bytes, kind};
  }
  async function readTask(entry) {
    if (!Number.isSafeInteger(entry.id)) throw new Error('Invalid request ID');
    const {task:t} = await pyrus('tasks/' + entry.id);
    if (!t || t.form_id !== 2483476 || !t.create_date || !Array.isArray(t.fields)) throw new Error('Invalid request ' + entry.id);
    const vals = new Map(flatFields(t.fields).map(f => [f.id,f.value]));
    const value = id => typeof vals.get(id) === 'string' ? vals.get(id) : '';
    const objectField = vals.get(2);
    const routeRow = routesById.get(objectField?.item_id || objectField?.item_ids?.[0]);
    const status = statuses.get(vals.get(1)?.choice_names?.[0]) ?? (t.is_closed ? 6 : 0);
    if (status >= 2 && status <= 5 && !routeRow) throw new Error('Active request has no CRM route ' + entry.id);
    const route = routeRow ? Object.fromEntries(['senior','accountant','chief','approver'].map(k => [k,routeRow[k]])) : {};
    const activeNodes = new Set((t.bpmn_tokens || []).filter(x=>x.status === 'Active').map(x=>x.node_id));
    if (status === 3 && !activeNodes.has(1) && !activeNodes.has(4)) throw new Error('Cannot recover parallel approvals for ' + entry.id);
    const approved = status === 3 ? [[1,'approver'],[4,'chief']].filter(([id])=>!activeNodes.has(id)).map(([,role])=>role) : [];
    const notes = t.comments || [];
    const sources = Object.keys(FILE_LABELS).flatMap(kind => (vals.get(Number(kind)) || []).map(file => ({file,kind:Number(kind)})))
      .concat(notes.flatMap(note => (note.attachments || []).map(file => ({file,kind:22}))));
    const files = [];
    const seen = new Set();
    for (const {file,kind} of sources) {
      if (seen.has(file.id)) continue;
      files.push(await readFile(file,kind));
      seen.add(file.id);
    }
    const history = notes.map(note => ({
      date:note.create_date, author:name(note.author),
      text:note.text || ({approved:'Согласовано',rejected:'Отклонено'}[note.approval_choice]) ||
        (note.action === 'finished' ? 'Заявка закрыта' : note.bpmn_transitions?.length ? 'Этап изменён' : '')
    })).filter(note=>note.text);
    const tagged = value(10).match(/^Сотрудник CRM:.*?\(ID (\d+)\)(?:\n|$)/);
    const authorId = (tagged ? Number(tagged[1]) : crmId(t.author));
    return {legacyId:t.id, legacyVersion:String(t.last_modified_date) + ":" + String(entry.last_note_id), purpose:value(3), counterparty:value(14), contact:value(15), phone:value(16), email:value(17),
      comment:value(10), object:routeRow?.name || objectField?.values?.[0] || '', amount:Number.isFinite(vals.get(9)) ? vals.get(9) : null,
      route, due:value(12) || t.due_date || '', status, approved, authorId, author:tagged ? tagged[0].trim() : name(t.author),
      subscribers:(t.subscribers || []).map(crmId).filter(Boolean), created:t.create_date, history, files};
  }
  const records = [];
  for (let i = 0; i < register.tasks.length; i += 4) records.push(...await Promise.all(register.tasks.slice(i,i+4).map(readTask)));
  const db = createPayments(env.PAYMENTS_DB || '/app/knowledge/payments.sqlite');
  const results = db.loadSnapshot(routes,records);
  console.log(JSON.stringify({...results, sourceRecords:records.length, sourceFiles:records.reduce((n,r)=>n+r.files.length,0),
    statuses:records.reduce((a,r)=>(a[r.status]=(a[r.status] || 0)+1,a),{})}));
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
