-- Prevent clinic admins from granting or promoting anyone to super_admin
CREATE POLICY "Only super admin can assign super_admin role"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  role <> 'super_admin'::app_role
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Only super admin can promote to super_admin"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  role <> 'super_admin'::app_role
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Restrict clinic settings reads to admins/super admins only,
-- since this table contains sensitive data such as activated_license_key
DROP POLICY IF EXISTS "All staff can view own clinic_settings" ON public.clinic_settings;

CREATE POLICY "Admins can view own clinic_settings"
ON public.clinic_settings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
