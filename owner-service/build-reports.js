// Демо-отчёты: собирает HTML каждого отчёта и печатает в reports/<id>.pdf через headless Chrome.
// Запуск: node build-reports.js [id]. В рабочей версии то же самое делает ночной cron после закрытия месяца.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { REPORTS } = require('./demo');
const { reportHtml } = require('./report');

const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'].find(fs.existsSync);
if (!CHROME) { console.error('Нужен Chrome или Chromium (переменная CHROME)'); process.exit(1); }
const OUT = path.join(__dirname, 'reports');
fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kn-reports-'));

for (const r of REPORTS.filter((r) => !process.argv[2] || r.id === process.argv[2])) {
  const html = path.join(tmp, r.id + '.html');
  fs.writeFileSync(html, reportHtml(r));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files', '--virtual-time-budget=8000',
    '--user-data-dir=' + path.join(tmp, 'profile-' + r.id), '--print-to-pdf=' + path.join(OUT, r.id + '.pdf'), 'file://' + html], { stdio: 'ignore' });
  console.log(r.id + '.pdf');
}
fs.rmSync(tmp, { recursive: true, force: true });
