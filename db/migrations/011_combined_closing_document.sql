BEGIN;
CREATE OR REPLACE FUNCTION cm_closing_details_error(r completed_contracts) RETURNS text LANGUAGE plpgsql STABLE AS $$
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
    IF coalesce(doc->>'kind','') NOT IN ('termination_agreement','return_act','reconciliation_act','termination_and_return','other') THEN RETURN 'Select document type for every file'; END IF;
    IF coalesce(doc->>'signed_on','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RETURN 'Enter signing date for every file'; END IF;
    BEGIN signed_date := (doc->>'signed_on')::date;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RETURN 'Invalid document signing date'; END;
    IF signed_date < DATE '1900-01-01' OR signed_date > DATE '2099-12-31' THEN RETURN 'Invalid document signing date'; END IF;
    kinds := array_append(kinds, doc->>'kind');
    IF doc->>'kind'='termination_and_return' THEN kinds := kinds || ARRAY['termination_agreement','return_act']; END IF;
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
COMMIT;
