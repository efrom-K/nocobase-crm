-- 28.10.2026: у договора не указан контакт → «Требует внимания» (причина «нет контакта»).
-- Контакт есть = в contract_contacts хотя бы одна запись с именем, телефоном или e-mail.
-- Приоритет прежний: «На расторжении» и «Не хватает документов» важнее; вместе со сменой цены причины перечисляются.

create or replace function cm_contract_auto_status(r rental_contracts, out st text, out reason text) as $$
declare
  docs text[];
  attn text[];
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
  attn := array_remove(array[
    case when d is not null then 'смена цены ' || to_char(d, 'DD.MM.YYYY') end,
    case when not exists (select 1 from contract_contacts c where c.contract_type = 'active' and c.contract_ref_id = r.id
                          and coalesce(trim(c.name), '') || coalesce(trim(c.phone), '') || coalesce(trim(c.email), '') <> '')
         then 'нет контакта' end
  ], null);
  if array_length(attn, 1) > 0 then
    st := '2_attention'; reason := array_to_string(attn, ', ');
    return;
  end if;
  st := '3_ok'; reason := null;
end $$ language plpgsql stable;

-- контакты меняют статус договора — тот же пересчёт, что для ДС и периодов цены
drop trigger if exists cm_status_touch on contract_contacts;
create trigger cm_status_touch after insert or update or delete on contract_contacts
  for each row execute function cm_contract_status_touch();

select cm_recompute_contract_statuses();
