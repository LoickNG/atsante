
ALTER TABLE public.visits
  ADD COLUMN temperature numeric,
  ADD COLUMN blood_pressure text,
  ADD COLUMN heart_rate integer,
  ADD COLUMN weight numeric,
  ADD COLUMN height numeric;
