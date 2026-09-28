#!/bin/bash
# Бэкап NocoBase: полный дамп PostgreSQL + загруженные файлы (storage/uploads). Хранит 30 последних дней.
# cron на svc (три раза в день, чтобы дневная работа не терялась до ночи):
#   45 2,13,19 * * * /home/ubuntu/nb_bik/backup_nocobase.sh >> /home/ubuntu/nb_bik/backup.log 2>&1
# Копия вне svc: DC забирает db_latest / uploads_latest через ключ с forced-command (serve_backup.sh) в C:\NocoBase-Backup,
# C: DC входит в Veeam OfficeServers-Backup → внешний сервер бэкапов.
# Сбой — уведомление в колокольчик NocoBase администратору (NB_NOTIFY_USER_IDS, по умолчанию 2).
# Восстановление базы: zcat db_ДАТА.sql.gz | sudo docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase (в пустую базу)
set -eo pipefail
DIR=/home/ubuntu/nb_backup/daily
T=$(date +%F_%H%M)
PSQL="sudo -n docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -q"
mkdir -p "$DIR"

fail() {
  echo "$(date '+%F %T') FAIL $1"
  for uid in ${NB_NOTIFY_USER_IDS:-2}; do
    $PSQL -c "insert into \"notificationInAppMessages\"(id,\"createdAt\",\"updatedAt\",\"userId\",\"channelName\",title,content,status,\"receiveTimestamp\",options)
      values (gen_random_uuid(),now(),now(),$uid,'status','Бэкап CRM не сделан','$1 — проверьте ~/nb_bik/backup.log на svc','unread',(extract(epoch from now())*1000)::bigint,'{}'::json)" || true
  done
  exit 1
}
trap 'fail "ошибка на строке $LINENO"' ERR

sudo -n docker exec nocobase-postgres-1 pg_dump -U nocobase -d nocobase | gzip > "$DIR/db_$T.sql.gz.tmp"
# дамп целый, только если pg_dump дошёл до конца
zcat "$DIR/db_$T.sql.gz.tmp" | tail -5 | grep -q 'PostgreSQL database dump complete' || fail "дамп базы оборван"
mv "$DIR/db_$T.sql.gz.tmp" "$DIR/db_$T.sql.gz"
sudo -n docker exec nocobase-app-1 tar -C /app/nocobase/storage -czf - uploads > "$DIR/uploads_$T.tar.gz.tmp"
gzip -t "$DIR/uploads_$T.tar.gz.tmp" || fail "архив файлов повреждён"
mv "$DIR/uploads_$T.tar.gz.tmp" "$DIR/uploads_$T.tar.gz"
ln -sf "db_$T.sql.gz" "$DIR/db_latest.sql.gz"
ln -sf "uploads_$T.tar.gz" "$DIR/uploads_latest.tar.gz"
find "$DIR" -name 'db_20*.sql.gz' -mtime +30 -delete
find "$DIR" -name 'uploads_20*.tar.gz' -mtime +30 -delete
echo "$(date '+%F %T') ok $(du -h "$DIR/db_$T.sql.gz" | cut -f1) db, $(du -h "$DIR/uploads_$T.tar.gz" | cut -f1) uploads"
