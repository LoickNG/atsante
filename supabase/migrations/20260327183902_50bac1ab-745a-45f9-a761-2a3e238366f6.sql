-- Replace the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can view their own profile + profiles in the same clinic
CREATE POLICY "Users can view same clinic profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR clinic_id = get_my_clinic_id()
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );