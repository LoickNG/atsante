
-- Add clinic_id to specialties for multi-tenant isolation
ALTER TABLE public.specialties ADD COLUMN clinic_id uuid REFERENCES public.clinic_settings(id);

-- Drop old policies
DROP POLICY IF EXISTS "Admin can manage specialties" ON public.specialties;
DROP POLICY IF EXISTS "Staff can view specialties" ON public.specialties;

-- Clinic isolation (restrictive)
CREATE POLICY "Clinic isolation" ON public.specialties AS RESTRICTIVE FOR ALL TO authenticated
  USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (clinic_id IS NULL OR clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admin can manage specialties
CREATE POLICY "Admin can manage specialties" ON public.specialties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view specialties
CREATE POLICY "Staff can view specialties" ON public.specialties FOR SELECT TO authenticated
  USING (true);

-- Super admin full access
CREATE POLICY "Super admin full access" ON public.specialties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Auto-set clinic_id trigger
CREATE TRIGGER set_specialties_clinic_id BEFORE INSERT ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();

-- Update existing specialties: assign to all clinics or leave null
-- We'll duplicate existing specialties for each clinic
DO $$
DECLARE
  clinic RECORD;
  spec RECORD;
BEGIN
  FOR clinic IN SELECT id FROM public.clinic_settings LOOP
    FOR spec IN SELECT value, label, is_active FROM public.specialties WHERE clinic_id IS NULL LOOP
      INSERT INTO public.specialties (value, label, is_active, clinic_id)
      VALUES (spec.value, spec.label, spec.is_active, clinic.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  -- Remove the unassigned ones
  DELETE FROM public.specialties WHERE clinic_id IS NULL;
END $$;
