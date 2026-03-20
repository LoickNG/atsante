
-- Table des chambres
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('1_lit', '2_lits', '4_lits')),
  comfort text NOT NULL CHECK (comfort IN ('climatise', 'ventile')),
  is_available boolean NOT NULL DEFAULT true,
  floor text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des hospitalisations
CREATE TABLE public.hospitalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  consultation_id uuid REFERENCES public.consultations(id),
  visit_id uuid REFERENCES public.visits(id),
  room_id uuid REFERENCES public.rooms(id),
  admission_date timestamptz NOT NULL DEFAULT now(),
  discharge_date timestamptz,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine', 'annule')),
  doctor_id uuid NOT NULL,
  discharge_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des soins pendant l'hospitalisation
CREATE TABLE public.hospitalization_care (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalization_id uuid NOT NULL REFERENCES public.hospitalizations(id) ON DELETE CASCADE,
  care_type text NOT NULL,
  description text NOT NULL,
  administered_by uuid NOT NULL,
  administered_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitalization_care ENABLE ROW LEVEL SECURITY;

-- RLS for rooms
CREATE POLICY "Admin can manage rooms" ON public.rooms FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can view rooms" ON public.rooms FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- RLS for hospitalizations
CREATE POLICY "Medical staff can manage hospitalizations" ON public.hospitalizations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));
CREATE POLICY "Staff can view hospitalizations" ON public.hospitalizations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- RLS for hospitalization_care
CREATE POLICY "Medical staff can manage hospitalization_care" ON public.hospitalization_care FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));
CREATE POLICY "Staff can view hospitalization_care" ON public.hospitalization_care FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitalizations_updated_at BEFORE UPDATE ON public.hospitalizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
