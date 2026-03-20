-- Revoke direct write access from anon role on user_roles for extra safety
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;

-- Update profiles SELECT policy so all authenticated staff can see colleague names (needed for app functionality)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);