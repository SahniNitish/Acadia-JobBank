-- Seed data for development and testing

-- Insert sample departments
-- This will be used for dropdown options in the frontend

-- Sample admin user (will need to be created through Supabase Auth first)
-- INSERT INTO profiles (id, email, full_name, role, department) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'admin@acadiau.ca', 'System Administrator', 'admin', 'IT');

-- Sample faculty users (will need to be created through Supabase Auth first)
-- INSERT INTO profiles (id, email, full_name, role, department) VALUES
-- ('11111111-1111-1111-1111-111111111111', 'john.doe@acadiau.ca', 'Dr. John Doe', 'faculty', 'Computer Science'),
-- ('22222222-2222-2222-2222-222222222222', 'jane.smith@acadiau.ca', 'Dr. Jane Smith', 'faculty', 'Mathematics');

-- Sample student users (will need to be created through Supabase Auth first)
-- INSERT INTO profiles (id, email, full_name, role, department, year_of_study) VALUES
-- ('33333333-3333-3333-3333-333333333333', 'student1@acadiau.ca', 'Alice Johnson', 'student', 'Computer Science', 3),
-- ('44444444-4444-4444-4444-444444444444', 'student2@acadiau.ca', 'Bob Wilson', 'student', 'Mathematics', 2);

-- Note: Actual user creation must be done through Supabase Auth
-- The above INSERT statements are commented out because they require
-- users to exist in auth.users first (handled by the trigger)

-- Sample job postings (uncomment after creating users)
-- INSERT INTO job_postings (title, description, requirements, compensation, job_type, department, duration, application_deadline, posted_by) VALUES
-- (
--   'Research Assistant - Machine Learning',
--   'Seeking a motivated undergraduate student to assist with machine learning research project focusing on natural language processing.',
--   'Strong programming skills in Python, familiarity with machine learning concepts, GPA 3.0 or higher',
--   '$15/hour, 10-15 hours per week',
--   'research_assistant',
--   'Computer Science',
--   'Fall 2024 semester',
--   '2024-09-15',
--   '11111111-1111-1111-1111-111111111111'
-- ),
-- (
--   'Teaching Assistant - Calculus I',
--   'TA position for Calculus I course. Responsibilities include grading assignments, holding office hours, and assisting with lab sessions.',
--   'Completed Calculus I and II with grade of A- or better, strong communication skills',
--   '$16/hour, 8-10 hours per week',
--   'teaching_assistant',
--   'Mathematics',
--   'Fall 2024 semester',
--   '2024-08-30',
--   '22222222-2222-2222-2222-222222222222'
-- );