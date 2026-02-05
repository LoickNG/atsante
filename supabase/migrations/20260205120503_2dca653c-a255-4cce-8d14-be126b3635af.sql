-- Création du type enum pour les rôles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'accueil', 
  'medecin',
  'infirmier',
  'caissier',
  'pharmacien',
  'laborantin',
  'imagerie'
);

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des rôles utilisateurs (séparée pour sécurité)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Table des patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  phone TEXT NOT NULL,
  address TEXT,
  blood_type TEXT,
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des visites (file d'attente)
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('consultation', 'urgence', 'suivi')),
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'termine', 'annule')),
  assigned_doctor_id UUID REFERENCES auth.users(id),
  notes TEXT,
  diagnosis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des médicaments
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  form TEXT NOT NULL CHECK (form IN ('comprimé', 'sirop', 'injectable', 'pommade', 'gouttes', 'autre')),
  dosage_unit TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  unit_price DECIMAL(10, 2) NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des actes médicaux (pour facturation)
CREATE TABLE public.medical_acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consultation', 'analyse', 'imagerie', 'soins', 'autre')),
  unit_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des consultations
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  symptoms TEXT,
  diagnosis TEXT,
  notes TEXT,
  temperature DECIMAL(3, 1),
  blood_pressure TEXT,
  heart_rate INTEGER,
  weight DECIMAL(5, 2),
  height DECIMAL(5, 2),
  status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  dispensed BOOLEAN NOT NULL DEFAULT false,
  dispensed_at TIMESTAMP WITH TIME ZONE,
  dispensed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des demandes laboratoire
CREATE TABLE public.lab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  test_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'demande' CHECK (status IN ('demande', 'en_cours', 'termine', 'annule')),
  priority TEXT NOT NULL DEFAULT 'normale' CHECK (priority IN ('normale', 'urgente')),
  results TEXT,
  result_values JSONB,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des demandes imagerie
CREATE TABLE public.imaging_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('radio', 'echo', 'scanner', 'irm', 'autre')),
  body_part TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'demande' CHECK (status IN ('demande', 'en_cours', 'termine', 'annule')),
  priority TEXT NOT NULL DEFAULT 'normale' CHECK (priority IN ('normale', 'urgente')),
  image_url TEXT,
  report TEXT,
  performed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des factures
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  visit_id UUID REFERENCES public.visits(id),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'partiel', 'paye', 'annule')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Table des éléments de facture
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'medicament', 'analyse', 'imagerie', 'autre')),
  description TEXT NOT NULL,
  reference_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des paiements
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'mobile_money', 'carte', 'autre')),
  reference TEXT,
  received_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des mouvements de stock
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entree', 'sortie', 'ajustement')),
  reason TEXT,
  reference_id UUID,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les rôles (security definer pour éviter récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Politiques RLS pour patients (accessible par personnel authentifié)
CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accueil and admin can manage patients" ON public.patients FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accueil'));

-- Politiques RLS pour visits
CREATE POLICY "Authenticated users can view visits" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage visits" ON public.visits FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accueil') OR public.has_role(auth.uid(), 'medecin') OR public.has_role(auth.uid(), 'infirmier'));

-- Politiques RLS pour medications
CREATE POLICY "Authenticated users can view medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacien and admin can manage medications" ON public.medications FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pharmacien'));

-- Politiques RLS pour medical_acts
CREATE POLICY "Authenticated users can view medical_acts" ON public.medical_acts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage medical_acts" ON public.medical_acts FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour consultations
CREATE POLICY "Authenticated users can view consultations" ON public.consultations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can manage consultations" ON public.consultations FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'medecin'));

-- Politiques RLS pour prescriptions
CREATE POLICY "Authenticated users can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medical staff can manage prescriptions" ON public.prescriptions FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'medecin') OR public.has_role(auth.uid(), 'pharmacien'));

-- Politiques RLS pour lab_requests
CREATE POLICY "Authenticated users can view lab_requests" ON public.lab_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lab staff can manage lab_requests" ON public.lab_requests FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'medecin') OR public.has_role(auth.uid(), 'laborantin'));

-- Politiques RLS pour imaging_requests
CREATE POLICY "Authenticated users can view imaging_requests" ON public.imaging_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Imaging staff can manage imaging_requests" ON public.imaging_requests FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'medecin') OR public.has_role(auth.uid(), 'imagerie'));

-- Politiques RLS pour invoices
CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can manage invoices" ON public.invoices FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caissier'));

-- Politiques RLS pour invoice_items
CREATE POLICY "Authenticated users can view invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can manage invoice_items" ON public.invoice_items FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caissier'));

-- Politiques RLS pour payments
CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can manage payments" ON public.payments FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caissier'));

-- Politiques RLS pour stock_movements
CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacien can manage stock_movements" ON public.stock_movements FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pharmacien'));

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour mettre à jour le stock après délivrance
CREATE OR REPLACE FUNCTION public.update_stock_on_dispense()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dispensed = true AND OLD.dispensed = false THEN
    UPDATE public.medications 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.medication_id;
    
    INSERT INTO public.stock_movements (medication_id, quantity, type, reason, reference_id, performed_by)
    VALUES (NEW.medication_id, -NEW.quantity, 'sortie', 'Délivrance prescription', NEW.id, NEW.dispensed_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stock_on_prescription_dispense 
AFTER UPDATE ON public.prescriptions 
FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_dispense();

-- Fonction pour générer un numéro de facture
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'FAC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- Fonction pour générer un code patient
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'PAT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('patient_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS patient_code_seq START 1;

CREATE TRIGGER generate_patient_code_trigger
BEFORE INSERT ON public.patients
FOR EACH ROW
WHEN (NEW.code IS NULL OR NEW.code = '')
EXECUTE FUNCTION public.generate_patient_code();