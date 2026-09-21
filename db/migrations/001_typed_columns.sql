begin;
create or replace function nb_parse_date(s text) returns date language plpgsql immutable as $$
declare t text := btrim(coalesce(s,''));
begin
  if t = '' then return null; end if;
  if t ~ '^\d{4}-\d{2}-\d{2}' then return substr(t,1,10)::date; end if;
  if t ~ '^\d{1,2}\.\d{1,2}\.\d{4}$' then return to_date(t,'DD.MM.YYYY'); end if;
  return null;
exception when others then return null;
end $$;
create or replace function nb_parse_num(s text) returns double precision language plpgsql immutable as $$
declare t text := replace(replace(btrim(coalesce(s,'')), chr(160), ''), ' ', '');
begin
  if t = '' then return null; end if;
  t := replace(t, ',', '.');
  if t ~ '^\d+(\.\d+)?$' then return t::double precision; end if;
  return null;
exception when others then return null;
end $$;

-- значения, которые нельзя однозначно превратить в число/дату: в журнал и в примечания договора
do $$
declare t text; f text; r record; lbl text; isdate boolean;
begin
  foreach t in array array['rental_contracts','forming_contracts','completed_contracts'] loop
    foreach f in array array['area_sqm','rent_per_sqm','utility_per_sqm','deposit_amount','rent_amount','utility_amount','date_signed','date_act','end_date','termination_date'] loop
      if not exists (select 1 from information_schema.columns where table_name=t and column_name=f) then continue; end if;
      isdate := f like '%date%';
      lbl := case f when 'area_sqm' then 'Площадь' when 'rent_per_sqm' then 'Аренда за 1 кв.м.' when 'utility_per_sqm' then 'Эксплуатационный сбор за 1 кв.м.'
                    when 'deposit_amount' then 'Обеспечительный платёж' when 'rent_amount' then 'Арендная плата' when 'utility_amount' then 'Эксплуатационный сбор'
                    when 'date_signed' then 'Дата заключения' when 'date_act' then 'Дата акта' when 'end_date' then 'Окончание' else 'Расторжение' end;
      for r in execute format('select id, %I as v from %I where btrim(coalesce(%I,'''')) <> '''' and %s is null', f, t, f, case when isdate then 'nb_parse_date('||quote_ident(f)||')' else 'nb_parse_num('||quote_ident(f)||')' end) loop
        insert into normalization_log(tbl,row_id,field,old_value,new_value) values (t, r.id, f, r.v, 'NULL: не удалось разобрать, исходное значение перенесено в примечания');
        execute format('update %I set notes = concat_ws(E''\n'', nullif(notes,''''), %L) where id = %s', t, 'Исходное значение поля «' || lbl || '»: ' || r.v, r.id);
      end loop;
    end loop;
  end loop;
end $$;

-- смена типов колонок
do $$
declare t text; f text;
begin
  foreach t in array array['rental_contracts','forming_contracts','completed_contracts'] loop
    foreach f in array array['date_signed','date_act','end_date','termination_date'] loop
      if exists (select 1 from information_schema.columns where table_name=t and column_name=f and data_type='character varying') then
        execute format('alter table %I alter column %I type date using nb_parse_date(%I)', t, f, f);
      end if;
    end loop;
    foreach f in array array['area_sqm','rent_per_sqm','utility_per_sqm','deposit_amount','rent_amount','utility_amount'] loop
      if exists (select 1 from information_schema.columns where table_name=t and column_name=f and data_type='character varying') then
        execute format('alter table %I alter column %I type double precision using nb_parse_num(%I)', t, f, f);
      end if;
    end loop;
  end loop;
end $$;

-- описание полей в NocoBase
update fields set type='dateOnly', interface='date',
  options = jsonb_set(coalesce(options::jsonb,'{}'::jsonb), '{uiSchema}', jsonb_build_object('type','string','title', options::jsonb#>>'{uiSchema,title}', 'x-component','DatePicker','x-component-props', jsonb_build_object('dateFormat','DD.MM.YYYY','showTime',false)))::json
where "collectionName" in ('rental_contracts','forming_contracts','completed_contracts') and name in ('date_signed','date_act','end_date','termination_date');
update fields set type='double', interface='number',
  options = jsonb_set(coalesce(options::jsonb,'{}'::jsonb), '{uiSchema}', jsonb_build_object('type','number','title', options::jsonb#>>'{uiSchema,title}', 'x-component','InputNumber','x-component-props', jsonb_build_object('stringMode', true, 'step', '1')))::json
where "collectionName" in ('rental_contracts','forming_contracts','completed_contracts') and name in ('area_sqm','rent_per_sqm','utility_per_sqm','deposit_amount','rent_amount','utility_amount');

-- журнал напоминаний: даты окончания в ISO
update contract_reminders_log set end_date = to_char(to_date(btrim(end_date),'DD.MM.YYYY'),'YYYY-MM-DD') where btrim(end_date) ~ '^\d{1,2}\.\d{1,2}\.\d{4}$';

drop function nb_parse_date(text); drop function nb_parse_num(text);
select 'types after', table_name||'.'||column_name||'='||data_type from information_schema.columns where table_name in ('rental_contracts','forming_contracts','completed_contracts') and column_name in ('date_signed','area_sqm','rent_amount') order by 1,2;
select 'log rows', count(*) from normalization_log where new_value like 'NULL:%';
commit;
