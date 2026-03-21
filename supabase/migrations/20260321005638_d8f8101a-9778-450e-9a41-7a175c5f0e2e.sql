
-- Operating rooms (blocs opératoires)
CREATE TABLE public.operating_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  room_number text NOT NULL UNIQUE,
  is_available boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.operating_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage operating_rooms" ON public.operating_rooms
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view operating_rooms" ON public.operating_rooms
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- Surgeries (interventions chirurgicales)
CREATE TABLE public.surgeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  operating_room_id uuid NOT NULL REFERENCES public.operating_rooms(id),
  doctor_id uuid NOT NULL,
  hospitalization_id uuid REFERENCES public.hospitalizations(id),
  scheduled_date timestamp with time zone NOT NULL,
  estimated_duration_minutes integer NOT NULL DEFAULT 60,
  surgery_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planifie',
  notes text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medical staff can manage surgeries" ON public.surgeries
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

CREATE POLICY "Staff can view surgeries" ON public.surgeries
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_operating_rooms_updated_at BEFORE UPDATE ON public.operating_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON public.surgeries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify medical staff when a surgery is scheduled
CREATE OR REPLACE FUNCTION public.notify_surgery_scheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_record RECORD;
  patient_name TEXT;
  surgery_date TEXT;
BEGIN
  IF NEW.status = 'planifie' THEN
    SELECT first_name || ' ' || last_name INTO patient_name
    FROM public.patients WHERE id = NEW.patient_id;

    surgery_date := TO_CHAR(NEW.scheduled_date AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI');

    FOR staff_record IN
      SELECT user_id FROM public.user_roles WHERE role IN ('medecin', 'infirmier', 'admin')
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (
        staff_record.user_id,
        'Intervention chirurgicale programmée',
        'Patient ' || COALESCE(patient_name, 'inconnu') || ' - ' || NEW.surgery_type || ' le ' || surgery_date,
        'chirurgie',
        NEW.id,
        'surgery'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_surgery_insert
AFTER INSERT ON public.surgeries
FOR EACH ROW EXECUTE FUNCTION public.notify_surgery_scheduled();
