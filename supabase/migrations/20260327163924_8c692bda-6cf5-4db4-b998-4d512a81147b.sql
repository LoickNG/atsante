
-- Update licenses RLS to allow super_admin full access
DROP POLICY IF EXISTS "Admin can manage licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admin can view licenses" ON public.licenses;

CREATE POLICY "Super admin can manage licenses"
ON public.licenses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admin can view own license"
ON public.licenses FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND license_key = (
    SELECT activated_license_key FROM public.clinic_settings LIMIT 1
  )
);

-- Allow super_admin to manage clinic_settings too
DROP POLICY IF EXISTS "Admin can manage clinic_settings" ON public.clinic_settings;
CREATE POLICY "Admin and super admin can manage clinic_settings"
ON public.clinic_settings FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
