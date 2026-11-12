BEGIN;
ALTER TABLE completed_contracts ADD COLUMN closure_state text;
ALTER TABLE completed_contracts ADD COLUMN closed_at timestamptz;
ALTER TABLE completed_contracts ADD COLUMN archived_at timestamptz;
UPDATE completed_contracts SET closure_state = 'archived';
ALTER TABLE completed_contracts ALTER COLUMN closure_state SET DEFAULT 'pending';
ALTER TABLE completed_contracts ALTER COLUMN closure_state SET NOT NULL;
ALTER TABLE completed_contracts ADD CONSTRAINT completed_closure_state CHECK (closure_state IN ('pending', 'archived'));
CREATE TABLE completed_contract_closing_files (
  contract_id bigint NOT NULL REFERENCES completed_contracts(id) ON DELETE CASCADE,
  attachment_id bigint NOT NULL REFERENCES attachments(id) ON DELETE RESTRICT,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id, attachment_id)
);
CREATE FUNCTION cm_guard_contract_closing() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.closure_state <> 'pending' THEN RAISE EXCEPTION 'New contracts must pass document closing'; END IF;
    NEW.closed_at := now();
    NEW.archived_at := NULL;
  ELSE
    NEW.closed_at := OLD.closed_at;
    NEW.archived_at := OLD.archived_at;
    IF NEW.closure_state IS DISTINCT FROM OLD.closure_state THEN
      IF OLD.closure_state = 'archived' THEN RAISE EXCEPTION 'Archived contract cannot return to document closing'; END IF;
      IF NOT EXISTS (SELECT 1 FROM completed_contract_closing_files WHERE contract_id = NEW.id) THEN
        RAISE EXCEPTION 'Attach closing documents before archiving';
      END IF;
      NEW.archived_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cm_guard_closing BEFORE INSERT OR UPDATE ON completed_contracts FOR EACH ROW EXECUTE FUNCTION cm_guard_contract_closing();
CREATE FUNCTION cm_guard_closing_files() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE state text;
BEGIN
  -- Serialize file changes with archiving; a concurrent removal cannot leave an empty archive.
  SELECT closure_state INTO state FROM completed_contracts WHERE id = COALESCE(NEW.contract_id, OLD.contract_id) FOR UPDATE;
  IF state = 'archived' THEN RAISE EXCEPTION 'Archived closing documents are read-only'; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.contract_id, NEW.attachment_id) IS DISTINCT FROM (OLD.contract_id, OLD.attachment_id) THEN
    RAISE EXCEPTION 'Detach and attach closing documents instead';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER cm_guard_closing_files BEFORE INSERT OR UPDATE OR DELETE ON completed_contract_closing_files FOR EACH ROW EXECUTE FUNCTION cm_guard_closing_files();
COMMIT;
