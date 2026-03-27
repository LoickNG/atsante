
-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add activated_license_key to clinic_settings
ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS activated_license_key text DEFAULT NULL;
