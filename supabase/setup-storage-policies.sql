-- Storage policies for resume uploads
-- Run this in Supabase SQL Editor after creating the 'resumes' bucket

-- Allow authenticated users to upload resumes
CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view own resumes and faculty to view applicant resumes
CREATE POLICY "Users can view relevant resumes" ON storage.objects FOR SELECT USING (
    bucket_id = 'resumes' AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (
            SELECT 1 FROM applications a
            JOIN job_postings j ON a.job_id = j.id
            WHERE j.posted_by = auth.uid() AND a.resume_url LIKE '%' || name || '%'
        )
    )
);

-- Allow users to delete own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE USING (
    bucket_id = 'resumes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);