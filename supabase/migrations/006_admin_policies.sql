-- Admin policies for system management

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile (for moderation)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all job postings
CREATE POLICY "Admins can view all job postings" ON job_postings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any job posting (for moderation)
CREATE POLICY "Admins can update any job posting" ON job_postings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any job posting (for moderation)
CREATE POLICY "Admins can delete any job posting" ON job_postings
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );