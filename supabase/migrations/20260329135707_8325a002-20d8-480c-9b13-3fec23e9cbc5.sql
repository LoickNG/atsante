
-- Table to track active sessions (one per user)
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  session_id text NOT NULL,
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  clinic_id uuid REFERENCES public.clinic_settings(id)
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own session
CREATE POLICY "Users can view own session"
ON public.active_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can insert/update their own session
CREATE POLICY "Users can upsert own session"
ON public.active_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own session"
ON public.active_sessions FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own session"
ON public.active_sessions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Super admin full access
CREATE POLICY "Super admin full access"
ON public.active_sessions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to check if user has an active session elsewhere
CREATE OR REPLACE FUNCTION public.check_active_session(p_user_id uuid, p_session_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.active_sessions
    WHERE user_id = p_user_id
      AND session_id != p_session_id
      AND last_active_at > (now() - interval '5 minutes')
  );
$$;

-- Function to register/update session
CREATE OR REPLACE FUNCTION public.upsert_session(p_user_id uuid, p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.active_sessions (user_id, session_id, last_active_at, clinic_id)
  VALUES (p_user_id, p_session_id, now(), get_my_clinic_id())
  ON CONFLICT (user_id)
  DO UPDATE SET session_id = p_session_id, last_active_at = now();
END;
$$;

-- Function to clear session on logout
CREATE OR REPLACE FUNCTION public.clear_session(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.active_sessions WHERE user_id = p_user_id;
END;
$$;
