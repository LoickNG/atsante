
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_proforma boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;
