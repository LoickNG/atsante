
-- Fix #2: Race condition in assign_first_user_admin - use advisory lock
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
BEGIN
  -- Use advisory lock to prevent race condition
  PERFORM pg_advisory_xact_lock(42);
  
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix #4: Add explicit restrictive policy to prevent non-admin INSERT on user_roles
-- First drop the existing permissive ALL policy name won't conflict
-- The existing ALL policy already requires admin, but add explicit denial for non-admin INSERT
CREATE POLICY "Deny non-admin insert on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
)
