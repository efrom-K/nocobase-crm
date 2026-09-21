#!/bin/bash
# Ночная очистка: прочитанные сообщения колокольчика старше суток удаляются.
# Интерфейс прочитанные и так не показывает; удалять их сразу (триггером) нельзя — штатный клиент
# не обновляет счётчики, если канал внезапно опустел. cron: 30 3 * * *
docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -At \
  -c "delete from \"notificationInAppMessages\" where status = 'read' and \"updatedAt\" < now() - interval '1 day'"
