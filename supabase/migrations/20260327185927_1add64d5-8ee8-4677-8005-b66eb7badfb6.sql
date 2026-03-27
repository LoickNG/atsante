DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny non-admin insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admin can assign super_admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admin can promote to super_admin" ON public.user_roles;

CREATE POLICY "Admins can insert non-super-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
);

CREATE POLICY "Admins can update non-super-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
);

CREATE POLICY "Admins can delete non-super-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
);

CREATE POLICY "Admins can view clinic roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));