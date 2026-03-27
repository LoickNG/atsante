CREATE POLICY "Super admin can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));