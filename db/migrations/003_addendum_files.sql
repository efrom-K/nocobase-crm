-- 06.10.2026: несколько файлов у одного дополнительного соглашения.
-- Связь contract_addendums.files ↔ attachments через contract_addendum_files (поле создано scripts/add_addendum_files_field.py).
-- Старый одиночный file_id переносится сюда и больше не пишется; «скан ДС есть» = у ДС есть хотя бы один файл.

insert into contract_addendum_files(addendum_id, attachment_id, "createdAt", "updatedAt")
  select a.id, a.file_id, now(), now() from contract_addendums a
  where a.file_id is not null and exists (select 1 from attachments t where t.id = a.file_id)
  on conflict do nothing;

-- удаление ДС или файла убирает и связь (purge черновиков, удаление договора — без хвостов)
alter table contract_addendum_files drop constraint if exists contract_addendum_files_addendum_fk;
alter table contract_addendum_files add constraint contract_addendum_files_addendum_fk
  foreign key (addendum_id) references contract_addendums(id) on delete cascade;
alter table contract_addendum_files drop constraint if exists contract_addendum_files_attachment_fk;
alter table contract_addendum_files add constraint contract_addendum_files_attachment_fk
  foreign key (attachment_id) references attachments(id) on delete cascade;

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
    case when exists (select 1 from contract_addendums a where a.contract_type = 'active' and a.contract_ref_id = r.id
                   and not exists (select 1 from contract_addendum_files f where f.addendum_id = a.id))
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

-- файлы ДС меняют статус договора — пересчитываем при добавлении/удалении файла
create or replace function cm_contract_status_touch_addendum_file() returns trigger as $$
begin
  update rental_contracts r set contract_status = contract_status
  from contract_addendums a
  where a.id = coalesce(NEW.addendum_id, OLD.addendum_id) and a.contract_type = 'active' and r.id = a.contract_ref_id;
  return null;
end $$ language plpgsql;

drop trigger if exists cm_status_touch on contract_addendum_files;
create trigger cm_status_touch after insert or delete on contract_addendum_files
  for each row execute function cm_contract_status_touch_addendum_file();

select cm_recompute_contract_statuses();
