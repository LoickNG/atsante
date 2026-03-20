
-- 1. Ensure RLS is enabled on ALL tables (idempotent)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaging_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 2. Fix consultations SELECT policy: restrict to medical staff only
DROP POLICY IF EXISTS "Authenticated users can view consultations" ON public.consultations;
CREATE POLICY "Medical staff can view consultations" ON public.consultations
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'infirmier') OR
    public.has_role(auth.uid(), 'caissier')
  );

-- 3. Fix invoices SELECT policy: restrict to relevant roles
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
CREATE POLICY "Staff can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'caissier') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'accueil')
  );

-- 4. Fix invoice_items SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view invoice_items" ON public.invoice_items;
CREATE POLICY "Staff can view invoice_items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'caissier') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'accueil')
  );

-- 5. Fix payments SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
CREATE POLICY "Staff can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'caissier')
  );

-- 6. Fix prescriptions SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON public.prescriptions;
CREATE POLICY "Medical staff can view prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'pharmacien') OR
    public.has_role(auth.uid(), 'infirmier')
  );

-- 7. Fix medications SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view medications" ON public.medications;
CREATE POLICY "Staff can view medications" ON public.medications
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'pharmacien') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'infirmier')
  );

-- 8. Fix stock_movements SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view stock_movements" ON public.stock_movements;
CREATE POLICY "Pharmacy staff can view stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'pharmacien')
  );

-- 9. Fix medical_acts SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view medical_acts" ON public.medical_acts;
CREATE POLICY "Staff can view medical_acts" ON public.medical_acts
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'caissier') OR
    public.has_role(auth.uid(), 'accueil')
  );

-- 10. Fix visits SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view visits" ON public.visits;
CREATE POLICY "Staff can view visits" ON public.visits
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accueil') OR
    public.has_role(auth.uid(), 'medecin') OR
    public.has_role(auth.uid(), 'infirmier') OR
    public.has_role(auth.uid(), 'caissier')
  );

-- 11. Fix insurance/partner companies SELECT: accessible to admin, accueil, caissier
DROP POLICY IF EXISTS "Authenticated users can view insurance_companies" ON public.insurance_companies;
CREATE POLICY "Staff can view insurance_companies" ON public.insurance_companies
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accueil') OR
    public.has_role(auth.uid(), 'caissier')
  );

DROP POLICY IF EXISTS "Authenticated users can view partner_companies" ON public.partner_companies;
CREATE POLICY "Staff can view partner_companies" ON public.partner_companies
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accueil') OR
    public.has_role(auth.uid(), 'caissier')
  );

-- 12. Fix conventions SELECT
DROP POLICY IF EXISTS "Authenticated users can view conventions" ON public.conventions;
CREATE POLICY "Staff can view conventions" ON public.conventions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accueil') OR
    public.has_role(auth.uid(), 'caissier')
  );
