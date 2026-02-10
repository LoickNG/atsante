
-- 1. Fix patients table: restrict SELECT to relevant roles only
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

CREATE POLICY "Staff can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accueil'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'infirmier'::app_role) OR
    has_role(auth.uid(), 'caissier'::app_role) OR
    has_role(auth.uid(), 'pharmacien'::app_role) OR
    has_role(auth.uid(), 'laborantin'::app_role) OR
    has_role(auth.uid(), 'imagerie'::app_role)
  );

-- 2. Fix lab_requests: restrict SELECT to medical/lab staff
DROP POLICY IF EXISTS "Authenticated users can view lab_requests" ON public.lab_requests;

CREATE POLICY "Medical and lab staff can view lab_requests"
  ON public.lab_requests FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'laborantin'::app_role) OR
    has_role(auth.uid(), 'infirmier'::app_role)
  );

-- 3. Fix imaging_requests: restrict SELECT to medical/imaging staff
DROP POLICY IF EXISTS "Authenticated users can view imaging_requests" ON public.imaging_requests;

CREATE POLICY "Medical and imaging staff can view imaging_requests"
  ON public.imaging_requests FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'imagerie'::app_role) OR
    has_role(auth.uid(), 'infirmier'::app_role)
  );
