-- In a hospital system, all staff legitimately need to see each other's names
-- The profiles table only contains: full_name, email, specialty, avatar_url
-- These are all professional/work data, not sensitive personal data
-- Restore broad read access for authenticated staff
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (true);