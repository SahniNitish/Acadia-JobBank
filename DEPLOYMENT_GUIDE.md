# University Job Bank - Deployment Guide

This guide will walk you through setting up the University Job Bank application with Vercel and Supabase from scratch.

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (free tier is fine)
- Supabase account (free tier is fine)

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `university-job-bank`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

### 1.2 Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (starts with `https://`)
   - **anon public key** (starts with `eyJ`)
   - **service_role key** (starts with `eyJ`) - keep this secret!

### 1.3 Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
CREATE TYPE job_type AS ENUM ('research_assistant', 'teaching_assistant', 'work_study', 'internship', 'other');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM ('new_job', 'application_received', 'status_update', 'deadline_reminder', 'system');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    department TEXT NOT NULL,
    year_of_study INTEGER CHECK (year_of_study >= 1 AND year_of_study <= 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_postings table
CREATE TABLE job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    compensation TEXT,
    job_type job_type NOT NULL,
    department TEXT NOT NULL,
    duration TEXT,
    application_deadline DATE,
    is_active BOOLEAN DEFAULT true,
    posted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT NOT NULL,
    resume_url TEXT,
    status application_status DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, applicant_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_searches table
CREATE TABLE saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    search_criteria JSONB NOT NULL,
    email_alerts BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_job_postings_department ON job_postings(department);
CREATE INDEX idx_job_postings_job_type ON job_postings(job_type);
CREATE INDEX idx_job_postings_is_active ON job_postings(is_active);
CREATE INDEX idx_job_postings_deadline ON job_postings(application_deadline);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 Set Up Row Level Security (RLS)

Run this SQL to set up security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Job postings policies
CREATE POLICY "Anyone can view active job postings" ON job_postings FOR SELECT USING (is_active = true);
CREATE POLICY "Faculty can view all their job postings" ON job_postings FOR SELECT USING (posted_by = auth.uid());
CREATE POLICY "Faculty can create job postings" ON job_postings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);
CREATE POLICY "Faculty can update own job postings" ON job_postings FOR UPDATE USING (posted_by = auth.uid());
CREATE POLICY "Faculty can delete own job postings" ON job_postings FOR DELETE USING (posted_by = auth.uid());

-- Applications policies
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Faculty can view applications for their jobs" ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_postings WHERE id = job_id AND posted_by = auth.uid())
);
CREATE POLICY "Students can create applications" ON applications FOR INSERT WITH CHECK (
    applicant_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);
CREATE POLICY "Faculty can update application status" ON applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM job_postings WHERE id = job_id AND posted_by = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Saved searches policies
CREATE POLICY "Users can manage own saved searches" ON saved_searches FOR ALL USING (user_id = auth.uid());
```

### 1.5 Set Up Storage

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it `resumes`
4. Make it **Private** (not public)
5. Click "Create bucket"

Set up storage policies by going to **Storage** → **Policies** and adding:

```sql
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
```

### 1.6 Set Up Edge Functions (Optional but Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Deploy the edge functions:
```bash
supabase functions deploy send-email-notification
supabase functions deploy deadline-reminder-cron
supabase functions deploy job-alerts-cron
```

## Part 2: Vercel Setup

### 2.1 Prepare Your Repository

1. Make sure your code is in a GitHub repository
2. Ensure you have these files in your project root:
   - `package.json`
   - `next.config.js`
   - `.env.example`

### 2.2 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (if your Next.js app is in the root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.3 Set Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: Replace the values with your actual Supabase credentials from step 1.2.

### 2.4 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Part 3: Local Development Setup

### 3.1 Clone and Install

```bash
git clone your-repository-url
cd university-job-bank
npm install
```

### 3.2 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3.3 Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app.

## Part 4: Testing the Setup

### 4.1 Create Test Users

1. Go to your deployed app
2. Register with an `@acadiau.ca` email address
3. Check your email for confirmation
4. Complete your profile setup

### 4.2 Test Core Features

1. **Faculty User**: Create a job posting
2. **Student User**: Search and apply for jobs
3. **Check Notifications**: Verify email notifications work
4. **Test File Upload**: Upload a resume during application

### 4.3 Run Automated Tests

```bash
# Run unit tests
npm test

# Run E2E tests (requires app to be running)
npm run test:e2e
```

## Part 5: Production Optimizations

### 5.1 Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### 5.2 Performance Monitoring

1. Enable Vercel Analytics in your project settings
2. Set up Supabase monitoring alerts
3. Configure error tracking (optional: Sentry)

### 5.3 Backup Strategy

1. Enable Supabase automatic backups
2. Set up database backup schedules
3. Export important data regularly

## Troubleshooting

### Common Issues

1. **Build Fails**: Check environment variables are set correctly
2. **Database Connection**: Verify Supabase URL and keys
3. **Authentication Issues**: Check RLS policies are applied
4. **File Upload Fails**: Verify storage bucket and policies

### Getting Help

- Check Vercel deployment logs
- Review Supabase logs in dashboard
- Use browser developer tools for client-side issues

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] RLS policies are enabled and tested
- [ ] Storage policies restrict access appropriately
- [ ] Email domain validation is working
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] No sensitive data in client-side code

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Create user documentation
3. Plan user onboarding
4. Set up regular backups
5. Monitor performance and usage

Your University Job Bank is now live and ready for users! 🎉