
ALTER TABLE public.hospitalization_care
  ADD COLUMN unit_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN medication_id uuid REFERENCES public.medications(id),
  ADD COLUMN total_price numeric NOT NULL DEFAULT 0;
