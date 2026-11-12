// Contract closing: money is parsed in kopecks; the database computes and freezes the settlement.
const CLOSING_DOC_KINDS = [['termination_agreement', 'Соглашение о расторжении'], ['return_act', 'Акт возврата'], ['reconciliation_act', 'Акт сверки'], ['other', 'Дополнительный документ']];
const CLOSING_DEPOSIT_ACTIONS = [['refund', 'Возвращается полностью'], ['retain', 'Не возвращается'], ['rent', 'В счёт аренды'], ['partial', 'Частично возвращается']];
function closingCanRestore(r) { return r.closure_state !== 'archived' || !r.closure_deposit_action; }
function closingMoney(value) {
  const s = String(value == null ? '' : value).replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) throw new Error('Укажите сумму от 0 до 999 999 999 999,99, не более двух знаков после запятой');
  const parts = s.split('.');
  return Number(parts[0]) * 100 + Number(((parts[1] || '') + '00').slice(0, 2));
}
function closingAmount(kopecks) { return kopecks == null ? null : Math.floor(kopecks / 100) + '.' + String(kopecks % 100).padStart(2, '0'); }
function closingSettlement(v) {
  const amount = closingMoney(v.closure_deposit_amount);
  if (amount == null || !CLOSING_DEPOSIT_ACTIONS.some(function(a) { return a[0] === v.closure_deposit_action; })) return null;
  const refund = v.closure_deposit_action === 'refund' ? amount : v.closure_deposit_action === 'partial' ? closingMoney(v.closure_deposit_refund) : 0;
  if (refund == null || (v.closure_deposit_action === 'partial' && (refund <= 0 || refund >= amount || ['retain', 'rent'].indexOf(v.closure_deposit_remainder) === -1))) return null;
  const retained = v.closure_deposit_action === 'retain' || (v.closure_deposit_action === 'partial' && v.closure_deposit_remainder === 'retain') ? amount - refund : 0;
  return { refund: refund, retained: retained, rent: amount - refund - retained };
}
function closingProblem(v, files) {
  if (['unilateral', 'bilateral'].indexOf(v.closure_termination_mode) === -1) return 'Выберите одностороннее или двустороннее завершение';
  const docs = v.closure_documents || [];
  if (!files.length || docs.length !== files.length) return 'Заполните тип и дату подписи каждого файла';
  const kinds = [], seen = {};
  for (const doc of docs) {
    if (seen[doc.file_id] || !files.some(function(f) { return String(f.id) === String(doc.file_id); })) return 'Проверьте список закрывающих файлов';
    seen[doc.file_id] = true;
    if (!CLOSING_DOC_KINDS.some(function(k) { return k[0] === doc.kind; })) return 'Выберите тип каждого документа';
    if (!doc.signed_on || dateProblem(doc.signed_on)) return 'Укажите дату подписи каждого документа';
    const date = new Date(doc.signed_on + 'T00:00:00Z');
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== doc.signed_on) return 'Проверьте даты подписи документов';
    kinds.push(doc.kind);
  }
  if (CLOSING_DOC_KINDS.slice(0, 3).some(function(k) { return kinds.indexOf(k[0]) === -1; })) return 'Нужны соглашение о расторжении, акт возврата и акт сверки';
  if (!closingSettlement(v)) return 'Заполните сумму обеспечительного платежа, решение по нему и распределение остатка';
  return '';
}
function closingSelect(field, label, options, value, disabled) {
  return '<label class="cm-field-row"><span class="cm-label">' + label + '</span><select class="cm-field-input" data-closing-field="' + field + '"' + (disabled ? ' disabled' : '') + '><option value="">Выберите…</option>'
    + options.map(function(o) { return '<option value="' + o[0] + '"' + (o[0] === value ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
}
async function wireClosingDocuments(overlay, id, r, user, canEdit) {
  const section = document.createElement('div');
  section.className = 'cm-section';
  const amount = r.closure_deposit_amount == null && r.closure_state === 'pending' ? r.deposit_amount : r.closure_deposit_amount;
  function moneyInput(field, label, value) {
    return '<label class="cm-field-row"><span class="cm-label">' + label + '</span><input type="text" inputmode="decimal" class="cm-field-input" data-closing-field="' + field + '" value="' + escAttr(value == null ? '' : String(value).replace('.', ',')) + '"' + (canEdit ? '' : ' disabled') + '></label>';
  }
  section.innerHTML = '<div class="cm-section-title">Закрытие договора</div>'
    + closingSelect('closure_termination_mode', 'Завершение договора', [['unilateral', 'Одностороннее'], ['bilateral', 'Двустороннее']], r.closure_termination_mode, !canEdit)
    + '<p>Обязательны: соглашение о расторжении, акт возврата и акт сверки. У каждого файла, включая дополнительные, укажите дату подписи.</p>'
    + '<div data-closing-list></div>'
    + (canEdit ? '<div class="cm-upload-row"><input type="file" id="cm-closing-file" style="display:none;"><button class="cm-upload-btn" id="cm-closing-upload">Прикрепить документ</button><span id="cm-closing-status" role="status"></span></div>' : '')
    + '<div class="cm-section-title" style="margin-top:18px;">Обеспечительный платёж</div>'
    + moneyInput('closure_deposit_amount', 'Сумма к распределению, ₽', amount)
    + closingSelect('closure_deposit_action', 'Решение по платежу', CLOSING_DEPOSIT_ACTIONS, r.closure_deposit_action, !canEdit)
    + '<div data-closing-partial>' + moneyInput('closure_deposit_refund', 'Сумма частичного возврата, ₽', r.closure_deposit_refund)
    + closingSelect('closure_deposit_remainder', 'Оставшаяся сумма', [['retain', 'Не возвращается'], ['rent', 'В счёт аренды']], r.closure_deposit_remainder, !canEdit) + '</div>'
    + '<div data-closing-summary role="status" aria-live="polite"></div>'
    + (canEdit ? '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;"><button class="cm-upload-btn" id="cm-closing-save">Сохранить закрытие</button><button class="cm-upload-btn" id="cm-archive-contract">В архив</button></div><p data-closing-problem role="status" aria-live="polite"></p>' : '');
  const body = overlay.querySelector('#cm-body');
  body.insertBefore(section, body.firstChild);
  const archive = section.querySelector('#cm-archive-contract'), save = section.querySelector('#cm-closing-save');
  let files = [], busy = false;
  function values() {
    const v = {};
    section.querySelectorAll('[data-closing-field]').forEach(function(el) { v[el.getAttribute('data-closing-field')] = el.value || null; });
    v.closure_deposit_amount = closingAmount(closingMoney(v.closure_deposit_amount));
    v.closure_deposit_refund = v.closure_deposit_action === 'partial' ? closingAmount(closingMoney(v.closure_deposit_refund)) : null;
    if (v.closure_deposit_action !== 'partial') v.closure_deposit_remainder = null;
    v.closure_documents = Array.from(section.querySelectorAll('[data-closing-document]')).map(function(row) {
      return { file_id: Number(row.getAttribute('data-closing-document')), kind: row.querySelector('[data-doc-kind]').value, signed_on: row.querySelector('[data-doc-date]').value || null };
    });
    return v;
  }
  function update() {
    const action = section.querySelector('[data-closing-field="closure_deposit_action"]').value;
    section.querySelector('[data-closing-partial]').style.display = action === 'partial' ? '' : 'none';
    let problem = '', settlement = null;
    try { const v = values(); problem = closingProblem(v, files); settlement = closingSettlement(v); } catch (e) { problem = e.message; }
    const fmt = function(c) { return closingAmount(c).replace('.', ',') + ' ₽'; };
    section.querySelector('[data-closing-summary]').textContent = settlement ? 'Возврат: ' + fmt(settlement.refund) + ' · Удержано: ' + fmt(settlement.retained) + ' · В счёт аренды: ' + fmt(settlement.rent) : 'Распределение платежа ещё не заполнено';
    if (archive) { archive.disabled = busy || !!problem; archive.title = problem; section.querySelector('[data-closing-problem]').textContent = problem; }
    if (save) save.disabled = busy;
  }
  async function refresh() {
    const existing = Array.from(section.querySelectorAll('[data-closing-document]')).map(function(row) {
      return { file_id: Number(row.getAttribute('data-closing-document')), kind: row.querySelector('[data-doc-kind]').value, signed_on: row.querySelector('[data-doc-date]').value };
    });
    const rec = histPayload(await ctx.api.resource('completed_contracts').get({ filterByTk: id, appends: ['closing_files'] }));
    files = rec.closing_files || [];
    const docs = existing.length ? existing : rec.closure_documents || [];
    section.querySelector('[data-closing-list]').innerHTML = files.map(function(f) {
      const doc = docs.find(function(d) { return String(d.file_id) === String(f.id); }) || {};
      return '<div data-closing-document="' + f.id + '" style="margin-bottom:12px;">' + renderFilesList([f], canEdit ? user : null)
        + '<label>Тип документа <select class="cm-field-input" data-doc-kind' + (canEdit ? '' : ' disabled') + '>' + CLOSING_DOC_KINDS.map(function(k) { return '<option value="' + k[0] + '"' + ((doc.kind || 'other') === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label>'
        + '<label>Дата подписи <input class="cm-field-input" type="date" data-doc-date' + DATE_ATTRS + ' value="' + escAttr(doc.signed_on || '') + '"' + (canEdit ? '' : ' disabled') + '></label></div>';
    }).join('') || '<p>Закрывающие файлы пока не прикреплены.</p>';
    bindFileOpenLinks(section);
    if (canEdit) bindFileDeleteLinks(section, id, 'completed_contracts', refresh, 'closing_files');
    update();
  }
  section.addEventListener('input', update);
  section.addEventListener('change', update);
  await refresh();
  if (!canEdit) return;
  bindFileUpload(section, id, 'completed_contracts', { input: 'cm-closing-file', btn: 'cm-closing-upload', status: 'cm-closing-status', relation: 'closing_files' }, refresh, r);
  async function persist(toArchive) {
    let v;
    try { v = values(); if (toArchive) { const problem = closingProblem(v, files); if (problem) throw new Error(problem); } }
    catch (e) { cmToast(e.message); return; }
    if (toArchive && !(await cmConfirm('Даты подписи и распределение обеспечительного платежа проверены? Передать договор в архив?'))) return;
    busy = true; update();
    try {
      // Save all closing facts with the transition: the database validates and freezes the same snapshot.
      if (toArchive) v.closure_state = 'archived';
      await updateWithHistory('completed_contracts', id, v);
      if (toArchive) {
        await logHistory('completed', id, [{ action: 'status', text: 'Документы, даты подписи и обеспечительный платёж проверены. Договор передан в архив' }]);
        closeContractModal(); cmToast('Договор передан в архив'); setTimeout(function() { location.reload(); }, 400);
      } else cmToast('Данные закрытия сохранены');
    } catch (e) { cmToast('Не удалось сохранить закрытие. Проверьте суммы, даты и права доступа'); }
    finally { busy = false; update(); }
  }
  save.addEventListener('click', function() { persist(false); });
  archive.addEventListener('click', function() { persist(true); });
}
