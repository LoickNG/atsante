
-- Update can_access_conversation: same clinic only, super_admin can access conversations with admin/demo
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
        -- Super admin: can access any conversation they are a member of
        (has_role(_user_id, 'super_admin'::app_role) AND is_conversation_member(_user_id, _conversation_id))
        -- Same clinic users
        OR (p.clinic_id IS NOT NULL AND c.clinic_id IS NOT NULL AND c.clinic_id = p.clinic_id)
      )
  )
$$;

-- Update can_add_conversation_participant: same clinic, or super_admin adding admin/demo
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
    LEFT JOIN public.profiles actor_profile ON actor_profile.user_id = _actor_id
    LEFT JOIN public.profiles participant_profile ON participant_profile.user_id = _participant_id
    WHERE c.id = _conversation_id
      AND (
        -- Super admin can add admin/demo users from any clinic
        (
          has_role(_actor_id, 'super_admin'::app_role)
          AND (has_role(_participant_id, 'admin'::app_role) OR has_role(_participant_id, 'demo'::app_role) OR _participant_id = _actor_id)
        )
        -- Admin/demo can add super_admin to conversations
        OR (
          (has_role(_actor_id, 'admin'::app_role) OR has_role(_actor_id, 'demo'::app_role))
          AND has_role(_participant_id, 'super_admin'::app_role)
        )
        -- Same clinic: creator or member can add same-clinic users
        OR (
          (c.created_by = _actor_id OR is_conversation_member(_actor_id, _conversation_id))
          AND participant_profile.clinic_id IS NOT NULL 
          AND participant_profile.clinic_id = actor_profile.clinic_id
        )
      )
  )
$$;
