DROP POLICY "Admin can view own license" ON public.licenses;

CREATE POLICY "Admin can view own license" ON public.licenses
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND license_key = (
    SELECT cs.activated_license_key
    FROM clinic_settings cs
    WHERE cs.id = get_my_clinic_id()
    LIMIT 1
  )
);