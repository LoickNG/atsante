
-- 1. Add bed_number to hospitalizations for multi-bed rooms
ALTER TABLE public.hospitalizations ADD COLUMN bed_number integer;

-- 2. Add specialty to profiles for doctor specializations
ALTER TABLE public.profiles ADD COLUMN specialty text;

-- 3. Add specialty to visits so we know which specialty was requested
ALTER TABLE public.visits ADD COLUMN specialty text;

-- 4. Update RLS on medications to allow pharmacien to insert stock_movements
-- (stock_movements RLS already allows pharmacien, but let's also allow infirmier to insert for hospitalization care)
CREATE POLICY "Infirmier can insert stock_movements" ON public.stock_movements
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'infirmier'::app_role));
