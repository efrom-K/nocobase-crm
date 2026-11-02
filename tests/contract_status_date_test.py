"""Check that a price change is flagged before, but not on, its Moscow date."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
migration = (ROOT / 'db/migrations/007_contract_status_moscow_date.sql').read_text()
assert migration.startswith('BEGIN;\n') and migration.endswith('COMMIT;\n')
migration = migration.removeprefix('BEGIN;\n').removesuffix('COMMIT;\n')
query = '''BEGIN;
CREATE SCHEMA crm_contract_status_test;
SET LOCAL search_path = crm_contract_status_test;
CREATE TABLE rental_contracts(id bigint, termination_date date, contract_scan_url text, act_scan_url text, contract_status text);
CREATE TABLE contract_addendums(id bigint, contract_type text, contract_ref_id bigint, file_id bigint);
CREATE TABLE contract_addendum_files(addendum_id bigint);
CREATE TABLE contract_price_periods(contract_type text, contract_ref_id bigint, date_from date, date_to date);
CREATE TABLE contract_contacts(contract_type text, contract_ref_id bigint, name text, phone text, email text);
CREATE FUNCTION cm_recompute_contract_statuses() RETURNS integer LANGUAGE sql AS $$ SELECT 0 $$;
''' + migration + '''
DO $$
DECLARE today date := (now() AT TIME ZONE 'Europe/Moscow')::date; st text; reason text;
BEGIN
  INSERT INTO rental_contracts VALUES (1, NULL, 'contract', 'act', NULL), (2, NULL, 'contract', 'act', NULL);
  INSERT INTO contract_contacts VALUES ('active', 1, 'Tenant', NULL, NULL), ('active', 2, 'Tenant', NULL, NULL);
  INSERT INTO contract_price_periods VALUES ('active', 1, today, today + 30), ('active', 2, today + 1, today + 30);
  SELECT a.st, a.reason INTO st, reason FROM rental_contracts r CROSS JOIN LATERAL cm_contract_auto_status(r) a WHERE r.id=1;
  IF st <> '3_ok' OR reason IS NOT NULL THEN RAISE EXCEPTION 'same-day change should already be applied: %, %', st, reason; END IF;
  SELECT a.st, a.reason INTO st, reason FROM rental_contracts r CROSS JOIN LATERAL cm_contract_auto_status(r) a WHERE r.id=2;
  IF st <> '2_attention' OR reason <> 'смена цены ' || to_char(today + 1, 'DD.MM.YYYY') THEN
    RAISE EXCEPTION 'future change should be flagged: %, %', st, reason;
  END IF;
END $$;
ROLLBACK;
'''
if '--sql' in sys.argv:
    print(query)
else:
    subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1'], input=query, text=True, check=True)
    print('Contract status date boundaries passed')
