-- Add result_files column to lab_requests for attached files
ALTER TABLE public.lab_requests ADD COLUMN IF NOT EXISTS result_files jsonb;

-- Create lab-files storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lab-files', 'lab-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for lab-files bucket
CREATE POLICY "Lab files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-files');

CREATE POLICY "Lab/medical staff can upload lab files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lab-files' AND (
    has_role(auth.uid(), 'laborantin'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Lab/medical staff can update lab files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lab-files' AND (
    has_role(auth.uid(), 'laborantin'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "Lab/medical staff can delete lab files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lab-files' AND (
    has_role(auth.uid(), 'laborantin'::app_role) OR
    has_role(auth.uid(), 'medecin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  )
);