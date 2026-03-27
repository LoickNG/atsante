-- Allow users to see profiles of people they share a conversation with
DROP POLICY IF EXISTS "Users can view same clinic profiles" ON public.profiles;

CREATE POLICY "Users can view same clinic or conversation profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR clinic_id = get_my_clinic_id()
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = auth.uid() AND cp2.user_id = profiles.user_id
    )
  );