CREATE OR REPLACE FUNCTION public.user_belongs_to_clinic(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND clinic_id = _clinic_id
  )
$$;

DROP POLICY IF EXISTS "Clinic isolation" ON public.user_roles;
CREATE POLICY "Clinic isolation"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  clinic_id = get_my_clinic_id()
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert non-super-admin roles" ON public.user_roles;
CREATE POLICY "Admins can insert non-super-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND clinic_id = get_my_clinic_id()
  AND public.user_belongs_to_clinic(user_id, get_my_clinic_id())
);

DROP POLICY IF EXISTS "Admins can update non-super-admin roles" ON public.user_roles;
CREATE POLICY "Admins can update non-super-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND clinic_id = get_my_clinic_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND clinic_id = get_my_clinic_id()
  AND public.user_belongs_to_clinic(user_id, get_my_clinic_id())
);

DROP POLICY IF EXISTS "Admins can delete non-super-admin roles" ON public.user_roles;
CREATE POLICY "Admins can delete non-super-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'super_admin'::app_role
  AND clinic_id = get_my_clinic_id()
  AND public.user_belongs_to_clinic(user_id, get_my_clinic_id())
);