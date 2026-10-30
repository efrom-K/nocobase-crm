-- Run with ON_ERROR_STOP, in one transaction. Names remain compatible with existing CRM modules.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE contract_objects IN SHARE ROW EXCLUSIVE MODE;

-- Missing names are added, never inferred for contracts whose object is blank.
INSERT INTO contract_objects (name)
SELECT DISTINCT c.object_name FROM (
  SELECT object_name FROM forming_contracts UNION ALL
  SELECT object_name FROM rental_contracts UNION ALL
  SELECT object_name FROM completed_contracts UNION ALL
  SELECT object_name FROM draft_contracts
) c
WHERE nullif(btrim(c.object_name), '') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM contract_objects o WHERE o.name = c.object_name);

-- Fail rather than merge ambiguous objects or alter their existing names.
CREATE UNIQUE INDEX IF NOT EXISTS contract_objects_name_normalized_uq
  ON contract_objects (lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')));
ALTER TABLE contract_objects ADD CONSTRAINT contract_objects_name_present
  CHECK (name IS NOT NULL AND length(btrim(name)) > 0);

CREATE FUNCTION resolve_contract_object() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE obj contract_objects%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME = 'draft_contracts' AND nullif(btrim(NEW.object_name), '') IS NULL
     AND (NEW.object_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.object_id IS NOT DISTINCT FROM OLD.object_id)) THEN
    NEW.object_id := NULL;
    NEW.object_name := NULL;
    RETURN NEW;
  END IF;
  IF NEW.object_id IS NOT NULL AND (
    nullif(btrim(NEW.object_name), '') IS NULL OR
    (TG_OP = 'UPDATE' AND NEW.object_id IS DISTINCT FROM OLD.object_id
      AND NEW.object_name IS NOT DISTINCT FROM OLD.object_name)
  ) THEN
    SELECT * INTO obj FROM contract_objects WHERE id = NEW.object_id;
  ELSIF nullif(btrim(NEW.object_name), '') IS NOT NULL THEN
    SELECT * INTO obj FROM contract_objects
      WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) =
            lower(regexp_replace(btrim(NEW.object_name), '[[:space:]]+', ' ', 'g'));
    IF obj.id IS NOT NULL AND NEW.object_id IS NOT NULL AND NEW.object_id <> obj.id
       AND (TG_OP = 'INSERT' OR NEW.object_id IS DISTINCT FROM OLD.object_id) THEN
      RAISE EXCEPTION 'Object ID and name do not match' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'draft_contracts' THEN
    NEW.object_id := NULL;
    NEW.object_name := NULL;
    RETURN NEW;
  END IF;
  IF obj.id IS NULL THEN
    RAISE EXCEPTION 'Choose an existing object or add it to the directory first' USING ERRCODE = '23503';
  END IF;
  NEW.object_id := obj.id;
  NEW.object_name := obj.name;
  RETURN NEW;
END;
$$;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['forming_contracts','rental_contracts','completed_contracts','draft_contracts'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN object_id bigint', tbl);
    EXECUTE format('UPDATE %I c SET object_id = o.id FROM contract_objects o WHERE c.object_name = o.name', tbl);
    IF tbl <> 'draft_contracts' THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN object_id SET NOT NULL', tbl);
    END IF;
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (object_id) REFERENCES contract_objects(id) ON DELETE RESTRICT', tbl, tbl || '_object_id_fk');
    EXECUTE format('CREATE INDEX %I ON %I(object_id)', tbl || '_object_id_idx', tbl);
    EXECUTE format('CREATE TRIGGER contract_object_resolve BEFORE INSERT OR UPDATE OF object_name, object_id ON %I FOR EACH ROW EXECUTE FUNCTION resolve_contract_object()', tbl);
  END LOOP;
END;
$$;
COMMIT;
