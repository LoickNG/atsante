-- Fix: Restrict licenses SELECT to admin only
DROP POLICY IF EXISTS "All staff can view own license" ON public.licenses;
CREATE POLICY "Admin can view licenses" ON public.licenses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));