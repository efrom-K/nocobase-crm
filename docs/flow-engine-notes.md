# NocoBase flow-engine: грабли и приёмы

Выведено на практике на этом проекте (NocoBase 2.x, `nocobase/nocobase:latest`).

## Хранение страниц
- Блоки страницы лежат в таблице `flowModels` (`uid`, `name`, `options` JSON: `use`/`parentId`/`subKey`/`subType`/`props`/`stepParams`/`sortIndex`) и в closure-таблице `flowModelTreePath` (`ancestor`/`descendant`/`depth`/`type`/`async`/`sort`).
- REST `flowModels:create` не заполняет closure полностью. Для ручного создания дерева нужна self-строка `(uid,uid,0,type=<subKey>)` и по строке на **каждого** предка с накоплением depth.
- `flowModelTreePath.type` на self-строке критичен: поиск `findOne?parentId=X&subKey=Y` смотрит на него, а не на `options.subKey`. Без него грид молча рендерится пустым.
- `BlockGridModel` рисует **все** потомки `subKey:"items"` из closure, а не только перечисленные в `layout`. Чтобы убрать блок, удаляйте строку `flowModels` и все его строки closure.
- Порядок блоков в одной ячейке определяется `sortIndex`, а не порядком в `layout.items`.

## JS-блоки (`JSBlockModel`)
- Код в `options.stepParams.jsSettings.runJs.code`. Песочница SES/lockdown: **нет** `URLSearchParams`, `requestAnimationFrame`, `FormData`; **есть** `fetch`, `XMLHttpRequest`, `Blob`, `setTimeout`, `localStorage` (токен: `NOCOBASE_TOKEN`).
- `ctx.render()` надёжен только синхронно при первом вызове; для async-данных рендерим заглушку и пишем в сохранённый DOM-узел.
- Ошибка до первого `try{}` в async-коде — unhandled rejection без видимого эффекта. При «тихо не работает» смотрите runtime-исключения.
- Загрузка файлов без `FormData`: multipart собирается вручную из `Blob`, `POST /api/attachments:upload`, привязка `POST /api/<coll>/<id>/<m2m>:add` с телом `[fileId]`.
- Файлы из `/storage/uploads` отдаются с `Content-Disposition: attachment`. Для «Открыть» — `fetch → blob → URL.createObjectURL → window.open`.
- `props.title` у JS-действий и JS-колонок ненадёжен; параметры «settings flow» с `defaultParams` перезаписывают `props`, поэтому задавайте зеркально `stepParams.<flow>.<step>`.
- Клик по строке таблицы открывает самодельную модалку (не настоящий popup NocoBase): настоящий popup требует специальной структуры дерева и при ошибке роняет всю страницу.

## Нативные блоки
- `DetailsBlockModel` привязывается к одной записи только через `stepParams.resourceSettings.init.filterByTk` (не `filter`); `init` держать минимальным.
- Синтаксис фильтров API: `{"$and":[{f:v}]}`, `{"$or":[{f:{"$includes":v}}]}`.

## Прочее
- Коллекции и поля надёжнее создавать через REST (`collections:create`, `collections/<name>/fields:create`): рестарт приложения не нужен.
- Большой SQL (например, JS-блок > 128 КБ) передавайте в `psql` через stdin, а не аргументом (лимит длины аргумента ОС).
- Проверку делайте реальным браузером (Playwright/CDP): вход, клики, чтение DOM. «У меня работает» без этого не считается.
