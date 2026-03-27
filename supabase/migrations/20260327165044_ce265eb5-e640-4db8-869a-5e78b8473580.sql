
-- 1. Add clinic_id columns FIRST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.lab_requests ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.imaging_requests ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.hospitalizations ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.hospitalization_care ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.emergency_visits ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.operating_rooms ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.surgeries ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.maternity_admissions ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.prenatal_visits ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.births ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.medical_acts ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.conventions ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.partner_companies ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.insurance_companies ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinic_settings(id);

-- 2. NOW create helper function
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 3. Trigger function to auto-set clinic_id on insert
CREATE OR REPLACE FUNCTION public.set_clinic_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    NEW.clinic_id := get_my_clinic_id();
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create triggers for all tables
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.consultations FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.lab_requests FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.imaging_requests FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.medications FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.hospitalizations FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.hospitalization_care FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.emergency_visits FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.operating_rooms FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.surgeries FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.maternity_admissions FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.prenatal_visits FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.births FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.medical_acts FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.conventions FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.partner_companies FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.insurance_companies FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();
CREATE TRIGGER set_clinic_id BEFORE INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION set_clinic_id_on_insert();

-- 5. RESTRICTIVE RLS policies for clinic isolation
CREATE POLICY "Clinic isolation" ON public.patients AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.visits AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.consultations AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.prescriptions AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.lab_requests AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.imaging_requests AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.invoices AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.invoice_items AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.payments AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.medications AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.stock_movements AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.hospitalizations AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.hospitalization_care AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.emergency_visits AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.rooms AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.operating_rooms AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.surgeries AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.maternity_admissions AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.prenatal_visits AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.births AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.medical_acts AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.conventions AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.partner_companies AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.insurance_companies AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Clinic isolation" ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());
CREATE POLICY "Clinic isolation" ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
USING (clinic_id = get_my_clinic_id() OR has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());

-- 6. Auto-link admin to clinic when clinic_settings is created
CREATE OR REPLACE FUNCTION public.link_admin_to_clinic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET clinic_id = NEW.id WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER link_admin_clinic AFTER INSERT ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION link_admin_to_clinic();

-- 7. Backfill existing data
DO $$
DECLARE
  v_clinic_id uuid;
BEGIN
  SELECT id INTO v_clinic_id FROM public.clinic_settings LIMIT 1;
  IF v_clinic_id IS NOT NULL THEN
    UPDATE public.profiles SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.patients SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.visits SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.consultations SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.prescriptions SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.lab_requests SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.imaging_requests SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.invoices SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.invoice_items SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.payments SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.medications SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.stock_movements SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.hospitalizations SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.hospitalization_care SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.emergency_visits SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.rooms SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.operating_rooms SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.surgeries SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.maternity_admissions SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.prenatal_visits SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.births SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.medical_acts SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.notifications SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.conventions SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.partner_companies SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.insurance_companies SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
    UPDATE public.user_roles SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
  END IF;
END;
$$;
