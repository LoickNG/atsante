
-- Table des assurances partenaires
CREATE TABLE public.insurance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des sociétés partenaires
CREATE TABLE public.partner_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des conventions tripartites
CREATE TABLE public.conventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.partner_companies(id) ON DELETE CASCADE,
  insurance_id uuid REFERENCES public.insurance_companies(id) ON DELETE SET NULL,
  company_coverage_percent numeric NOT NULL DEFAULT 0 CHECK (company_coverage_percent >= 0 AND company_coverage_percent <= 100),
  insurance_coverage_percent numeric NOT NULL DEFAULT 0 CHECK (insurance_coverage_percent >= 0 AND insurance_coverage_percent <= 100),
  patient_coverage_percent numeric NOT NULL DEFAULT 100 CHECK (patient_coverage_percent >= 0 AND patient_coverage_percent <= 100),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ajout du lien société sur le patient
ALTER TABLE public.patients ADD COLUMN company_id uuid REFERENCES public.partner_companies(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN convention_id uuid REFERENCES public.conventions(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN employee_id text;

-- Ajout des parts sur la facture
ALTER TABLE public.invoices ADD COLUMN convention_id uuid REFERENCES public.conventions(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN company_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN insurance_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN patient_amount numeric NOT NULL DEFAULT 0;

-- RLS pour insurance_companies
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view insurance_companies" ON public.insurance_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage insurance_companies" ON public.insurance_companies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS pour partner_companies
ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view partner_companies" ON public.partner_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage partner_companies" ON public.partner_companies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS pour conventions
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view conventions" ON public.conventions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage conventions" ON public.conventions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers updated_at
CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON public.insurance_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_companies_updated_at BEFORE UPDATE ON public.partner_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conventions_updated_at BEFORE UPDATE ON public.conventions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
