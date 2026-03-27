
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
        OR (c.clinic_id IS NULL AND public.is_conversation_member(_user_id, _conversation_id))
      )
  )
$$;
