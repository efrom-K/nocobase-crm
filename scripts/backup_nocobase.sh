#!/bin/sh
# Ночной бэкап NocoBase: полный дамп PostgreSQL + загруженные файлы (storage/uploads). Хранит 30 последних дней.
# cron на svc: 45 2 * * * /home/ubuntu/nb_bik/backup_nocobase.sh >> /home/ubuntu/nb_bik/backup.log 2>&1
# Восстановление базы: zcat db_ДАТА.sql.gz | sudo docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase (в пустую базу)
set -e
DIR=/home/ubuntu/nb_backup/daily
D=$(date +%F)
mkdir -p "$DIR"
sudo -n docker exec nocobase-postgres-1 pg_dump -U nocobase -d nocobase | gzip > "$DIR/db_$D.sql.gz.tmp"
mv "$DIR/db_$D.sql.gz.tmp" "$DIR/db_$D.sql.gz"
sudo -n docker exec nocobase-app-1 tar -C /app/nocobase/storage -czf - uploads > "$DIR/uploads_$D.tar.gz"
find "$DIR" -name 'db_*.sql.gz' -mtime +30 -delete
find "$DIR" -name 'uploads_*.tar.gz' -mtime +30 -delete
echo "$(date '+%F %T') ok $(du -h "$DIR/db_$D.sql.gz" | cut -f1) db, $(du -h "$DIR/uploads_$D.tar.gz" | cut -f1) uploads"
