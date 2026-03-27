
-- Table des services/départements configurables
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All staff can view services" ON public.services
  FOR SELECT TO authenticated
  USING (true);

-- Ajouter service_id aux profils
ALTER TABLE public.profiles ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

-- Insérer les services par défaut
INSERT INTO public.services (name, code) VALUES
  ('Urgences', 'urgences'),
  ('Hospitalisation', 'hospitalisation'),
  ('Maternité', 'maternite'),
  ('Pharmacie', 'pharmacie'),
  ('Laboratoire', 'laboratoire'),
  ('Imagerie', 'imagerie'),
  ('Consultation', 'consultation'),
  ('Administration', 'administration'),
  ('Accueil', 'accueil'),
  ('Bloc opératoire', 'bloc_operatoire'),
  ('Caisse', 'caisse'),
  ('Direction financière', 'daf');

-- Trigger updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
