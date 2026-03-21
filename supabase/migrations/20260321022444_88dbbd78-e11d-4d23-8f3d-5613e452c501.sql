
-- Emergency visits table for the Urgences module
CREATE TABLE public.emergency_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  
  -- Triage
  triage_level text NOT NULL DEFAULT 'modere',  -- critique, urgent, modere, mineur
  chief_complaint text NOT NULL,
  arrival_mode text NOT NULL DEFAULT 'autonome', -- ambulance, autonome, transfert, pompiers
  
  -- Vitals at arrival
  temperature numeric NULL,
  heart_rate integer NULL,
  blood_pressure text NULL,
  spo2 integer NULL,
  respiratory_rate integer NULL,
  weight numeric NULL,
  
  -- Care
  doctor_id uuid NULL,
  nurse_id uuid NULL,
  diagnosis text NULL,
  treatment_notes text NULL,
  
  -- Orientation
  orientation text NULL,  -- sortie, hospitalisation, bloc_operatoire, transfert_externe, deces
  orientation_notes text NULL,
  hospitalization_id uuid NULL REFERENCES public.hospitalizations(id),
  
  -- Status & timestamps
  status text NOT NULL DEFAULT 'en_attente',  -- en_attente, triage, en_cours, termine
  arrived_at timestamp with time zone NOT NULL DEFAULT now(),
  triaged_at timestamp with time zone NULL,
  care_started_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_visits ENABLE ROW LEVEL SECURITY;

-- Medical staff can manage
CREATE POLICY "Medical staff can manage emergency_visits"
ON public.emergency_visits
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'medecin'::app_role) OR
  public.has_role(auth.uid(), 'infirmier'::app_role) OR
  public.has_role(auth.uid(), 'accueil'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'medecin'::app_role) OR
  public.has_role(auth.uid(), 'infirmier'::app_role) OR
  public.has_role(auth.uid(), 'accueil'::app_role)
);

-- Cashier can view
CREATE POLICY "Cashier can view emergency_visits"
ON public.emergency_visits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'caissier'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_emergency_visits_updated_at
  BEFORE UPDATE ON public.emergency_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_visits;
