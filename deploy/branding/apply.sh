#!/bin/sh
# Фирменный стиль CRM по брендбуку v1.3 — запускать на svc из чекаута репозитория: sh deploy/branding/apply.sh
# Что делает: шрифты и знак → storage/uploads/brand/, логотип шапки → SVG (вложение id=1), global.css и index.html.tpl
# переписываются НА МЕСТЕ (они примонтированы в контейнер одиночными файлами — новый inode контейнер не увидит),
# тема «Консалт» (themeConfig id=5) — шрифт, цвета, скругления. Перезапуск NocoBase не нужен, пользователям — обновить страницу.
# Откат: sh deploy/branding/apply.sh rollback
set -eu
R=$(cd "$(dirname "$0")/../.." && pwd)
NB=$HOME/nocobase; UP=$NB/storage/uploads; BR=$NB/branding; TAG=bak-20261028-brand13
PSQL="sudo docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -v ON_ERROR_STOP=1 -At"

if [ "${1:-}" = rollback ]; then
  sudo sh -c "cat $BR/global.css.$TAG > $BR/global.css; cat $BR/index.html.tpl.$TAG > $BR/index.html.tpl"
  $PSQL < $BR/theme.$TAG.sql
  sudo cp -p $UP/kn-logo-header.svg.$TAG $UP/kn-logo-header.svg
  echo "update attachments set size=$(stat -c %s $UP/kn-logo-header.svg) where id=1;" | $PSQL
  echo "откат выполнен"; exit 0
fi

# резервные копии (один раз — повторный запуск их не перезаписывает)
[ -f $BR/global.css.$TAG ] || cp -p $BR/global.css $BR/global.css.$TAG
[ -f $BR/index.html.tpl.$TAG ] || cp -p $BR/index.html.tpl $BR/index.html.tpl.$TAG
[ -f $UP/kn-logo-header.svg.$TAG ] || sudo cp -p $UP/kn-logo-header.svg $UP/kn-logo-header.svg.$TAG
[ -f $BR/theme.$TAG.sql ] || echo "select format('update \"themeConfig\" set config = %L::json where id = 5;', config::text) from \"themeConfig\" where id = 5;" | $PSQL > $BR/theme.$TAG.sql

# кит: шрифты и знак
sudo mkdir -p $UP/brand
sudo cp $R/brand/tilda-sans-vf.woff2 $R/brand/kn-mark.svg $R/brand/kn-mark-white.svg $UP/brand/
sudo cp $R/brand/kn-logo-white.svg $UP/kn-logo-header.svg
echo "update attachments set filename='kn-logo-header.svg', extname='.svg', mimetype='image/svg+xml', size=$(stat -c %s $R/brand/kn-logo-white.svg) where id=1;" | $PSQL

# global.css и шаблон — на месте
sudo sh -c "cat $R/deploy/branding/global.css > $BR/global.css; cat $R/deploy/branding/index.html.tpl > $BR/index.html.tpl"

# тема «Консалт»
$PSQL <<'SQL'
update "themeConfig" set config = (config::jsonb || jsonb_build_object('token', config::jsonb->'token' || '{
  "fontFamily": "\"Segoe UI\", system-ui, -apple-system, Roboto, \"Helvetica Neue\", Arial, sans-serif",
  "colorPrimary": "#1c2d58", "colorInfo": "#1c2d58", "colorLink": "#2f4a8a",
  "colorSuccess": "#2f7d4f", "colorWarning": "#8a5a00", "colorError": "#c23b3b",
  "colorText": "#1f2433", "colorTextSecondary": "#5b6478", "colorTextTertiary": "#8a92a3",
  "colorBorder": "#c3cad8", "colorBorderSecondary": "#dfe3ec", "colorBgLayout": "#f3f5f9", "colorFillAlter": "#f3f5f9",
  "borderRadius": 6, "borderRadiusLG": 8, "borderRadiusSM": 4,
  "colorBgHeader": "#1c2d58", "colorBgHeaderMenuHover": "#2f4a8a", "colorBgHeaderMenuActive": "#2f4a8a"
}'::jsonb))::json where id = 5;
SQL
echo "готово: обновите страницу CRM (Ctrl+Shift+R); версию global.css в index.html контейнера поднять вручную (см. README/память)"
