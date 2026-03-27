
-- Fix: prevent users from changing their clinic_id via profile update
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND clinic_id = get_my_clinic_id());

-- Also fix the restrictive clinic isolation policy to include WITH CHECK
DROP POLICY IF EXISTS "Clinic isolation" ON public.profiles;
CREATE POLICY "Clinic isolation"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR clinic_id = get_my_clinic_id()
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (user_id = auth.uid() AND (clinic_id IS NULL OR clinic_id = get_my_clinic_id()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
