#!/bin/sh
# Сборка расширения Guacamole kn-brand.jar: исходники из kn-brand/ + фирменный кит из ../brand/.
# kn-login.css = brand.css (пути шрифтов → app/ext/kn-brand/, т.к. Guacamole склеивает CSS расширений в /app.css) + login.css.
# Выкладка (на svc, вручную — /opt/remote-portal только для root):
#   sudo cp -p /opt/remote-portal/guac-home/extensions/kn-brand.jar /opt/remote-portal/kn-brand.jar.bak-<дата>
#   sudo cp kn-brand.jar /opt/remote-portal/guac-home/extensions/ && sudo docker restart remote-guacamole   (рвёт текущие сеансы!)
#   sudo cp pages/register.html pages/remote_help.html /opt/esxi-status/   (читаются на каждый запрос, рестарт не нужен)
set -eu
cd "$(dirname "$0")"
B=../brand; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
cp -R kn-brand/. "$T"/
rm -f "$T"/login.css
cp $B/brand.css $B/kn-mark.svg $B/kn-logo-white.svg $B/*.woff2 "$T"/
sed 's#url(fira-#url(app/ext/kn-brand/fira-#' $B/brand.css > "$T"/kn-login.css
cat kn-brand/login.css >> "$T"/kn-login.css
rm -f kn-brand.jar
(cd "$T" && zip -qrX "$OLDPWD/kn-brand.jar" .)
unzip -l kn-brand.jar | tail -1
