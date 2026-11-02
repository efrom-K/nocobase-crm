BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION cm_contract_auto_status(r rental_contracts, OUT st text, OUT reason text) AS $$
DECLARE
  docs text[];
  attn text[];
  d date;
  today date := (now() AT TIME ZONE 'Europe/Moscow')::date;
BEGIN
  IF r.termination_date IS NOT NULL AND r.termination_date - today <= 90 THEN
    st := '2_terminating';
    reason := CASE WHEN r.termination_date < today THEN 'дата расторжения прошла ' ELSE 'расторжение ' END
              || to_char(r.termination_date, 'DD.MM.YYYY');
    RETURN;
  END IF;
  docs := array_remove(ARRAY[
    CASE WHEN coalesce(trim(r.contract_scan_url), '') = '' THEN 'нет скана договора' END,
    CASE WHEN coalesce(trim(r.act_scan_url), '') = '' THEN 'нет скана акта' END,
    CASE WHEN EXISTS (SELECT 1 FROM contract_addendums a WHERE a.contract_type = 'active' AND a.contract_ref_id = r.id
                   AND NOT EXISTS (SELECT 1 FROM contract_addendum_files f WHERE f.addendum_id = a.id))
         THEN 'нет скана доп. соглашения' END
  ], NULL);
  IF array_length(docs, 1) > 0 THEN
    st := '2_docs'; reason := array_to_string(docs, ', ');
    RETURN;
  END IF;
  -- Смену цены показываем до её даты; в сам день новое значение уже действует.
  SELECT min(x) INTO d FROM (
    SELECT p.date_from AS x FROM contract_price_periods p WHERE p.contract_type = 'active' AND p.contract_ref_id = r.id
    UNION ALL
    SELECT p.date_to + 1 FROM contract_price_periods p WHERE p.contract_type = 'active' AND p.contract_ref_id = r.id AND p.date_to IS NOT NULL
  ) q WHERE x > today AND x <= today + 7;
  attn := array_remove(ARRAY[
    CASE WHEN d IS NOT NULL THEN 'смена цены ' || to_char(d, 'DD.MM.YYYY') END,
    CASE WHEN NOT EXISTS (SELECT 1 FROM contract_contacts c WHERE c.contract_type = 'active' AND c.contract_ref_id = r.id
                          AND coalesce(trim(c.name), '') || coalesce(trim(c.phone), '') || coalesce(trim(c.email), '') <> '')
         THEN 'нет контакта' END
  ], NULL);
  IF array_length(attn, 1) > 0 THEN
    st := '2_attention'; reason := array_to_string(attn, ', ');
    RETURN;
  END IF;
  st := '3_ok'; reason := NULL;
END $$ LANGUAGE plpgsql STABLE;

SELECT cm_recompute_contract_statuses();
COMMIT;
