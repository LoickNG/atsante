
CREATE TABLE public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Ma Clinique',
  logo_url text,
  address text,
  city text,
  country text DEFAULT 'République Démocratique du Congo',
  phone text,
  phone2 text,
  email text,
  website text,
  tax_id text,
  license_number text,
  slogan text,
  primary_color text DEFAULT '#1e40af',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage clinic_settings" ON public.clinic_settings
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All staff can view clinic_settings" ON public.clinic_settings
FOR SELECT TO authenticated
USING (true);

-- Insert default row
INSERT INTO public.clinic_settings (name) VALUES ('Ma Clinique');

-- Trigger updated_at
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
