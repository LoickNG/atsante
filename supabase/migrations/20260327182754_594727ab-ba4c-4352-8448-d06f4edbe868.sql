
-- Allow authenticated users to create conversations
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );
