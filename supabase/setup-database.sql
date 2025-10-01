-- University Job Bank Database Schema
-- Run this in your Supabase SQL Editor

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