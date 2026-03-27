-- Helper: a user can access a conversation only if they belong to the conversation clinic,
-- or they are super_admin.
CREATE OR REPLACE FUNCTION public.can_access_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    LEFT JOIN public.profiles p ON p.user_id = _user_id
    WHERE c.id = _conversation_id
      AND (
        public.has_role(_user_id, 'super_admin'::app_role)
        OR (p.clinic_id IS NOT NULL AND c.clinic_id = p.clinic_id)
      )
  )
$$;

-- Helper: only valid participants can be inserted into a conversation.
-- Regular users can only add users from the same clinic.
-- super_admin can add themselves plus an admin from the target clinic.
CREATE OR REPLACE FUNCTION public.can_add_conversation_participant(_actor_id uuid, _conversation_id uuid, _participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    LEFT JOIN public.profiles participant_profile ON participant_profile.user_id = _participant_id
    WHERE c.id = _conversation_id
      AND (
        c.created_by = _actor_id
        OR public.has_role(_actor_id, 'super_admin'::app_role)
      )
      AND (
        (
          public.has_role(_actor_id, 'super_admin'::app_role)
          AND _participant_id = _actor_id
        )
        OR (
          participant_profile.clinic_id = c.clinic_id
          AND (
            NOT public.has_role(_actor_id, 'super_admin'::app_role)
            OR public.has_role(_participant_id, 'admin'::app_role)
          )
        )
      )
  )
$$;

-- Tighten conversations creation: clinic_id is mandatory and must be scoped.
DROP POLICY IF EXISTS "Authenticated can create conversations" ON public.conversations;

CREATE POLICY "Authenticated can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND clinic_id IS NOT NULL
  AND (
    clinic_id = public.get_my_clinic_id()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Add restrictive clinic isolation on conversations.
CREATE POLICY "Conversation clinic isolation"
ON public.conversations
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.can_access_conversation(auth.uid(), id))
WITH CHECK (
  clinic_id IS NOT NULL
  AND (
    clinic_id = public.get_my_clinic_id()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- Add restrictive access rules on conversation participants.
CREATE POLICY "Conversation participants clinic isolation"
ON public.conversation_participants
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.can_access_conversation(auth.uid(), conversation_id));

CREATE POLICY "Conversation participants update isolation"
ON public.conversation_participants
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.can_access_conversation(auth.uid(), conversation_id))
WITH CHECK (
  user_id = auth.uid()
  AND public.can_access_conversation(auth.uid(), conversation_id)
);

CREATE POLICY "Conversation participants insert isolation"
ON public.conversation_participants
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_conversation(auth.uid(), conversation_id)
  AND public.can_add_conversation_participant(auth.uid(), conversation_id, user_id)
);

-- Preserve sender/receiver identity for the allowed super_admin <-> admin chat only.
DROP POLICY IF EXISTS "Clinic isolation" ON public.profiles;

CREATE POLICY "Clinic isolation"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR clinic_id = public.get_my_clinic_id()
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.conversation_participants cp_me
    JOIN public.conversation_participants cp_them
      ON cp_me.conversation_id = cp_them.conversation_id
    WHERE cp_me.user_id = auth.uid()
      AND cp_them.user_id = profiles.user_id
      AND public.has_role(profiles.user_id, 'super_admin'::app_role)
  )
);
