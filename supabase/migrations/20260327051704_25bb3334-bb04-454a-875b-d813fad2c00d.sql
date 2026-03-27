-- ============================================================
-- ROLE-BASED ACCESS CONTROL OVERHAUL
-- Remove admin from medical data, add DAF to financial data
-- ============================================================

-- 1. CONSULTATIONS: Remove admin access (medical staff only)
DROP POLICY IF EXISTS "Doctors can manage consultations" ON public.consultations;
CREATE POLICY "Doctors can manage consultations" ON public.consultations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role));

DROP POLICY IF EXISTS "Medical staff can view consultations" ON public.consultations;
CREATE POLICY "Medical staff can view consultations" ON public.consultations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- 2. PRESCRIPTIONS: Remove admin access
DROP POLICY IF EXISTS "Medical staff can manage prescriptions" ON public.prescriptions;
CREATE POLICY "Medical staff can manage prescriptions" ON public.prescriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'pharmacien'::app_role));

DROP POLICY IF EXISTS "Medical staff can view prescriptions" ON public.prescriptions;
CREATE POLICY "Medical staff can view prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'pharmacien'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- 3. LAB_REQUESTS: Remove admin access
DROP POLICY IF EXISTS "Lab staff can manage lab_requests" ON public.lab_requests;
CREATE POLICY "Lab staff can manage lab_requests" ON public.lab_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'laborantin'::app_role));

DROP POLICY IF EXISTS "Medical and lab staff can view lab_requests" ON public.lab_requests;
CREATE POLICY "Medical and lab staff can view lab_requests" ON public.lab_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'laborantin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- 4. IMAGING_REQUESTS: Remove admin access
DROP POLICY IF EXISTS "Imaging staff can manage imaging_requests" ON public.imaging_requests;
CREATE POLICY "Imaging staff can manage imaging_requests" ON public.imaging_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'imagerie'::app_role));

DROP POLICY IF EXISTS "Medical and imaging staff can view imaging_requests" ON public.imaging_requests;
CREATE POLICY "Medical and imaging staff can view imaging_requests" ON public.imaging_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'imagerie'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- 5. HOSPITALIZATIONS: Remove admin from manage, keep view for billing
DROP POLICY IF EXISTS "Medical staff can manage hospitalizations" ON public.hospitalizations;
CREATE POLICY "Medical staff can manage hospitalizations" ON public.hospitalizations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view hospitalizations" ON public.hospitalizations;
CREATE POLICY "Staff can view hospitalizations" ON public.hospitalizations
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 6. HOSPITALIZATION_CARE: Remove admin
DROP POLICY IF EXISTS "Medical staff can manage hospitalization_care" ON public.hospitalization_care;
CREATE POLICY "Medical staff can manage hospitalization_care" ON public.hospitalization_care
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view hospitalization_care" ON public.hospitalization_care;
CREATE POLICY "Staff can view hospitalization_care" ON public.hospitalization_care
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 7. INVOICES: Add DAF, keep admin for system management
DROP POLICY IF EXISTS "Cashier can manage invoices" ON public.invoices;
CREATE POLICY "Cashier can manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

DROP POLICY IF EXISTS "Staff can view invoices" ON public.invoices;
CREATE POLICY "Staff can view invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- 8. INVOICE_ITEMS: Add DAF
DROP POLICY IF EXISTS "Cashier can manage invoice_items" ON public.invoice_items;
CREATE POLICY "Cashier can manage invoice_items" ON public.invoice_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

DROP POLICY IF EXISTS "Staff can view invoice_items" ON public.invoice_items;
CREATE POLICY "Staff can view invoice_items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- 9. PAYMENTS: Add DAF
DROP POLICY IF EXISTS "Cashier can manage payments" ON public.payments;
CREATE POLICY "Cashier can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

DROP POLICY IF EXISTS "Staff can view payments" ON public.payments;
CREATE POLICY "Staff can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 10. PATIENTS: Add DAF for view (billing context), remove admin from manage
DROP POLICY IF EXISTS "Accueil and admin can manage patients" ON public.patients;
CREATE POLICY "Accueil can manage patients" ON public.patients
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'accueil'::app_role));

DROP POLICY IF EXISTS "Staff can view patients" ON public.patients;
CREATE POLICY "Staff can view patients" ON public.patients
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'pharmacien'::app_role) OR has_role(auth.uid(), 'laborantin'::app_role) OR has_role(auth.uid(), 'imagerie'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 11. EMERGENCY_VISITS: Remove admin from manage
DROP POLICY IF EXISTS "Medical staff can manage emergency_visits" ON public.emergency_visits;
CREATE POLICY "Medical staff can manage emergency_visits" ON public.emergency_visits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

DROP POLICY IF EXISTS "Cashier can view emergency_visits" ON public.emergency_visits;
CREATE POLICY "Cashier can view emergency_visits" ON public.emergency_visits
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 12. VISITS: Remove admin from manage
DROP POLICY IF EXISTS "Staff can manage visits" ON public.visits;
CREATE POLICY "Staff can manage visits" ON public.visits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view visits" ON public.visits;
CREATE POLICY "Staff can view visits" ON public.visits
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 13. MEDICATIONS: Remove admin from manage
DROP POLICY IF EXISTS "Pharmacien and admin can manage medications" ON public.medications;
CREATE POLICY "Pharmacien can manage medications" ON public.medications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'pharmacien'::app_role));

DROP POLICY IF EXISTS "Staff can view medications" ON public.medications;
CREATE POLICY "Staff can view medications" ON public.medications
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'pharmacien'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

-- 14. STOCK_MOVEMENTS: Remove admin
DROP POLICY IF EXISTS "Pharmacien can manage stock_movements" ON public.stock_movements;
CREATE POLICY "Pharmacien can manage stock_movements" ON public.stock_movements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'pharmacien'::app_role));

DROP POLICY IF EXISTS "Pharmacy staff can view stock_movements" ON public.stock_movements;
CREATE POLICY "Pharmacy staff can view stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'pharmacien'::app_role));

-- 15. MATERNITY: Remove admin
DROP POLICY IF EXISTS "Medical staff can manage maternity_admissions" ON public.maternity_admissions;
CREATE POLICY "Medical staff can manage maternity_admissions" ON public.maternity_admissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view maternity_admissions" ON public.maternity_admissions;
CREATE POLICY "Staff can view maternity_admissions" ON public.maternity_admissions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

-- 16. BIRTHS: Remove admin
DROP POLICY IF EXISTS "Medical staff can manage births" ON public.births;
CREATE POLICY "Medical staff can manage births" ON public.births
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view births" ON public.births;
CREATE POLICY "Staff can view births" ON public.births
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role));

-- 17. PRENATAL_VISITS: Remove admin
DROP POLICY IF EXISTS "Medical staff can manage prenatal_visits" ON public.prenatal_visits;
CREATE POLICY "Medical staff can manage prenatal_visits" ON public.prenatal_visits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view prenatal_visits" ON public.prenatal_visits;
CREATE POLICY "Staff can view prenatal_visits" ON public.prenatal_visits
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- 18. SURGERIES: Remove admin
DROP POLICY IF EXISTS "Medical staff can manage surgeries" ON public.surgeries;
CREATE POLICY "Medical staff can manage surgeries" ON public.surgeries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role))
  WITH CHECK (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));

DROP POLICY IF EXISTS "Staff can view surgeries" ON public.surgeries;
CREATE POLICY "Staff can view surgeries" ON public.surgeries
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- 19. MEDICAL_ACTS: Add DAF for viewing (pricing), remove admin from manage
DROP POLICY IF EXISTS "Admin can manage medical_acts" ON public.medical_acts;
CREATE POLICY "Admin can manage medical_acts" ON public.medical_acts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff can view medical_acts" ON public.medical_acts;
CREATE POLICY "Staff can view medical_acts" ON public.medical_acts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 20. CONVENTIONS: Add DAF
DROP POLICY IF EXISTS "Staff can view conventions" ON public.conventions;
CREATE POLICY "Staff can view conventions" ON public.conventions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 21. PARTNER_COMPANIES: Add DAF
DROP POLICY IF EXISTS "Staff can view partner_companies" ON public.partner_companies;
CREATE POLICY "Staff can view partner_companies" ON public.partner_companies
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 22. INSURANCE_COMPANIES: Add DAF
DROP POLICY IF EXISTS "Staff can view insurance_companies" ON public.insurance_companies;
CREATE POLICY "Staff can view insurance_companies" ON public.insurance_companies
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accueil'::app_role) OR has_role(auth.uid(), 'caissier'::app_role) OR has_role(auth.uid(), 'daf'::app_role));

-- 23. ROOMS: Keep admin manage for config
-- No changes needed, admin still manages rooms

-- 24. OPERATING_ROOMS: Remove admin from view (not needed)
DROP POLICY IF EXISTS "Staff can view operating_rooms" ON public.operating_rooms;
CREATE POLICY "Staff can view operating_rooms" ON public.operating_rooms
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'medecin'::app_role) OR has_role(auth.uid(), 'infirmier'::app_role));