BEGIN;
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
      -- Partial refunds retain the remainder.
      NEW.closure_deposit_remainder := 'retain';
      IF NEW.closure_deposit_refund IS NOT NULL AND (NEW.closure_deposit_refund <= 0 OR NEW.closure_deposit_amount IS NULL OR NEW.closure_deposit_refund >= NEW.closure_deposit_amount) THEN RAISE EXCEPTION 'Invalid partial refund'; END IF;
      NEW.closure_deposit_retained := NEW.closure_deposit_amount-NEW.closure_deposit_refund; NEW.closure_deposit_rent := 0;
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
