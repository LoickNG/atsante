
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  reference_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger with security definer)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: notify nurses when a new visit is added to queue
CREATE OR REPLACE FUNCTION public.notify_nurses_on_new_visit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  nurse_record RECORD;
  patient_name TEXT;
BEGIN
  -- Only trigger for new waiting visits
  IF NEW.status = 'en_attente' THEN
    -- Get patient name
    SELECT first_name || ' ' || last_name INTO patient_name
    FROM public.patients WHERE id = NEW.patient_id;

    -- Insert notification for each nurse
    FOR nurse_record IN
      SELECT user_id FROM public.user_roles WHERE role = 'infirmier'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        nurse_record.user_id,
        'Nouveau patient en attente',
        'Le patient ' || COALESCE(patient_name, 'inconnu') || ' a été ajouté à la file d''attente.',
        'file_attente',
        NEW.id,
        'visit'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_new_visit_notify_nurses
  AFTER INSERT ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nurses_on_new_visit();
