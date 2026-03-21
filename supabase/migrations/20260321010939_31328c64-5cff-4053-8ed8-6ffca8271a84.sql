
-- Licenses table for multi-clinic management
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name text NOT NULL,
  license_key text NOT NULL UNIQUE DEFAULT 'LIC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0'),
  max_users integer NOT NULL DEFAULT 5,
  current_users integer NOT NULL DEFAULT 0,
  enabled_modules text[] NOT NULL DEFAULT ARRAY['accueil', 'patients', 'consultations', 'pharmacie'],
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  is_active boolean NOT NULL DEFAULT true,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage licenses" ON public.licenses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All staff can view own license" ON public.licenses
  FOR SELECT TO authenticated
  USING (true);
