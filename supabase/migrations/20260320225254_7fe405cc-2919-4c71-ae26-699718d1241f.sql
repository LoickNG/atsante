
-- Add photo_url column to patients
ALTER TABLE public.patients ADD COLUMN photo_url text;

-- Create storage bucket for patient photos
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', true);

-- Allow authenticated users to upload patient photos
CREATE POLICY "Authenticated users can upload patient photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patient-photos');

-- Allow public read access to patient photos
CREATE POLICY "Public can view patient photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'patient-photos');

-- Allow authenticated users to update/delete patient photos
CREATE POLICY "Authenticated users can manage patient photos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'patient-photos');
