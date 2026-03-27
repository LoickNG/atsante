DROP POLICY IF EXISTS "Clinic isolation" ON public.profiles;

CREATE POLICY "Profiles select isolation"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR clinic_id = get_my_clinic_id()
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'demo'::app_role))
    AND has_role(profiles.user_id, 'super_admin'::app_role)
  )
  OR (
    has_role(auth.uid(), 'super_admin'::app_role)
    AND (
      has_role(profiles.user_id, 'admin'::app_role)
      OR has_role(profiles.user_id, 'demo'::app_role)
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid()
      AND cp2.user_id = profiles.user_id
  )
);

CREATE POLICY "Profiles insert isolation"
ON public.profiles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  ((user_id = auth.uid()) AND ((clinic_id IS NULL) OR (clinic_id = get_my_clinic_id())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Profiles update isolation"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  ((auth.uid() = user_id) AND (clinic_id = get_my_clinic_id()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);