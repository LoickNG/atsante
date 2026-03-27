-- Tighten user_roles clinic isolation by removing self-access from the RESTRICTIVE policy.
-- Self-access is already handled by the permissive "Users can view own role" policy.
DROP POLICY IF EXISTS "Clinic isolation" ON public.user_roles;
CREATE POLICY "Clinic isolation" ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (clinic_id = get_my_clinic_id())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Remove weaker conversation insert policy that allowed arbitrary clinic_id association
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;