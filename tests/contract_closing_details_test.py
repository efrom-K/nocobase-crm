"""Required signed documents, exact deposit allocation and immutable archived facts."""
from pathlib import Path
import subprocess
import sys
root = Path(__file__).resolve().parents[1]
migrations = ''
for name in ('008_contract_closing.sql', '009_contract_closing_delete.sql', '010_contract_closing_details.sql'):
    m = (root / 'db/migrations' / name).read_text()
    assert m.startswith('BEGIN;\n') and m.endswith('COMMIT;\n')
    migrations += m.removeprefix('BEGIN;\n').removesuffix('COMMIT;\n')
query = '''BEGIN;
CREATE SCHEMA crm_closing_details_test;
SET LOCAL search_path=crm_closing_details_test;
CREATE TABLE completed_contracts(id bigint PRIMARY KEY, note text);
CREATE TABLE attachments(id bigint PRIMARY KEY);
INSERT INTO completed_contracts(id) VALUES(1);
''' + migrations + '''
CREATE FUNCTION must_reject(query text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE query;
  EXCEPTION WHEN raise_exception OR check_violation OR not_null_violation OR invalid_text_representation THEN RETURN; END;
  RAISE EXCEPTION 'Invalid closing accepted: %', query;
END $$;
DO $$
DECLARE docs jsonb := '[{"file_id":20,"kind":"termination_agreement","signed_on":"2026-11-10"},{"file_id":21,"kind":"return_act","signed_on":"2026-11-11"},{"file_id":22,"kind":"reconciliation_act","signed_on":"2026-11-12"}]';
BEGIN
  UPDATE completed_contracts SET note='legacy archive can still be viewed/managed' WHERE id=1;
  ASSERT (SELECT closure_state='archived' AND closure_deposit_amount IS NULL FROM completed_contracts WHERE id=1);
  INSERT INTO completed_contracts(id) VALUES(2),(3);
  INSERT INTO attachments VALUES(20),(21),(22),(23);
  INSERT INTO completed_contract_closing_files(contract_id,attachment_id) VALUES(2,20),(2,21),(2,22);
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_termination_mode='unilateral', closure_documents=docs, closure_deposit_amount=100.01 WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_deposit_action='refund',closure_deposit_retained=999 WHERE id=2;
  ASSERT (SELECT closure_deposit_refund=100.01 AND closure_deposit_retained=0 AND closure_deposit_rent=0 FROM completed_contracts WHERE id=2);
  ASSERT (SELECT cm_closing_details_error(c) IS NULL FROM completed_contracts c WHERE id=2);
  UPDATE completed_contracts SET closure_documents=jsonb_set(docs,'{0,kind}','"other"') WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_documents=jsonb_set(docs,'{1,signed_on}','null') WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_documents=jsonb_set(docs,'{1,signed_on}','"2026-02-30"') WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_documents=jsonb_set(docs,'{1,file_id}','20') WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_documents=jsonb_set(docs,'{1,file_id}','999') WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  INSERT INTO completed_contract_closing_files(contract_id,attachment_id) VALUES(2,23);
  UPDATE completed_contracts SET closure_documents=docs||'[{"file_id":23,"kind":"other","signed_on":null}]' WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  DELETE FROM completed_contract_closing_files WHERE contract_id=2 AND attachment_id=23;
  SET CONSTRAINTS cm_guard_closing_file_delete IMMEDIATE;
  UPDATE completed_contracts SET closure_documents=docs,closure_deposit_action='retain' WHERE id=2;
  ASSERT (SELECT closure_deposit_refund=0 AND closure_deposit_retained=100.01 AND closure_deposit_rent=0 FROM completed_contracts WHERE id=2);
  UPDATE completed_contracts SET closure_deposit_action='rent' WHERE id=2;
  ASSERT (SELECT closure_deposit_refund=0 AND closure_deposit_retained=0 AND closure_deposit_rent=100.01 FROM completed_contracts WHERE id=2);
  PERFORM must_reject('UPDATE completed_contracts SET closure_deposit_action=''partial'',closure_deposit_refund=100.01 WHERE id=2');
  PERFORM must_reject('UPDATE completed_contracts SET closure_deposit_action=''partial'',closure_deposit_refund=-0.01 WHERE id=2');
  UPDATE completed_contracts SET closure_deposit_action='partial',closure_deposit_refund=30.02 WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_state=''archived'' WHERE id=2');
  UPDATE completed_contracts SET closure_deposit_remainder='retain' WHERE id=2;
  ASSERT (SELECT closure_deposit_refund=30.02 AND closure_deposit_retained=69.99 AND closure_deposit_rent=0 FROM completed_contracts WHERE id=2);
  UPDATE completed_contracts SET closure_deposit_remainder='rent' WHERE id=2;
  ASSERT (SELECT closure_deposit_refund=30.02 AND closure_deposit_retained=0 AND closure_deposit_rent=69.99 FROM completed_contracts WHERE id=2);
  UPDATE completed_contracts SET closure_state='archived' WHERE id=2;
  PERFORM must_reject('UPDATE completed_contracts SET closure_deposit_amount=200 WHERE id=2');
  PERFORM must_reject('UPDATE completed_contracts SET closure_documents=''[]'' WHERE id=2');
  UPDATE completed_contracts SET closure_termination_mode='bilateral',closure_deposit_amount=0,closure_deposit_action='refund' WHERE id=3;
  ASSERT (SELECT closure_deposit_refund=0 AND closure_deposit_retained=0 AND closure_deposit_rent=0 FROM completed_contracts WHERE id=3);
  PERFORM must_reject('UPDATE completed_contracts SET closure_deposit_amount=-1 WHERE id=3');
END $$;
ROLLBACK;
'''
if '--sql' in sys.argv:
    print(query)
else:
    subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1'], input=query, text=True, check=True)
    print('Contract closing documents and deposit passed')
