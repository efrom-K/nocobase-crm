'use strict';

function positiveId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

function participants(task) {
  return [task.author_id, task.executor_id, task.controller_id].map(positiveId);
}

function createTaskActions({nb, list, q, ApiError}) {
  async function event(user, task, kind, text, fileId) {
    await nb('POST', 'crm_task_events:create', {
      task_id: task.id, author_id: user.id, author_name: user.name,
      kind, text, file_id: fileId || null
    });
  }
  async function notify(user, task, ids, text) {
    await Promise.allSettled([...new Set(ids.map(positiveId))].filter(id => id && id !== Number(user.id)).map(id =>
      nb('POST', 'task_notifications:create', {
        user_id: id, title: 'Задача №' + task.id, text, url: '/admin/tskpage01?open=task:' + task.id
      })
    ));
  }
  return async function taskAction(user, input) {
    const id = positiveId(input?.id);
    if (!id || !['assign', 'observe', 'comment', 'event'].includes(input?.action)) throw new ApiError(400, 'Некорректное действие');
    const [task] = (await list('crm_tasks', '&filter=' + q({id}) + '&appends=observers')) || [];
    if (!task) throw new ApiError(404, 'Задача не найдена');
    const actor = Number(user.id), people = participants(task);
    const observers = (task.observers || []).map(person => positiveId(person.id));
    if (input.action === 'comment' || input.action === 'event') {
      const comment = input.action === 'comment';
      if (!people.includes(actor) && !(comment && observers.includes(actor)) && !user.isAdmin) {
        throw new ApiError(403, 'Нет доступа к задаче');
      }
      const kind = comment ? 'comment' : input.kind;
      if (!comment && !['create', 'status', 'due', 'edit'].includes(kind)) throw new ApiError(400, 'Некорректное событие');
      const text = typeof input.text === 'string' ? input.text.trim() : '';
      const file = input.fileId == null ? null : positiveId(input.fileId);
      if ((!text && !file) || text.length > 16000 || (input.fileId != null && !file)) throw new ApiError(400, 'Некорректное сообщение');
      if (file) {
        const owned = await list('attachments', '&fields=id&filter=' + q({id: file, createdById: actor}));
        if (!owned?.length) throw new ApiError(403, 'Файл недоступен');
      }
      await event(user, task, kind, text || 'Файл', file);
      if (comment) await notify(user, task, [...people, ...observers], user.name + ': ' + (text || 'приложил файл').slice(0, 300));
      return {};
    }
    if (positiveId(task.author_id) !== actor) throw new ApiError(403, 'Изменить участников может только постановщик');
    if (['closed', 'cancelled'].includes(task.status)) throw new ApiError(409, 'Задача уже закрыта');
    if (input.action === 'observe') {
      if (!Array.isArray(input.users) || input.users.length > 50 || input.users.some(value => !positiveId(value))) {
        throw new ApiError(400, 'Некорректный список наблюдателей');
      }
      const ids = [...new Set(input.users.map(positiveId))].filter(id => !observers.includes(id));
      if (!ids.length) return {};
      const users = await list('users', '&fields=id,nickname,username&filter=' + q({id: {$in: ids}}));
      if (!users || users.length !== ids.length) throw new ApiError(400, 'Наблюдатель не найден');
      await nb('POST', 'crm_tasks/' + task.id + '/observers:add', ids);
      await event(user, task, 'edit', 'Добавил наблюдателей: ' + users.map(u => u.nickname || u.username).join(', '));
      await notify(user, task, ids, 'Вас добавили наблюдателем: ' + task.title);
      return {};
    }
    const key = typeof input.person === 'string' && /^([ue])([1-9]\d*)$/.exec(input.person);
    const personId = key && positiveId(key[2]);
    if (!personId) throw new ApiError(400, 'Выберите исполнителя');
    let executorId = null, name;
    if (key[1] === 'e') {
      const [employee] = (await list('crm_employees', '&filter=' + q({id: personId}))) || [];
      if (employee && employee.status !== 'fired') {
        executorId = positiveId(employee.user_id);
        name = employee.full_name;
      }
    } else {
      const [account] = (await list('users', '&fields=id,nickname,username&filter=' + q({id: personId}))) || [];
      if (account) {
        executorId = personId;
        name = account.nickname || account.username;
      }
    }
    if (!name) throw new ApiError(400, 'Исполнитель не найден');
    if (executorId === positiveId(task.executor_id) && (executorId || name === task.executor_name)) return {};
    await nb('POST', 'crm_tasks:update?filterByTk=' + task.id, {executor_id: executorId, executor_name: name});
    await event(user, task, 'assign', 'Передал: ' + (task.executor_name || '—') + ' → ' + name);
    await notify(user, task, [executorId], 'Вам передана задача: ' + task.title);
    return {};
  };
}

module.exports = { createTaskActions };
