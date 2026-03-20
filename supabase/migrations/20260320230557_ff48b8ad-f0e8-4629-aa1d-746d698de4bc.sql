
-- Add deceased-related columns to patients
ALTER TABLE public.patients 
  ADD COLUMN is_deceased boolean NOT NULL DEFAULT false,
  ADD COLUMN deceased_at timestamp with time zone,
  ADD COLUMN cause_of_death text,
  ADD COLUMN place_of_death text,
  ADD COLUMN death_declared_by uuid,
  ADD COLUMN death_notes text;
