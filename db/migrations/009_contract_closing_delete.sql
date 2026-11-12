BEGIN;
-- NocoBase removes associations before deleting their owner in the same transaction.
DROP TRIGGER cm_guard_closing_files ON completed_contract_closing_files;
CREATE TRIGGER cm_guard_closing_files BEFORE INSERT OR UPDATE ON completed_contract_closing_files
  FOR EACH ROW EXECUTE FUNCTION cm_guard_closing_files();
CREATE FUNCTION cm_guard_closing_file_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM completed_contracts WHERE id = OLD.contract_id AND closure_state = 'archived') THEN
    RAISE EXCEPTION 'Archived closing documents are read-only';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER cm_guard_closing_file_delete AFTER DELETE ON completed_contract_closing_files
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION cm_guard_closing_file_delete();
COMMIT;
