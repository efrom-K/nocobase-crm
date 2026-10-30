-- Run in an isolated schema, after migration 005, inside a transaction that is rolled back.
DO $$
DECLARE a bigint; b bigint; actual bigint; label text; did_fail boolean;
BEGIN
  SELECT id INTO a FROM contract_objects WHERE name = 'Object A';
  SELECT id INTO b FROM contract_objects WHERE name = 'Object B';
  IF NOT EXISTS (SELECT 1 FROM rental_contracts WHERE object_name = 'Imported object' AND object_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Missing object was not imported and linked';
  END IF;
  INSERT INTO rental_contracts(object_name) VALUES ('  OBJECT   A  ') RETURNING object_id, object_name INTO actual, label;
  ASSERT actual = a AND label = 'Object A', 'Canonical name resolution';
  UPDATE rental_contracts SET object_name = 'Object B' WHERE object_id = a;
  ASSERT NOT EXISTS (SELECT 1 FROM rental_contracts WHERE object_id <> b AND object_name = 'Object B'), 'Name edit must update ID';
  UPDATE rental_contracts SET object_id = a WHERE object_id = b;
  ASSERT NOT EXISTS (SELECT 1 FROM rental_contracts WHERE object_id = a AND object_name <> 'Object A'), 'ID edit must update name';
  INSERT INTO completed_contracts(object_name) VALUES ('Object A') RETURNING object_id INTO actual;
  ASSERT actual = a, 'Lifecycle move without ID remains compatible';
  INSERT INTO draft_contracts(object_name) VALUES ('Object A');
  UPDATE draft_contracts SET object_name = '';
  ASSERT NOT EXISTS (SELECT 1 FROM draft_contracts WHERE object_id IS NOT NULL OR object_name IS NOT NULL), 'Draft can clear object';
  INSERT INTO draft_contracts DEFAULT VALUES;
  did_fail := false;
  BEGIN
    INSERT INTO forming_contracts(object_name) VALUES ('Unknown');
  EXCEPTION WHEN foreign_key_violation THEN did_fail := true;
  END;
  ASSERT did_fail, 'Unknown objects must be rejected';
  did_fail := false;
  BEGIN
    INSERT INTO rental_contracts DEFAULT VALUES;
  EXCEPTION WHEN foreign_key_violation THEN did_fail := true;
  END;
  ASSERT did_fail, 'Published contracts require an object';
  did_fail := false;
  BEGIN
    INSERT INTO forming_contracts(object_name, object_id) VALUES ('Object A', b);
  EXCEPTION WHEN check_violation THEN did_fail := true;
  END;
  ASSERT did_fail, 'Conflicting IDs must be rejected';
  did_fail := false;
  BEGIN
    INSERT INTO contract_objects(name) VALUES (' object   a ');
  EXCEPTION WHEN unique_violation THEN did_fail := true;
  END;
  ASSERT did_fail, 'Normalized duplicates must be rejected';
  did_fail := false;
  BEGIN
    DELETE FROM contract_objects WHERE id = a;
  EXCEPTION WHEN foreign_key_violation THEN did_fail := true;
  END;
  ASSERT did_fail, 'Referenced objects cannot be deleted';
END;
$$;
