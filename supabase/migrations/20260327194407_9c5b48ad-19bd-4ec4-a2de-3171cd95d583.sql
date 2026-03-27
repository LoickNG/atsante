
-- Add super_admin full access permissive policy to all tables that lack it
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'births', 'consultations', 'conventions',
    'emergency_visits', 'hospitalization_care', 'hospitalizations',
    'imaging_requests', 'insurance_companies', 'invoice_items',
    'invoices', 'lab_requests', 'maternity_admissions', 'medical_acts',
    'medications', 'notifications', 'operating_rooms', 'partner_companies',
    'patients', 'payments', 'prenatal_visits', 'prescriptions',
    'rooms', 'stock_movements', 'surgeries', 'visits',
    'conversations', 'conversation_participants', 'messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Super admin full access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Super admin full access" ON public.%I FOR ALL TO authenticated
       USING (has_role(auth.uid(), ''super_admin''::app_role))
       WITH CHECK (has_role(auth.uid(), ''super_admin''::app_role))',
      tbl
    );
  END LOOP;
END $$;

-- Also add admin full access to key operational tables they should manage
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'patients', 'visits', 'consultations', 'hospitalizations',
    'emergency_visits', 'births', 'maternity_admissions',
    'lab_requests', 'imaging_requests', 'prescriptions',
    'medications', 'invoices', 'invoice_items', 'payments',
    'notifications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admin can view all" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Admin can view all" ON public.%I FOR SELECT TO authenticated
       USING (has_role(auth.uid(), ''admin''::app_role))',
      tbl
    );
  END LOOP;
END $$;
