#!/bin/bash
# Ночная очистка: прочитанные сообщения колокольчика старше суток удаляются (интерфейс их и так не показывает)
sudo -n docker exec -i nocobase-postgres-1 psql -U nocobase -d nocobase -At -c "delete from \"notificationInAppMessages\" where status = 'read' and \"updatedAt\" < now() - interval '1 day'"
