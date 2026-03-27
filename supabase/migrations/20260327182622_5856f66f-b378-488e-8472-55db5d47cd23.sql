
-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Fix conversation_participants SELECT policy using security definer function
DROP POLICY IF EXISTS "Users can view participants of own conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of own conversations" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    public.is_conversation_member(auth.uid(), conversation_id)
  );

-- Fix conversations SELECT policy using security definer function
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    public.is_conversation_member(auth.uid(), id)
  );

-- Fix conversations UPDATE policy using security definer function
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    public.is_conversation_member(auth.uid(), id)
  );

-- Fix messages SELECT policy using security definer function
DROP POLICY IF EXISTS "Users can view messages of own conversations" ON public.messages;
CREATE POLICY "Users can view messages of own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_conversation_member(auth.uid(), conversation_id)
  );

-- Fix messages INSERT policy using security definer function
DROP POLICY IF EXISTS "Users can send messages to own conversations" ON public.messages;
CREATE POLICY "Users can send messages to own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    public.is_conversation_member(auth.uid(), conversation_id)
  );

-- Fix conversation_participants INSERT policy
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creator can add participants" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    ))
    OR (user_id = auth.uid())
  );
