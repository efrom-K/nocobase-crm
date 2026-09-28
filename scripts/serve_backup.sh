#!/bin/sh
# forced-command ключа DC в ~/.ssh/authorized_keys svc: отдаёт только последние бэкапы, больше ничего не умеет.
#   command="/home/ubuntu/nb_bik/serve_backup.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 ...
# Без команды — Excel (так ходит старая задача «NocoBase Excel pull»), «db» — дамп базы, «uploads» — файлы.
case "$SSH_ORIGINAL_COMMAND" in
  ''|excel) exec cat /home/ubuntu/nb_backup/excel/Договоры_последние.xlsx ;;
  db)       exec cat /home/ubuntu/nb_backup/daily/db_latest.sql.gz ;;
  uploads)  exec cat /home/ubuntu/nb_backup/daily/uploads_latest.tar.gz ;;
  *)        echo "unknown" >&2; exit 1 ;;
esac
