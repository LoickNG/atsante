
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
      AND (
        (ur.role = _role AND (
          _role = 'super_admin'::app_role
          OR ur.clinic_id = (SELECT clinic_id FROM public.profiles WHERE profiles.user_id = _user_id LIMIT 1)
        ))
        OR (ur.role::text = 'demo' AND _role::text != 'super_admin')
      )
  )
$$;
