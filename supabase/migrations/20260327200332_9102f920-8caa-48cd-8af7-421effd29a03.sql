
-- Create storage bucket for imaging files
INSERT INTO storage.buckets (id, name, public) VALUES ('imaging-files', 'imaging-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload imaging files
CREATE POLICY "Authenticated users can upload imaging files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'imaging-files');

-- Allow authenticated users to read imaging files
CREATE POLICY "Authenticated users can read imaging files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'imaging-files');

-- Allow authenticated users to delete their imaging files
CREATE POLICY "Authenticated users can delete imaging files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'imaging-files');
