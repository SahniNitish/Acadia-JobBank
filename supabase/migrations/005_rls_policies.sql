-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can read all profiles (for job posting author info, etc.)
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Job postings table policies
-- Anyone authenticated can view active job postings
CREATE POLICY "Anyone can view active job postings" ON job_postings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND is_active = true
  );

-- Faculty can view all their own job postings (active and inactive)
CREATE POLICY "Faculty can view own job postings" ON job_postings
  FOR SELECT USING (
    auth.uid() = posted_by
  );

-- Only faculty can create job postings
CREATE POLICY "Faculty can create job postings" ON job_postings
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'faculty'
    )
  );

-- Faculty can update their own job postings
CREATE POLICY "Faculty can update own job postings" ON job_postings
  FOR UPDATE USING (
    auth.uid() = posted_by AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'faculty'
    )
  );

-- Faculty can delete their own job postings
CREATE POLICY "Faculty can delete own job postings" ON job_postings
  FOR DELETE USING (
    auth.uid() = posted_by AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'faculty'
    )
  );
--
 Applications table policies
-- Students can view their own applications
CREATE POLICY "Students can view own applications" ON applications
  FOR SELECT USING (
    auth.uid() = applicant_id
  );

-- Faculty can view applications for their job postings
CREATE POLICY "Faculty can view applications for own jobs" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT posted_by FROM job_postings WHERE id = job_id
    )
  );

-- Students can create applications (only for active jobs and no duplicates)
CREATE POLICY "Students can create applications" ON applications
  FOR INSERT WITH CHECK (
    auth.uid() = applicant_id AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'student'
    ) AND
    job_id IN (
      SELECT id FROM job_postings 
      WHERE is_active = true 
      AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
    )
  );

-- Faculty can update application status for their job postings
CREATE POLICY "Faculty can update application status" ON applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT posted_by FROM job_postings WHERE id = job_id
    ) AND
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'faculty'
    )
  );

-- Notifications table policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);