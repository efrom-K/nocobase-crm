-- Object geography is private operational data, populated separately from the repository.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE contract_objects ADD COLUMN IF NOT EXISTS map_location jsonb;
COMMIT;
