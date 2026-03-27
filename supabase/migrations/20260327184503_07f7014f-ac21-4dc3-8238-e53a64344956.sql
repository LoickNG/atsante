
-- Fix has_role() to scope by clinic_id to prevent cross-clinic privilege escalation
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        -- Super admin is global, no clinic scoping needed
        _role = 'super_admin'::app_role
        -- For other roles, must match the caller's clinic
        OR ur.clinic_id = (SELECT clinic_id FROM public.profiles WHERE profiles.user_id = _user_id LIMIT 1)
      )
  )
$$;
