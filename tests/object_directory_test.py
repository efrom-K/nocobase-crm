"""Exercise migration 005 in an isolated schema, always rolling back. --sql emits the test transaction."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
migration = (ROOT / 'db/migrations/005_contract_object_directory.sql').read_text()
assert migration.count('\nBEGIN;\n') == 1 and migration.endswith('COMMIT;\n')
migration = migration.replace('\nBEGIN;\n', '\n', 1).removesuffix('COMMIT;\n')
query = '''BEGIN;
CREATE SCHEMA crm_object_directory_test;
SET LOCAL search_path = crm_object_directory_test;
CREATE TABLE contract_objects(id bigserial PRIMARY KEY, name varchar(255));
CREATE TABLE rental_contracts(id bigserial PRIMARY KEY, object_name varchar(255));
CREATE TABLE forming_contracts(LIKE rental_contracts INCLUDING ALL);
CREATE TABLE completed_contracts(LIKE rental_contracts INCLUDING ALL);
CREATE TABLE draft_contracts(LIKE rental_contracts INCLUDING ALL);
INSERT INTO contract_objects(name) VALUES ('Object A'),('Object B');
INSERT INTO rental_contracts(object_name) VALUES ('Imported object');
''' + migration + (ROOT / 'tests/object_directory.sql').read_text() + '\nROLLBACK;\n'
if '--sql' in sys.argv:
    print(query)
else:
    subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1'], input=query, text=True, check=True)
    print('Object migration: links, lifecycle, drafts, unknown names, duplicates and delete protection passed')
