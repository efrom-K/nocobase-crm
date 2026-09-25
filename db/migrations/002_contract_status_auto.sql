-- Автоматический статус активного договора (rental_contracts.contract_status), 25.09.2026.
-- Правило в одном месте — в базе: срабатывает при любом сохранении договора (карточка, таблица, API, импорт),
-- при изменении его доп. соглашений и периодов цены, и ночью (cm_recompute_contract_statuses) — для сроков.
--
-- Приоритет (первое сработавшее):
--   1_problem      «Проблема» — только вручную, с причиной; держится, пока не снимут вручную
--   2_terminating  «На расторжении» — до даты расторжения 90 дней и меньше (или уже прошла)
--   2_docs         «Не хватает документов» — нет скана договора, скана акта или скана у доп. соглашения
--   2_attention    «Требует внимания» — через 7 дней и меньше начинается/заканчивается период цены
--   3_ok           «В порядке»
-- Любой статус можно поставить вручную: он держится, пока не изменится автоматическая оценка
-- (status_auto_key = статус|причина на момент ручной установки). Очистить статус = вернуть автоматический.
-- Поля status_reason / status_manual / status_auto_key создаются через API NocoBase (scripts/status_auto_fields.py).

create or replace function cm_contract_auto_status(r rental_contracts, out st text, out reason text) as $$
declare
  docs text[];
  d date;
begin
  if r.termination_date is not null and r.termination_date - current_date <= 90 then
    st := '2_terminating';
    reason := case when r.termination_date < current_date then 'дата расторжения прошла ' else 'расторжение ' end
              || to_char(r.termination_date, 'DD.MM.YYYY');
    return;
  end if;
  docs := array_remove(array[
    case when coalesce(trim(r.contract_scan_url), '') = '' then 'нет скана договора' end,
    case when coalesce(trim(r.act_scan_url), '') = '' then 'нет скана акта' end,
    case when exists (select 1 from contract_addendums a where a.contract_type = 'active' and a.contract_ref_id = r.id and a.file_id is null)
         then 'нет скана доп. соглашения' end
  ], null);
  if array_length(docs, 1) > 0 then
    st := '2_docs'; reason := array_to_string(docs, ', ');
    return;
  end if;
  -- цена меняется в день начала периода и на следующий день после его окончания
  select min(x) into d from (
    select p.date_from as x from contract_price_periods p where p.contract_type = 'active' and p.contract_ref_id = r.id
    union all
    select p.date_to + 1 from contract_price_periods p where p.contract_type = 'active' and p.contract_ref_id = r.id and p.date_to is not null
  ) q where x between current_date and current_date + 7;
  if d is not null then
    st := '2_attention'; reason := 'смена цены ' || to_char(d, 'DD.MM.YYYY');
    return;
  end if;
  st := '3_ok'; reason := null;
end $$ language plpgsql stable;

create or replace function cm_contract_status_trg() returns trigger as $$
declare
  a record;
  k text;
  apply_auto boolean := true;
begin
  select * into a from cm_contract_auto_status(NEW);
  k := a.st || '|' || coalesce(a.reason, '');
  if TG_OP = 'UPDATE' and NEW.contract_status is distinct from OLD.contract_status and NEW.contract_status is not null then
    -- статус поменяли вручную: запоминаем, при какой автоматической оценке это сделано
    NEW.status_manual := true;
    NEW.status_auto_key := k;
    if NEW.status_reason is not distinct from OLD.status_reason or coalesce(trim(NEW.status_reason), '') = '' then
      NEW.status_reason := case when NEW.contract_status = '1_problem' then 'причина не указана' else 'установлен вручную' end;
    end if;
    apply_auto := false;
  elsif TG_OP = 'INSERT' and NEW.contract_status = '1_problem' then
    NEW.status_manual := true; NEW.status_auto_key := k;
    NEW.status_reason := coalesce(nullif(trim(NEW.status_reason), ''), 'причина не указана');
    apply_auto := false;
  elsif TG_OP = 'UPDATE' and OLD.status_manual and NEW.contract_status is not null
        and (NEW.contract_status = '1_problem' or OLD.status_auto_key = k) then
    apply_auto := false;   -- ручной статус держится: «Проблема» всегда, остальные — пока оценка не изменилась
  end if;
  if apply_auto then
    if TG_OP = 'UPDATE' and NEW.contract_status is distinct from a.st then
      insert into contract_history(contract_type, contract_ref_id, author_id, action, field, old_value, new_value, text, created_at)
      values ('active', NEW.id, null, 'field', 'contract_status', OLD.contract_status, a.st,
              'Статус изменён автоматически' || coalesce(': ' || a.reason, ''), now());
    end if;
    NEW.contract_status := a.st;
    NEW.status_reason := a.reason;
    NEW.status_manual := false;
    NEW.status_auto_key := k;
  end if;
  return NEW;
end $$ language plpgsql;

drop trigger if exists cm_contract_status on rental_contracts;
create trigger cm_contract_status before insert or update on rental_contracts
  for each row execute function cm_contract_status_trg();

-- доп. соглашения и периоды цены влияют на статус — пересчитываем договор при их изменении
create or replace function cm_contract_status_touch() returns trigger as $$
begin
  if TG_OP <> 'DELETE' and NEW.contract_type = 'active' then
    update rental_contracts set contract_status = contract_status where id = NEW.contract_ref_id;
  end if;
  if TG_OP <> 'INSERT' and OLD.contract_type = 'active'
     and (TG_OP = 'DELETE' or OLD.contract_ref_id is distinct from NEW.contract_ref_id or NEW.contract_type <> 'active') then
    update rental_contracts set contract_status = contract_status where id = OLD.contract_ref_id;
  end if;
  return null;
end $$ language plpgsql;

drop trigger if exists cm_status_touch on contract_addendums;
create trigger cm_status_touch after insert or update or delete on contract_addendums
  for each row execute function cm_contract_status_touch();
drop trigger if exists cm_status_touch on contract_price_periods;
create trigger cm_status_touch after insert or update or delete on contract_price_periods
  for each row execute function cm_contract_status_touch();

-- ночной пересчёт (сроки сдвигаются сами по себе): cron 00:20 → select cm_recompute_contract_statuses();
create or replace function cm_recompute_contract_statuses() returns integer as $$
declare n integer;
begin
  update rental_contracts set contract_status = contract_status;
  get diagnostics n = row_count;
  return n;
end $$ language plpgsql;
