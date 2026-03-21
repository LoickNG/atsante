-- Create a security definer view function so staff can see names but not emails of others
CREATE OR REPLACE FUNCTION public.get_profile_display(p_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, specialty text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, specialty
  FROM public.profiles
  WHERE profiles.user_id = p_user_id;
$$;

-- Restrict profiles: users see own full profile, others need admin
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));