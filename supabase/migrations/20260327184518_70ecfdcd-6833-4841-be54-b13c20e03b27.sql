
-- Fix search_path on all mutable functions
CREATE OR REPLACE FUNCTION public.update_stock_on_dispense()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF NEW.dispensed = true AND OLD.dispensed = false THEN
    UPDATE public.medications 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.medication_id;
    
    INSERT INTO public.stock_movements (medication_id, quantity, type, reason, reference_id, performed_by)
    VALUES (NEW.medication_id, -NEW.quantity, 'sortie', 'Délivrance prescription', NEW.id, NEW.dispensed_by);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_patient_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.code := 'PAT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('patient_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.invoice_number := 'FAC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
