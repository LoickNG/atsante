-- Create clinic_settings for the Clinique LoYa with the license key
INSERT INTO public.clinic_settings (name, activated_license_key)
VALUES ('Clinique LoYa', 'LIC-20260327-7964');

-- Get the new clinic_id and link the admin user
DO $$
DECLARE
  v_clinic_id uuid;
  v_user_id uuid := '01e81a15-5d27-4578-8a97-fbbbecb58e47';
BEGIN
  SELECT id INTO v_clinic_id FROM public.clinic_settings WHERE activated_license_key = 'LIC-20260327-7964';
  
  -- Create profile if not exists
  INSERT INTO public.profiles (user_id, email, full_name, clinic_id)
  VALUES (v_user_id, 'lngarndom@gmail.com', 'Administrateur Clinique LoYa', v_clinic_id)
  ON CONFLICT DO NOTHING;
  
  -- Create admin role if not exists
  INSERT INTO public.user_roles (user_id, role, clinic_id)
  VALUES (v_user_id, 'admin', v_clinic_id)
  ON CONFLICT DO NOTHING;
  
  -- Update license current_users
  UPDATE public.licenses SET current_users = 1 WHERE license_key = 'LIC-20260327-7964';
END $$;