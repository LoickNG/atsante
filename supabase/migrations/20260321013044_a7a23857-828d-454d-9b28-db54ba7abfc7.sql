
-- Table for prenatal visits/consultations
CREATE TABLE public.prenatal_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maternity_admission_id UUID NOT NULL REFERENCES public.maternity_admissions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  gestational_weeks INTEGER,
  weight_kg NUMERIC,
  blood_pressure TEXT,
  uterine_height_cm NUMERIC,
  fetal_heart_rate INTEGER,
  presentation TEXT,
  edema TEXT,
  urine_protein TEXT,
  blood_sugar NUMERIC,
  hemoglobin NUMERIC,
  ultrasound_notes TEXT,
  ultrasound_date DATE,
  lab_notes TEXT,
  vaccinations TEXT,
  complications TEXT,
  recommendations TEXT,
  next_appointment DATE,
  notes TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prenatal_visits ENABLE ROW LEVEL SECURITY;

-- Medical staff can manage
CREATE POLICY "Medical staff can manage prenatal_visits"
  ON public.prenatal_visits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- Staff can view
CREATE POLICY "Staff can view prenatal_visits"
  ON public.prenatal_visits FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));
