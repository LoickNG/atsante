
-- Maternity admissions table
CREATE TABLE public.maternity_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  admission_date timestamptz NOT NULL DEFAULT now(),
  expected_due_date date,
  discharge_date timestamptz,
  gestational_weeks integer,
  gravida integer DEFAULT 1,
  para integer DEFAULT 0,
  pregnancy_type text NOT NULL DEFAULT 'simple',
  risk_level text NOT NULL DEFAULT 'normal',
  blood_group text,
  rhesus text,
  notes text,
  status text NOT NULL DEFAULT 'en_cours',
  room_id uuid REFERENCES public.rooms(id),
  bed_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Births table
CREATE TABLE public.births (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maternity_admission_id uuid NOT NULL REFERENCES public.maternity_admissions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  baby_first_name text,
  baby_last_name text,
  baby_gender text NOT NULL,
  birth_date timestamptz NOT NULL DEFAULT now(),
  birth_weight_grams integer,
  birth_height_cm numeric,
  apgar_1min integer,
  apgar_5min integer,
  apgar_10min integer,
  delivery_type text NOT NULL DEFAULT 'voie_basse',
  head_circumference_cm numeric,
  complications text,
  baby_status text NOT NULL DEFAULT 'vivant',
  notes text,
  delivered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maternity_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.births ENABLE ROW LEVEL SECURITY;

-- RLS policies for maternity_admissions
CREATE POLICY "Medical staff can manage maternity_admissions" ON public.maternity_admissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

CREATE POLICY "Staff can view maternity_admissions" ON public.maternity_admissions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

-- RLS policies for births
CREATE POLICY "Medical staff can manage births" ON public.births
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

CREATE POLICY "Staff can view births" ON public.births
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

-- Trigger for notifications on new birth
CREATE OR REPLACE FUNCTION public.notify_new_birth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
  mother_name TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO mother_name
  FROM public.patients WHERE id = NEW.patient_id;

  FOR staff_record IN
    SELECT user_id FROM public.user_roles WHERE role IN ('medecin', 'infirmier', 'admin')
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES (
      staff_record.user_id,
      'Nouvelle naissance enregistrée',
      'Bébé ' || COALESCE(NEW.baby_first_name, '') || ' ' || COALESCE(NEW.baby_last_name, '') ||
      ' (' || CASE WHEN NEW.baby_gender = 'M' THEN 'Garçon' ELSE 'Fille' END || ')' ||
      ' - Mère: ' || COALESCE(mother_name, 'inconnue') ||
      ' - Poids: ' || COALESCE(NEW.birth_weight_grams::text, '?') || 'g',
      'naissance',
      NEW.id,
      'birth'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_birth
  AFTER INSERT ON public.births
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_birth();
