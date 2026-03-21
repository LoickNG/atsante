
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage specialties" ON public.specialties
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view specialties" ON public.specialties
FOR SELECT TO authenticated
USING (true);

-- Seed with existing specialties
INSERT INTO public.specialties (value, label) VALUES
  ('generaliste', 'Médecine générale'),
  ('dentiste', 'Dentisterie'),
  ('gynecologie', 'Gynécologie'),
  ('pediatrie', 'Pédiatrie'),
  ('cardiologie', 'Cardiologie'),
  ('dermatologie', 'Dermatologie'),
  ('ophtalmologie', 'Ophtalmologie'),
  ('orl', 'ORL'),
  ('chirurgie', 'Chirurgie'),
  ('neurologie', 'Neurologie'),
  ('urologie', 'Urologie'),
  ('radiologie', 'Radiologie'),
  ('pneumologie', 'Pneumologie'),
  ('rhumatologie', 'Rhumatologie');
