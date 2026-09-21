#!/usr/bin/env python3
"""Проверки репозитория (запускаются в GitHub Actions и локально: python3 scripts/ci_checks.py).

1. JS-блоки: синтаксис (node --check, как выполняет песочница NocoBase: тело async-функции) и запрет API, которых в песочнице нет.
2. Python-скрипты компилируются, JSON-файлы валидны, deploy/blocks.json ссылается на существующие файлы.
3. Личные данные и секреты: частные IP, e-mail не из белого списка, токены/ключи, данные в schema.sql, запрещённые файлы;
   плюс необязательный приватный список слов в переменной CI_DENYLIST_REGEX.
Код выхода 1 — есть нарушения (выкладка на сервер после этого не произойдёт).
"""
import glob, json, os, py_compile, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
errors = []
def err(msg): errors.append(msg)

# ---- 1. JS-блоки ----
SANDBOX_MISSING = ['MutationObserver', 'requestAnimationFrame', 'URLSearchParams', 'new FormData']   # в песочнице JS-блоков NocoBase их нет
for f in sorted(glob.glob('src/*.js')):
    code = open(f, encoding='utf-8').read()
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write('(async()=>{\n' + code + '\n})()')
        tmp = t.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode: err('%s: синтаксическая ошибка JS\n%s' % (f, r.stderr.strip()[:400]))
    for name in SANDBOX_MISSING:
        # упоминание в комментарии допустимо, вызов — нет
        for i, line in enumerate(code.splitlines(), 1):
            if name in line and not line.strip().startswith('//') and '// ' + name not in line and 'песочниц' not in line:
                err('%s:%d: %s недоступен в песочнице JS-блоков NocoBase (блок упадёт целиком)' % (f, i, name))

# ---- 2. Python / JSON / карта блоков ----
for f in sorted(glob.glob('scripts/**/*.py', recursive=True) + glob.glob('deploy/*.py')):
    try: py_compile.compile(f, doraise=True)
    except py_compile.PyCompileError as e: err('%s: %s' % (f, e.msg[:300]))
for f in sorted(glob.glob('**/*.json', recursive=True)):
    if f.startswith(('node_modules/', '.git/')): continue
    try: json.load(open(f, encoding='utf-8'))
    except Exception as e: err('%s: невалидный JSON (%s)' % (f, e))
if os.path.exists('deploy/blocks.json'):
    for uid, path in json.load(open('deploy/blocks.json', encoding='utf-8')).items():
        if not os.path.exists(path): err('deploy/blocks.json: %s → файла %s нет' % (uid, path))
        elif os.path.getsize(path) < 200: err('%s: подозрительно маленький файл блока' % path)

# ---- 3. личные данные и секреты ----
tracked = subprocess.run(['git', 'ls-files'], capture_output=True, text=True).stdout.split()
FORBIDDEN_FILES = re.compile(r'(^|/)(\.env|.*\.pem|.*\.key|id_(rsa|ed25519).*|.*\.dump|.*\.pfx|.*\.kdbx)$')
PRIVATE_IP = re.compile(r'\b(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b')
EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}')
EMAIL_OK = re.compile(r'(@example\.(com|ru|org)$|@users\.noreply\.github\.com$|@anthropic\.com$|@nocobase\.com$|^name@|^user@|^noreply@)')
SECRET = [
    (re.compile(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}'), 'JWT-токен'),
    (re.compile(r'-----BEGIN (RSA |OPENSSH |EC |)PRIVATE KEY-----'), 'приватный ключ'),
    (re.compile(r'\b(ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{20,}'), 'токен GitHub'),
    (re.compile(r'\bAKIA[0-9A-Z]{16}\b'), 'ключ AWS'),
    (re.compile(r'\bsk-[A-Za-z0-9]{20,}'), 'API-ключ'),
    (re.compile(r'(?i)\b(password|passwd|secret|api[_-]?key)\b["\']?\s*[:=]\s*["\'][^"\'\s${}]{8,}["\']'), 'пароль/секрет в коде'),
    (re.compile(r'\b[0-9a-f]{40,}\b'), 'длинная hex-строка (ключ/хэш?)'),
]
deny = os.environ.get('CI_DENYLIST_REGEX', '').strip()
denyre = re.compile(deny, re.I) if deny else None
for f in tracked:
    if FORBIDDEN_FILES.search(f): err('%s: такой файл не должен лежать в репозитории' % f)
    if not os.path.isfile(f) or os.path.getsize(f) > 3_000_000: continue
    try: text = open(f, encoding='utf-8').read()
    except UnicodeDecodeError: continue
    if f.endswith('db/schema.sql') and re.search(r'^(COPY|INSERT) ', text, re.M): err('%s: в схеме не должно быть данных' % f)
    for i, line in enumerate(text.splitlines(), 1):
        if f.endswith(('ci_checks.py', 'ci.yml')): continue     # сами шаблоны проверок
        m = PRIVATE_IP.search(line)
        if m: err('%s:%d: внутренний IP %s' % (f, i, m.group(0)))
        for em in EMAIL.finditer(line):
            if not EMAIL_OK.search(em.group(0)): err('%s:%d: e-mail %s' % (f, i, em.group(0)))
        for rx, what in SECRET:
            if rx.search(line): err('%s:%d: похоже на %s' % (f, i, what))
        if denyre and denyre.search(line): err('%s:%d: совпало с приватным списком слов CI_DENYLIST_REGEX' % (f, i))

if errors:
    print('ПРОВЕРКИ НЕ ПРОЙДЕНЫ (%d):' % len(errors))
    for e in errors[:60]: print(' -', e)
    sys.exit(1)
print('Проверки пройдены: %d файлов в git, блоков JS: %d' % (len(tracked), len(glob.glob('src/*.js'))))
