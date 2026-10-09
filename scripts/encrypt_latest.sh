#!/bin/sh
# Зашифрованные копии последних бэкапов — только их svc отдаёт наружу (DC → C:\NocoBase-Backup → Veeam), см. serve_backup.sh.
# age по ОТКРЫТОМУ ключу ~/nb_bik/backup.age.pub; закрытого ключа на svc нет (Vaultwarden «Ключ шифрования бэкапов CRM»).
# Рядом sha256 — по нему DC проверяет, что файл скачался целиком. Вызывается в конце backup_nocobase.sh и backup_svc_configs.sh.
# Расшифровать: age -d -i ключ.txt db_latest.sql.gz.age > db.sql.gz
set -e
D=/home/ubuntu/nb_backup/daily; R=/home/ubuntu/nb_bik/backup.age.pub
for n in db_latest.sql.gz uploads_latest.tar.gz svc_latest.tar.gz; do
  f=$D/$n
  [ -e "$f" ] || continue
  [ "$D/$n.age" -nt "$f" ] && continue        # копия свежее исходника — уже зашифрован
  age -R "$R" -o "$D/$n.age.tmp" "$f"
  sha256sum "$D/$n.age.tmp" | cut -d' ' -f1 > "$D/$n.age.sha256.tmp"
  chmod 600 "$D/$n.age.tmp" "$D/$n.age.sha256.tmp"
  mv "$D/$n.age.tmp" "$D/$n.age"; mv "$D/$n.age.sha256.tmp" "$D/$n.age.sha256"
done
