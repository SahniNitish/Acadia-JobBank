-- Create storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for resume uploads

-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload own resumes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own resumes
CREATE POLICY "Users can view own resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow faculty to view resumes for applications to their jobs
CREATE POLICY "Faculty can view applicant resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON a.job_id = jp.id
      WHERE jp.posted_by = auth.uid()
      AND a.resume_url LIKE '%' || name || '%'
    )
  );

-- Allow users to update their own resumes
CREATE POLICY "Users can update own resumes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin policies for storage
CREATE POLICY "Admins can view all resumes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes' AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any resume" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resumes' AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );