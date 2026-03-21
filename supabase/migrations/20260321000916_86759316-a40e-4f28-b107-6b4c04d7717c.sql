
ALTER TABLE public.lab_requests ALTER COLUMN consultation_id DROP NOT NULL;
ALTER TABLE public.imaging_requests ALTER COLUMN consultation_id DROP NOT NULL;
