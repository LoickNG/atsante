
-- Allow free-text prescriptions (medication not necessarily in pharmacy)
ALTER TABLE public.prescriptions 
  ALTER COLUMN medication_id DROP NOT NULL;

-- Add medication_name for free-text prescriptions
ALTER TABLE public.prescriptions 
  ADD COLUMN medication_name text;

-- Add follow_up_notes column to consultations for doctor follow-up comments
ALTER TABLE public.consultations 
  ADD COLUMN follow_up_notes jsonb DEFAULT '[]'::jsonb;
