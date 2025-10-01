-- Production Optimizations and Security Enhancements
-- This migration includes production-specific database optimizations

-- Create audit log table for production monitoring
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log in production environment
  IF current_setting('app.environment', true) = 'production' THEN
    INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid(), NOW());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles 
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_job_postings ON job_postings;
CREATE TRIGGER audit_job_postings 
  AFTER INSERT OR UPDATE OR DELETE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_applications ON applications;
CREATE TRIGGER audit_applications 
  AFTER INSERT OR UPDATE OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Performance indexes for production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_search 
  ON job_postings USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_department_active 
  ON job_postings(department, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status_created 
  ON applications(status, applied_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read) WHERE read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_department 
  ON profiles(role, department);

-- Create materialized view for dashboard statistics (production optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE role = 'student') as total_students,
  COUNT(*) FILTER (WHERE role = 'faculty') as total_faculty,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d
FROM profiles
UNION ALL
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_jobs_7d,
  COUNT(*) FILTER (WHERE application_deadline >= CURRENT_DATE) as jobs_with_upcoming_deadlines
FROM job_postings
UNION ALL
SELECT 
  COUNT(*) as total_applications,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
  COUNT(*) FILTER (WHERE applied_at >= CURRENT_DATE - INTERVAL '7 days') as new_applications_7d
FROM applications;

-- Create function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to refresh stats (requires pg_cron extension in production)
-- This will be configured in production Supabase dashboard
-- SELECT cron.schedule('refresh-dashboard-stats', '0 */6 * * *', 'SELECT refresh_dashboard_stats();');

-- Enhanced RLS policies for production security
-- Ensure admin users can access audit logs
CREATE POLICY "Admins can view audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Production-specific constraints
-- Ensure email domains are validated
ALTER TABLE profiles 
ADD CONSTRAINT check_email_domain 
CHECK (email LIKE '%@acadiau.ca' OR email LIKE '%@admin.acadiau.ca');

-- Ensure job posting deadlines are in the future
ALTER TABLE job_postings 
ADD CONSTRAINT check_future_deadline 
CHECK (application_deadline IS NULL OR application_deadline >= CURRENT_DATE);

-- Ensure reasonable compensation values
ALTER TABLE job_postings 
ADD CONSTRAINT check_reasonable_compensation 
CHECK (compensation IS NULL OR length(compensation) <= 200);

-- Create function for safe user deletion (anonymization instead of deletion)
CREATE OR REPLACE FUNCTION anonymize_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only admins can anonymize users
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can anonymize users';
  END IF;
  
  -- Anonymize profile data
  UPDATE profiles 
  SET 
    email = 'anonymized_' || user_id || '@deleted.acadiau.ca',
    full_name = 'Deleted User',
    department = NULL
  WHERE id = user_id;
  
  -- Anonymize applications
  UPDATE applications 
  SET cover_letter = 'This application has been anonymized.'
  WHERE applicant_id = user_id;
  
  -- Log the anonymization
  INSERT INTO audit_log (table_name, operation, new_data, user_id, timestamp)
  VALUES ('profiles', 'ANONYMIZE', jsonb_build_object('anonymized_user', user_id), auth.uid(), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(table_name text, row_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 'profiles'::text, COUNT(*) FROM profiles
  UNION ALL
  SELECT 'job_postings'::text, COUNT(*) FROM job_postings
  UNION ALL
  SELECT 'applications'::text, COUNT(*) FROM applications
  UNION ALL
  SELECT 'notifications'::text, COUNT(*) FROM notifications
  UNION ALL
  SELECT 'saved_searches'::text, COUNT(*) FROM saved_searches;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO service_role;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_backup_integrity() TO service_role;

-- Create indexes on audit log for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Comment on important production objects
COMMENT ON TABLE audit_log IS 'Audit trail for all database changes in production';
COMMENT ON FUNCTION audit_trigger_function() IS 'Trigger function to log all changes to sensitive tables';
COMMENT ON MATERIALIZED VIEW dashboard_stats IS 'Cached statistics for admin dashboard performance';
COMMENT ON FUNCTION anonymize_user(UUID) IS 'Safely anonymize user data instead of deletion for GDPR compliance';