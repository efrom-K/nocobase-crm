#!/usr/bin/env python3
"""Агент выкладки JS-блоков реестра из git-репозитория в NocoBase.

Схема: GitHub Actions проверяет коммит (CI), а этот скрипт на сервере раз в минуту (cron) смотрит в GitHub,
и если на main появился коммит с зелёным CI — записывает изменённые блоки из src/ в таблицу flowModels.
Соединение только исходящее, секретов на сервере нет. Скрипт устанавливается на сервер ОТДЕЛЬНО (копированием) и из репозитория
сам не обновляется: вытянутый код не исполняется, он только записывается в NocoBase как данные страницы.

Команды:
  init                  запомнить текущее состояние как «уже выложено» (когда репозиторий и NocoBase совпадают)
  status                сравнить репозиторий и живой NocoBase по каждому блоку
  auto                  для cron: fetch → проверить CI → выложить, если есть новое; иначе молчит
  deploy [--force]      выложить блоки из рабочей копии сейчас (--force — поверх ручных правок из интерфейса)
  rollback              вернуть блоки из последней резервной копии и заморозить автовыкладку до нового коммита
  export --to DIR       сохранить живой код блоков в файлы (после правок прямо в интерфейсе NocoBase), чтобы закоммитить

Настройки (переменные окружения):
  NB_DEPLOY_HOME        каталог агента (по умолчанию ~/nb_deploy): repo/, state.json, backups/, deploy.log
  NB_REPO_DIR           рабочая копия репозитория (по умолчанию $NB_DEPLOY_HOME/repo)
  NB_PG_CONTAINER       контейнер PostgreSQL (nocobase-postgres-1)
  NB_SSH                если задан, команды к БД выполняются через ssh (для запуска с ноутбука)
  NB_NOTIFY_USER_IDS    через запятую id пользователей NocoBase, кому положить сообщение в колокольчик о результате
  NB_CI_REQUIRED        1 (по умолчанию): выкладывать только коммиты с успешным CI; 0 — не проверять
"""
import datetime, hashlib, json, os, subprocess, sys, urllib.request, urllib.error

HOME = os.path.expanduser(os.environ.get('NB_DEPLOY_HOME', '~/nb_deploy'))
REPO = os.path.expanduser(os.environ.get('NB_REPO_DIR', os.path.join(HOME, 'repo')))
CONTAINER = os.environ.get('NB_PG_CONTAINER', 'nocobase-postgres-1')
SSH = os.environ.get('NB_SSH')
NOTIFY = [int(x) for x in os.environ.get('NB_NOTIFY_USER_IDS', '').split(',') if x.strip()]
CI_REQUIRED = os.environ.get('NB_CI_REQUIRED', '1') != '0'
STATE = os.path.join(HOME, 'state.json')
LOG = os.path.join(HOME, 'deploy.log')
CODE_PATH = '{stepParams,jsSettings,runJs,code}'

def log(msg):
    os.makedirs(HOME, exist_ok=True)
    line = '%s %s' % (datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), msg)
    if sys.stdout.isatty(): print(line)     # под cron вывод не дублируем: в файл пишем сами
    with open(LOG, 'a', encoding='utf-8') as f: f.write(line + '\n')

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def psql(sql):
    cmd = ['docker', 'exec', '-i', CONTAINER, 'psql', '-U', 'nocobase', '-d', 'nocobase', '-At', '-v', 'ON_ERROR_STOP=1']
    cmd = ['ssh', SSH, 'sudo -n ' + ' '.join(cmd)] if SSH else ['sudo', '-n'] + cmd
    r = subprocess.run(cmd, input=sql.encode(), capture_output=True)
    if r.returncode: raise RuntimeError('SQL: ' + r.stderr.decode()[:400])
    return r.stdout.decode()

def norm(s): return (s or '').rstrip('\n')
def h(s): return hashlib.sha256(norm(s).encode('utf-8')).hexdigest()[:16]

def live_code(uid):
    out = psql("select coalesce(options::json#>>'%s','') from \"flowModels\" where uid='%s'" % (CODE_PATH, uid.replace("'", '')))
    return norm(out)

def write_live(uid, code):
    lit = json.dumps(code)
    tag = '$JSONCODE$'
    assert tag not in lit
    sql = ("update \"flowModels\" set options = jsonb_set(options::jsonb, '%s', %s%s%s::jsonb)::json where uid = '%s';\n"
           % (CODE_PATH, tag, lit, tag, uid.replace("'", '')))
    out = psql(sql)
    if 'UPDATE 1' not in out: raise RuntimeError('блок %s не найден в NocoBase' % uid)

def blocks():
    return json.load(open(os.path.join(REPO, 'deploy', 'blocks.json'), encoding='utf-8'))

def repo_code(path):
    return norm(open(os.path.join(REPO, path), encoding='utf-8').read())

def load_state():
    try: return json.load(open(STATE, encoding='utf-8'))
    except Exception: return {}
def save_state(st):
    os.makedirs(HOME, exist_ok=True)
    json.dump(st, open(STATE, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

def git(*args):
    r = run(['git', '-C', REPO] + list(args))
    if r.returncode: raise RuntimeError('git %s: %s' % (' '.join(args), r.stderr.strip()[:300]))
    return r.stdout.strip()

def notify(title, text):
    for uid in NOTIFY:
        try:
            lit_t, lit_c = title.replace("'", "''"), text.replace("'", "''")
            psql("insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options) "
                 "values (gen_random_uuid(),now(),now(),%d,'status','%s','%s','unread',(extract(epoch from now())*1000)::bigint,'{}'::json)" % (uid, lit_t, lit_c))
        except Exception as e:
            log('уведомление не доставлено: %s' % e)

# ---- сравнение ----
def compare():
    """[(uid, path, state)] где state: same | repo_newer | drift | missing_live"""
    st = load_state().get('blocks', {})
    res = []
    for uid, path in blocks().items():
        rc, lc = repo_code(path), live_code(uid)
        if not lc: res.append((uid, path, 'missing_live')); continue
        if h(rc) == h(lc): res.append((uid, path, 'same')); continue
        deployed = st.get(uid)
        # живой код отличается от репозитория: если он такой же, как мы выкладывали в прошлый раз, значит в репо просто новее;
        # иначе кто-то правил блок прямо в интерфейсе (дрейф)
        res.append((uid, path, 'repo_newer' if (deployed is None or h(lc) == deployed) else 'drift'))
    return res

def cmd_status():
    for uid, path, s in compare():
        print('%-14s %-28s %s' % (uid, path, {'same': 'совпадает', 'repo_newer': 'в репозитории новее (будет выложено)',
              'drift': 'ЖИВОЙ КОД ПРАВИЛИ В ИНТЕРФЕЙСЕ (не совпадает ни с репо, ни с прошлой выкладкой)', 'missing_live': 'блока нет в NocoBase'}[s]))
    st = load_state()
    print('выложен коммит:', st.get('sha') or '—', '| заморозка на:', st.get('hold') or '—')

def backup(uids):
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    d = os.path.join(HOME, 'backups', ts)
    os.makedirs(d, exist_ok=True)
    for uid in uids: open(os.path.join(d, uid + '.js'), 'w', encoding='utf-8').write(live_code(uid))
    return d

def deploy(force=False, why=''):
    rows = compare()
    todo = [(u, p) for u, p, s in rows if s == 'repo_newer' or (force and s == 'drift')]
    drift = [u for u, p, s in rows if s == 'drift' and not force]
    if drift: log('ВНИМАНИЕ: блоки %s правили прямо в интерфейсе NocoBase, автовыкладка их не перезаписывает '
                  '(export → закоммитить, либо deploy --force)' % ', '.join(drift))
    st = load_state()
    sha = git('rev-parse', 'HEAD')
    if not todo:
        st['sha'] = sha
        st.setdefault('blocks', {}).update({u: h(live_code(u)) for u, p, s in rows if s in ('same',)})
        save_state(st)
        return [], drift
    bdir = backup([u for u, p in todo])
    done = []
    for uid, path in todo:
        code = repo_code(path)
        if len(code) < 200: raise RuntimeError('%s слишком мал, выкладка отменена' % path)
        write_live(uid, code)
        if h(live_code(uid)) != h(code): raise RuntimeError('после записи %s код в NocoBase не совпал с файлом' % uid)
        st.setdefault('blocks', {})[uid] = h(code)
        done.append(path)
    st['sha'] = sha; st['last_backup'] = bdir; st.pop('hold', None)
    save_state(st)
    subj = git('log', '-1', '--format=%s')
    log('выложено: %s (коммит %s «%s»)%s; резервная копия %s' % (', '.join(done), sha[:7], subj, ' ' + why if why else '', bdir))
    return done, drift

def ci_state(sha):
    slug = run(['git', '-C', REPO, 'remote', 'get-url', 'origin']).stdout.strip().replace('.git', '').split('github.com')[-1].strip(':/')
    req = urllib.request.Request('https://api.github.com/repos/%s/commits/%s/check-runs' % (slug, sha), headers={'User-Agent': 'nb-deploy', 'Accept': 'application/vnd.github+json'})
    try: data = json.load(urllib.request.urlopen(req, timeout=20))
    except urllib.error.HTTPError as e: return 'error', 'GitHub API %s' % e.code
    except Exception as e: return 'error', str(e)
    runs = data.get('check_runs', [])
    if not runs: return 'pending', 'проверки ещё не запущены'
    if any(r['status'] != 'completed' for r in runs): return 'pending', 'проверки выполняются'
    bad = [r['name'] for r in runs if r['conclusion'] not in ('success', 'neutral', 'skipped')]
    return ('failure', 'не прошли: ' + ', '.join(bad)) if bad else ('success', '')

def cmd_auto():
    st = load_state()
    if not os.path.isdir(os.path.join(REPO, '.git')): sys.exit('нет рабочей копии %s (git clone …)' % REPO)
    git('fetch', '-q', 'origin', 'main')
    remote = git('rev-parse', 'origin/main')
    if remote == st.get('hold'): return
    head = git('rev-parse', 'HEAD') if os.path.exists(os.path.join(REPO, '.git')) else None
    if remote == st.get('sha') and remote == head:
        # новых коммитов нет; но ловим дрейф раз в проход, не шумя в лог повторно
        return
    if CI_REQUIRED:
        state, why = ci_state(remote)
        if state == 'pending': return
        if state != 'success':
            if st.get('failed_sha') != remote:
                st['failed_sha'] = remote; save_state(st)
                log('коммит %s НЕ выложен: CI %s' % (remote[:7], why))
                notify('Выкладка CRM: проверки не прошли', 'Коммит %s не выложен: %s' % (remote[:7], why))
            return
    git('checkout', '-q', '-f', remote)
    try:
        done, drift = deploy()
    except Exception as e:
        log('ОШИБКА выкладки коммита %s: %s' % (remote[:7], e)); notify('Выкладка CRM: ошибка', str(e)[:200]); return
    subj = git('log', '-1', '--format=%s')
    if done: notify('Выкладка CRM: обновлено', '%s — %s' % (remote[:7], subj))
    if drift: notify('Выкладка CRM: ручные правки', 'Блоки %s правили в интерфейсе, автовыкладка их не трогает' % ', '.join(drift))

def cmd_rollback():
    st = load_state()
    d = st.get('last_backup')
    if not d or not os.path.isdir(d): sys.exit('нет резервной копии')
    for f in sorted(os.listdir(d)):
        uid = f[:-3]; code = norm(open(os.path.join(d, f), encoding='utf-8').read())
        if code: write_live(uid, code); st.setdefault('blocks', {})[uid] = h(code)
    st['hold'] = git('rev-parse', 'HEAD') if os.path.exists(os.path.join(REPO, '.git')) else st.get('sha')
    save_state(st)
    log('откат из %s; автовыкладка заморожена на коммите %s до появления нового' % (d, (st['hold'] or '')[:7]))
    notify('Выкладка CRM: откат', 'Блоки возвращены из резервной копии, автовыкладка заморожена до нового коммита')

def cmd_init():
    rows = compare()
    st = {'sha': git('rev-parse', 'HEAD'), 'blocks': {u: h(live_code(u)) for u, p, s in rows if s != 'missing_live'}}
    save_state(st)
    for u, p, s in rows: print(u, p, s)
    log('инициализация: считаем выложенным коммит %s' % st['sha'][:7])

def cmd_export(dest):
    os.makedirs(dest, exist_ok=True)
    for uid, path in blocks().items():
        code = live_code(uid)
        if code:
            out = os.path.join(dest, os.path.basename(path))
            open(out, 'w', encoding='utf-8').write(code + '\n'); print('сохранено', out)

if __name__ == '__main__':
    a = sys.argv[1:] or ['status']
    if a[0] == 'status': cmd_status()
    elif a[0] == 'init': cmd_init()
    elif a[0] == 'auto': cmd_auto()
    elif a[0] == 'deploy':
        done, drift = deploy(force='--force' in a); print('выложено:', done or 'нечего')
    elif a[0] == 'rollback': cmd_rollback()
    elif a[0] == 'export': cmd_export(a[a.index('--to') + 1] if '--to' in a else '.')
    else: sys.exit(__doc__)
