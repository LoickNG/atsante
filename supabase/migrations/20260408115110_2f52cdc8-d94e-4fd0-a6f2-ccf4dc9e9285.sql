
-- Drop the old unique constraint on value
ALTER TABLE public.specialties DROP CONSTRAINT IF EXISTS specialties_value_key;

-- Add a composite unique constraint (value + clinic_id)
ALTER TABLE public.specialties ADD CONSTRAINT specialties_value_clinic_unique UNIQUE (value, clinic_id);

-- Re-insert default specialties for each clinic
INSERT INTO public.specialties (value, label, is_active, clinic_id)
SELECT s.value, s.label, true, c.id
FROM (VALUES
  ('generaliste', 'Médecine générale'),
  ('dentiste', 'Dentisterie'),
  ('gynecologie', 'Gynécologie'),
  ('pediatrie', 'Pédiatrie'),
  ('cardiologie', 'Cardiologie'),
  ('dermatologie', 'Dermatologie'),
  ('ophtalmologie', 'Ophtalmologie'),
  ('orl', 'ORL'),
  ('chirurgie', 'Chirurgie'),
  ('neurologie', 'Neurologie'),
  ('urologie', 'Urologie'),
  ('radiologie', 'Radiologie'),
  ('pneumologie', 'Pneumologie'),
  ('rhumatologie', 'Rhumatologie')
) AS s(value, label)
CROSS JOIN public.clinic_settings c
ON CONFLICT DO NOTHING;
