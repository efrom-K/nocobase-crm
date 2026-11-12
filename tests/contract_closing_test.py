"""Closing migration: legacy archive, required files, immutable archive, safe deletion."""
from pathlib import Path
import subprocess
import sys
migration = (Path(__file__).resolve().parents[1] / 'db/migrations/008_contract_closing.sql').read_text()
assert migration.startswith('BEGIN;\n') and migration.endswith('COMMIT;\n')
query = '''BEGIN;
CREATE SCHEMA crm_closing_test;
SET LOCAL search_path = crm_closing_test;
CREATE TABLE completed_contracts(id bigint PRIMARY KEY);
CREATE TABLE attachments(id bigint PRIMARY KEY);
INSERT INTO completed_contracts VALUES (1);
''' + migration.removeprefix('BEGIN;\n').removesuffix('COMMIT;\n') + '''
DO $$
BEGIN
  ASSERT (SELECT closure_state = 'archived' FROM completed_contracts WHERE id=1), 'legacy archive';
  INSERT INTO completed_contracts(id) VALUES (2);
  ASSERT (SELECT closure_state = 'pending' AND closed_at IS NOT NULL AND archived_at IS NULL FROM completed_contracts WHERE id=2);
  BEGIN
    UPDATE completed_contracts SET closure_state='archived' WHERE id=2;
    RAISE EXCEPTION 'missing files accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'missing files accepted' THEN RAISE; END IF; END;
  BEGIN
    INSERT INTO completed_contracts(id,closure_state) VALUES (3,'archived');
    RAISE EXCEPTION 'direct archive accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'direct archive accepted' THEN RAISE; END IF; END;
  INSERT INTO attachments VALUES (20),(21);
  INSERT INTO completed_contract_closing_files(contract_id,attachment_id) VALUES(2,20);
  DELETE FROM completed_contract_closing_files WHERE contract_id=2;
  INSERT INTO completed_contract_closing_files(contract_id,attachment_id) VALUES(2,20);
  UPDATE completed_contracts SET closure_state='archived' WHERE id=2;
  ASSERT (SELECT archived_at IS NOT NULL FROM completed_contracts WHERE id=2);
  BEGIN
    DELETE FROM completed_contract_closing_files WHERE contract_id=2;
    RAISE EXCEPTION 'archive file removal accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'archive file removal accepted' THEN RAISE; END IF; END;
  BEGIN
    INSERT INTO completed_contract_closing_files(contract_id,attachment_id) VALUES(2,21);
    RAISE EXCEPTION 'archive upload accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'archive upload accepted' THEN RAISE; END IF; END;
  BEGIN
    UPDATE completed_contracts SET closure_state='pending' WHERE id=2;
    RAISE EXCEPTION 'archive reversal accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'archive reversal accepted' THEN RAISE; END IF; END;
  BEGIN
    DELETE FROM attachments WHERE id=20;
    RAISE EXCEPTION 'archived attachment deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  DELETE FROM completed_contracts WHERE id=2;
  ASSERT NOT EXISTS(SELECT 1 FROM completed_contract_closing_files WHERE contract_id=2);
END $$;
ROLLBACK;
'''
if '--sql' in sys.argv:
    print(query)
else:
    subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1'], input=query, text=True, check=True)
    print('Contract closing passed')
