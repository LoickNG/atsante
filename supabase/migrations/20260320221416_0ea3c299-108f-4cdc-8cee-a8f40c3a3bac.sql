
-- Update medical_acts category check to include hospitalisation
ALTER TABLE public.medical_acts DROP CONSTRAINT IF EXISTS medical_acts_category_check;
ALTER TABLE public.medical_acts ADD CONSTRAINT medical_acts_category_check 
  CHECK (category IN ('consultation', 'analyse', 'imagerie', 'hospitalisation', 'soins', 'autre'));
