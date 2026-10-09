#!/bin/sh
# forced-command ключа DC в ~/.ssh/authorized_keys svc: отдаёт только последние бэкапы, больше ничего не умеет.
#   command="/home/ubuntu/nb_bik/serve_backup.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 ...
# Без команды — Excel (так ходит старая задача «NocoBase Excel pull»), «db» — дамп базы, «uploads» — файлы, «svc» — конфиги svc (все три зашифрованы age, «X.sha» — их sha256), «files_list»/«files» — папка «Файлы» к Excel (сканы по договорам).
case "$SSH_ORIGINAL_COMMAND" in
  ''|excel) exec cat /home/ubuntu/nb_backup/excel/Договоры_последние.xlsx ;;
  db)       exec cat /home/ubuntu/nb_backup/daily/db_latest.sql.gz.age ;;        # зашифровано age (encrypt_latest.sh)
  db.sha)   exec cat /home/ubuntu/nb_backup/daily/db_latest.sql.gz.age.sha256 ;;
  uploads)  exec cat /home/ubuntu/nb_backup/daily/uploads_latest.tar.gz.age ;;
  uploads.sha) exec cat /home/ubuntu/nb_backup/daily/uploads_latest.tar.gz.age.sha256 ;;
  svc)      exec cat /home/ubuntu/nb_backup/daily/svc_latest.tar.gz.age ;;
  svc.sha)  exec cat /home/ubuntu/nb_backup/daily/svc_latest.tar.gz.age.sha256 ;;
  files_list) cd /home/ubuntu/nb_backup/excel && find Файлы -type f -printf '%P %s %T@\n' | sort ;;   # дешёвая сверка: менялись ли файлы
  files)    cd /home/ubuntu/nb_backup/excel && exec python3 -c 'import os, sys, zipfile   # zip, а не tar: имена в UTF-8 с флагом, Windows (Expand-Archive) читает кириллицу верно
z = zipfile.ZipFile(sys.stdout.buffer, "w", zipfile.ZIP_STORED)
for d, _, fs in os.walk("Файлы"):
    for f in sorted(fs): z.write(os.path.join(d, f))
z.close()' ;;
  *)        echo "unknown" >&2; exit 1 ;;
esac
