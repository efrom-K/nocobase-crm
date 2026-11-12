BEGIN;
ALTER TABLE completed_contracts
  ADD COLUMN closure_termination_mode text,
  ADD COLUMN closure_documents jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN closure_deposit_action text,
  ADD COLUMN closure_deposit_remainder text,
  ADD COLUMN closure_deposit_amount numeric(18,2),
  ADD COLUMN closure_deposit_refund numeric(18,2),
  ADD COLUMN closure_deposit_retained numeric(18,2),
  ADD COLUMN closure_deposit_rent numeric(18,2);
CREATE FUNCTION cm_closing_details_error(r completed_contracts) RETURNS text LANGUAGE plpgsql STABLE AS $$
DECLARE doc jsonb; file_count integer; doc_count integer; kinds text[] := '{}'; signed_date date;
BEGIN
  IF r.closure_termination_mode IS NULL OR r.closure_termination_mode NOT IN ('unilateral','bilateral') THEN RETURN 'Select unilateral or bilateral termination'; END IF;
  SELECT count(*) INTO file_count FROM completed_contract_closing_files WHERE contract_id=r.id;
  IF file_count=0 THEN RETURN 'Attach closing documents'; END IF;
  IF jsonb_typeof(r.closure_documents) IS DISTINCT FROM 'array' THEN RETURN 'Invalid closing document metadata'; END IF;
  doc_count := jsonb_array_length(r.closure_documents);
  IF doc_count <> file_count THEN RETURN 'Classify and date every closing file'; END IF;
  IF (SELECT count(DISTINCT d->>'file_id') FROM jsonb_array_elements(r.closure_documents) d) <> doc_count THEN RETURN 'Duplicate closing file metadata'; END IF;
  FOR doc IN SELECT value FROM jsonb_array_elements(r.closure_documents) LOOP
    IF jsonb_typeof(doc) <> 'object' OR coalesce(doc->>'file_id','') !~ '^[1-9][0-9]*$' THEN RETURN 'Invalid closing file'; END IF;
    IF NOT EXISTS (SELECT 1 FROM completed_contract_closing_files f WHERE f.contract_id=r.id AND f.attachment_id::text=doc->>'file_id') THEN RETURN 'Closing file is not attached to this contract'; END IF;
    IF coalesce(doc->>'kind','') NOT IN ('termination_agreement','return_act','reconciliation_act','other') THEN RETURN 'Select document type for every file'; END IF;
    IF coalesce(doc->>'signed_on','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RETURN 'Enter signing date for every file'; END IF;
    BEGIN signed_date := (doc->>'signed_on')::date;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN 'Invalid document signing date'; END;
    IF signed_date < DATE '1900-01-01' OR signed_date > DATE '2099-12-31' THEN RETURN 'Invalid document signing date'; END IF;
    kinds := array_append(kinds, doc->>'kind');
  END LOOP;
  IF NOT ARRAY['termination_agreement','return_act','reconciliation_act'] <@ kinds THEN RETURN 'Termination agreement, return act and reconciliation act are required'; END IF;
  IF r.closure_deposit_amount IS NULL OR r.closure_deposit_amount < 0 OR r.closure_deposit_amount > 999999999999.99 THEN RETURN 'Enter a nonnegative deposit amount'; END IF;
  IF r.closure_deposit_action IS NULL OR r.closure_deposit_action NOT IN ('refund','retain','rent','partial') THEN RETURN 'Select deposit disposition'; END IF;
  IF r.closure_deposit_action='partial' THEN
    IF r.closure_deposit_refund IS NULL OR r.closure_deposit_refund <= 0 OR r.closure_deposit_refund >= r.closure_deposit_amount THEN RETURN 'Partial refund must be greater than zero and less than the deposit'; END IF;
    IF r.closure_deposit_remainder IS NULL OR r.closure_deposit_remainder NOT IN ('retain','rent') THEN RETURN 'Select how to allocate the remaining deposit'; END IF;
  END IF;
  IF coalesce(r.closure_deposit_refund,0) + coalesce(r.closure_deposit_retained,0) + coalesce(r.closure_deposit_rent,0) <> r.closure_deposit_amount THEN RETURN 'Deposit allocation must balance'; END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION cm_guard_contract_closing() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE problem text;
BEGIN
  IF TG_OP='UPDATE' THEN
    NEW.closed_at := OLD.closed_at;
    NEW.archived_at := OLD.archived_at;
    IF OLD.closure_state='archived' THEN
      IF NEW.closure_state IS DISTINCT FROM OLD.closure_state THEN RAISE EXCEPTION 'Archived contract cannot return to document closing'; END IF;
      IF ROW(NEW.closure_termination_mode,NEW.closure_documents,NEW.closure_deposit_action,NEW.closure_deposit_remainder,NEW.closure_deposit_amount,NEW.closure_deposit_refund,NEW.closure_deposit_retained,NEW.closure_deposit_rent)
        IS DISTINCT FROM ROW(OLD.closure_termination_mode,OLD.closure_documents,OLD.closure_deposit_action,OLD.closure_deposit_remainder,OLD.closure_deposit_amount,OLD.closure_deposit_refund,OLD.closure_deposit_retained,OLD.closure_deposit_rent) THEN
        RAISE EXCEPTION 'Archived closing details are read-only';
      END IF;
      RETURN NEW;
    END IF;
  ELSE
    IF NEW.closure_state <> 'pending' THEN RAISE EXCEPTION 'New contracts must pass document closing'; END IF;
    NEW.closed_at := now(); NEW.archived_at := NULL;
  END IF;
  IF NEW.closure_termination_mode IS NOT NULL AND NEW.closure_termination_mode NOT IN ('unilateral','bilateral') THEN RAISE EXCEPTION 'Invalid termination mode'; END IF;
  IF jsonb_typeof(NEW.closure_documents) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.closure_documents)>500 THEN RAISE EXCEPTION 'Invalid closing document metadata'; END IF;
  IF NEW.closure_deposit_action IS NOT NULL AND NEW.closure_deposit_action NOT IN ('refund','retain','rent','partial') THEN RAISE EXCEPTION 'Invalid deposit disposition'; END IF;
  IF NEW.closure_deposit_remainder IS NOT NULL AND NEW.closure_deposit_remainder NOT IN ('retain','rent') THEN RAISE EXCEPTION 'Invalid remaining deposit disposition'; END IF;
  IF NEW.closure_deposit_amount IS NOT NULL AND (NEW.closure_deposit_amount < 0 OR NEW.closure_deposit_amount > 999999999999.99) THEN RAISE EXCEPTION 'Invalid deposit amount'; END IF;
  NEW.closure_deposit_retained := NULL; NEW.closure_deposit_rent := NULL;
  CASE NEW.closure_deposit_action
    WHEN 'refund' THEN NEW.closure_deposit_refund := NEW.closure_deposit_amount; NEW.closure_deposit_retained := 0; NEW.closure_deposit_rent := 0; NEW.closure_deposit_remainder := NULL;
    WHEN 'retain' THEN NEW.closure_deposit_refund := 0; NEW.closure_deposit_retained := NEW.closure_deposit_amount; NEW.closure_deposit_rent := 0; NEW.closure_deposit_remainder := NULL;
    WHEN 'rent' THEN NEW.closure_deposit_refund := 0; NEW.closure_deposit_retained := 0; NEW.closure_deposit_rent := NEW.closure_deposit_amount; NEW.closure_deposit_remainder := NULL;
    WHEN 'partial' THEN
      IF NEW.closure_deposit_refund IS NOT NULL AND (NEW.closure_deposit_refund <= 0 OR NEW.closure_deposit_amount IS NULL OR NEW.closure_deposit_refund >= NEW.closure_deposit_amount) THEN RAISE EXCEPTION 'Invalid partial refund'; END IF;
      IF NEW.closure_deposit_remainder='retain' THEN NEW.closure_deposit_retained := NEW.closure_deposit_amount-NEW.closure_deposit_refund; NEW.closure_deposit_rent := 0;
      ELSIF NEW.closure_deposit_remainder='rent' THEN NEW.closure_deposit_rent := NEW.closure_deposit_amount-NEW.closure_deposit_refund; NEW.closure_deposit_retained := 0;
      END IF;
    ELSE NEW.closure_deposit_refund := NULL;
  END CASE;
  IF TG_OP='UPDATE' AND NEW.closure_state='archived' THEN
    problem := cm_closing_details_error(NEW);
    IF problem IS NOT NULL THEN RAISE EXCEPTION '%', problem; END IF;
    NEW.archived_at := now();
  END IF;
  RETURN NEW;
END $$;
COMMIT;
