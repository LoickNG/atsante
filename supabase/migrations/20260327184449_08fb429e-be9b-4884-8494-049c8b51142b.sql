
-- 1. Add RESTRICTIVE clinic isolation policy on clinic_settings
CREATE POLICY "Clinic isolation" ON public.clinic_settings
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    id = get_my_clinic_id()
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 2. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "All staff can view clinic_settings" ON public.clinic_settings;

-- 3. Re-create SELECT policy scoped to own clinic (the RESTRICTIVE policy above handles isolation)
CREATE POLICY "All staff can view own clinic_settings" ON public.clinic_settings
  FOR SELECT
  TO authenticated
  USING (true);
