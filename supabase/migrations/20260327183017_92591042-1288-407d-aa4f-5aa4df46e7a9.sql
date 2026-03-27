DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_conversation_member(auth.uid(), id)
  );