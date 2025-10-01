# Supabase Production Environment Setup

## Overview

This guide covers setting up production and staging Supabase environments for the University Job Bank application.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase account with organization access
- Production domain configured (Vercel deployment)

## Environment Setup

### 1. Create Production Supabase Project

```bash
# Login to Supabase
supabase login

# Create new project for production
supabase projects create university-job-bank-prod --org-id YOUR_ORG_ID

# Create staging project
supabase projects create university-job-bank-staging --org-id YOUR_ORG_ID
```

### 2. Link Projects to Local Development

```bash
# Link production project
supabase link --project-ref YOUR_PROD_PROJECT_REF

# For staging, create separate branch
git checkout -b staging
supabase link --project-ref YOUR_STAGING_PROJECT_REF
```

### 3. Deploy Database Schema

```bash
# Deploy to production
supabase db push --linked

# Deploy to staging
git checkout staging
supabase db push --linked
```

### 4. Configure Environment Variables

#### Production Environment Variables

Set these in your Vercel production environment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Email Configuration (if using custom SMTP)
SUPABASE_SMTP_PASSWORD=your_smtp_password
```

#### Staging Environment Variables

Set these in your Vercel preview environment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key

# Test Email Configuration
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASSWORD=your_mailtrap_password
```

## Database Configuration

### 1. Row Level Security (RLS) Policies

Ensure all RLS policies are properly configured for production:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Verify policies are active
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 2. Database Indexes

Ensure performance indexes are created:

```sql
-- Job postings indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_deadline ON job_postings(application_deadline);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
```

### 3. Database Functions and Triggers

Deploy all database functions and triggers:

```bash
# Deploy functions
supabase functions deploy send-email-notification --project-ref YOUR_PROD_PROJECT_REF
supabase functions deploy job-alerts-cron --project-ref YOUR_PROD_PROJECT_REF
supabase functions deploy deadline-reminder-cron --project-ref YOUR_PROD_PROJECT_REF
supabase functions deploy send-batch-notifications --project-ref YOUR_PROD_PROJECT_REF
```

## Storage Configuration

### 1. Create Storage Buckets

```sql
-- Create resume storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create profile pictures bucket (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. Storage Policies

```sql
-- Resume upload policy (students can upload their own resumes)
CREATE POLICY "Students can upload resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Resume access policy (faculty can view resumes for their job applications)
CREATE POLICY "Faculty can view application resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM applications a
    JOIN job_postings jp ON a.job_id = jp.id
    WHERE jp.posted_by = auth.uid()
    AND a.resume_url = storage.objects.name
  )
);
```

## Email Configuration

### 1. Production SMTP Setup

For production, configure a reliable SMTP service:

**Option 1: Resend (Recommended)**
```bash
# Sign up at resend.com
# Add domain verification
# Get API key and configure in Supabase
```

**Option 2: SendGrid**
```bash
# Sign up at sendgrid.com
# Verify sender identity
# Get API key and configure
```

### 2. Email Templates

Update email templates in Supabase dashboard:
- Welcome email template
- Password reset template
- Application notification template
- Job alert template

## Monitoring and Backup

### 1. Database Monitoring

Enable monitoring in Supabase dashboard:
- Query performance monitoring
- Connection pool monitoring
- Storage usage alerts
- API usage tracking

### 2. Backup Configuration

```bash
# Enable automated backups (7-day retention for production)
# Configure via Supabase dashboard under Settings > Database > Backups

# Manual backup
supabase db dump --linked > backup_$(date +%Y%m%d).sql
```

### 3. Logging Configuration

```sql
-- Enable audit logging for sensitive operations
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id, timestamp)
  VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid(), NOW());
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key secured and not exposed
- [ ] HTTPS enforced on all endpoints
- [ ] Email confirmations enabled in production
- [ ] File upload size limits configured
- [ ] CORS properly configured
- [ ] Database connection limits set
- [ ] API rate limiting enabled
- [ ] Audit logging configured
- [ ] Backup strategy implemented

## Performance Optimization

### 1. Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM job_postings WHERE department = 'Computer Science';

-- Update table statistics
ANALYZE profiles;
ANALYZE job_postings;
ANALYZE applications;
```

### 2. Connection Pooling

Configure connection pooling in Supabase dashboard:
- Pool size: 15 (for production)
- Pool mode: Transaction
- Max client connections: 200

### 3. Caching Strategy

Implement caching for frequently accessed data:
- Job listings cache (5 minutes)
- User profile cache (15 minutes)
- Department list cache (1 hour)

## Deployment Commands

```bash
# Deploy schema changes to production
supabase db push --linked --include-seed=false

# Deploy Edge Functions
supabase functions deploy --project-ref YOUR_PROD_PROJECT_REF

# Run migrations
supabase migration up --linked

# Verify deployment
supabase status --linked
```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check environment variables
   - Verify project reference
   - Check network connectivity

2. **RLS Policy Errors**
   - Review policy conditions
   - Check user authentication
   - Verify table permissions

3. **Email Delivery Issues**
   - Check SMTP configuration
   - Verify domain authentication
   - Review email templates

4. **File Upload Errors**
   - Check storage policies
   - Verify file size limits
   - Review MIME type restrictions

### Monitoring Commands

```bash
# Check project status
supabase status --linked

# View logs
supabase functions logs send-email-notification --project-ref YOUR_PROD_PROJECT_REF

# Database health check
supabase db inspect --linked
```