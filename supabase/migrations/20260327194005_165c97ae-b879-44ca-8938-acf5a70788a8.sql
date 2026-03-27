
-- Fix RESTRICTIVE "Clinic isolation" policies missing WITH CHECK
-- clinic_settings uses "id" not "clinic_id", handle separately

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'births', 'consultations', 'conventions',
    'emergency_visits', 'hospitalization_care', 'hospitalizations',
    'imaging_requests', 'insurance_companies', 'invoice_items',
    'invoices', 'lab_requests', 'maternity_admissions', 'medical_acts',
    'medications', 'notifications', 'operating_rooms', 'partner_companies',
    'patients', 'payments', 'prenatal_visits', 'prescriptions',
    'rooms', 'stock_movements', 'surgeries', 'visits'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Clinic isolation" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Clinic isolation" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING ((clinic_id = get_my_clinic_id()) OR has_role(auth.uid(), ''super_admin''::app_role))
       WITH CHECK ((clinic_id IS NULL OR clinic_id = get_my_clinic_id()) OR has_role(auth.uid(), ''super_admin''::app_role))',
      tbl
    );
  END LOOP;
END $$;

-- Fix clinic_settings separately (uses "id" not "clinic_id")
DROP POLICY IF EXISTS "Clinic isolation" ON public.clinic_settings;
CREATE POLICY "Clinic isolation" ON public.clinic_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING ((id = get_my_clinic_id()) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK ((id = get_my_clinic_id()) OR has_role(auth.uid(), 'super_admin'::app_role));
