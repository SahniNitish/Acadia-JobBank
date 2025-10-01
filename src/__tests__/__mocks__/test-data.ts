/**
 * Mock data for testing
 */

import { User } from '@supabase/supabase-js'
import { Profile, JobPosting, Application, Notification } from '@/types/database'

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@acadiau.ca',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: null,
  confirmation_sent_at: null,
  confirmed_at: '2024-01-01T00:00:00Z',
  recovery_sent_at: null,
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  ...overrides,
})

export const createMockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-123',
  email: 'test@acadiau.ca',
  full_name: 'Test User',
  role: 'student',
  department: 'Computer Science',
  year_of_study: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockJobPosting = (overrides: Partial<JobPosting> = {}): JobPosting => ({
  id: 'job-123',
  title: 'Research Assistant Position',
  description: 'Looking for a research assistant to help with data analysis.',
  requirements: 'Strong analytical skills, Python experience preferred',
  compensation: '$15/hour',
  job_type: 'research_assistant',
  department: 'Computer Science',
  duration: '4 months',
  application_deadline: '2024-12-31',
  is_active: true,
  posted_by: 'faculty-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockApplication = (overrides: Partial<Application> = {}): Application => ({
  id: 'app-123',
  job_id: 'job-123',
  applicant_id: 'user-123',
  cover_letter: 'I am very interested in this position and believe I would be a great fit.',
  resume_url: 'https://example.com/resume.pdf',
  status: 'pending',
  applied_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-123',
  user_id: 'user-123',
  title: 'New Job Posted',
  message: 'A new job has been posted in your department.',
  type: 'new_job',
  read: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockJobWithApplications = (applicationCount: number = 3) => {
  const job = createMockJobPosting()
  const applications = Array.from({ length: applicationCount }, (_, i) =>
    createMockApplication({
      id: `app-${i + 1}`,
      applicant_id: `user-${i + 1}`,
    })
  )
  
  return { ...job, applications }
}

export const createMockFacultyProfile = (overrides: Partial<Profile> = {}): Profile =>
  createMockProfile({
    role: 'faculty',
    department: 'Computer Science',
    year_of_study: undefined,
    ...overrides,
  })

export const createMockStudentProfile = (overrides: Partial<Profile> = {}): Profile =>
  createMockProfile({
    role: 'student',
    department: 'Computer Science',
    year_of_study: 2,
    ...overrides,
  })

export const createMockAdminProfile = (overrides: Partial<Profile> = {}): Profile =>
  createMockProfile({
    role: 'admin',
    department: 'Administration',
    year_of_study: undefined,
    ...overrides,
  })

// Mock data sets for testing different scenarios
export const mockJobPostings = [
  createMockJobPosting({
    id: 'job-1',
    title: 'Research Assistant - AI Lab',
    department: 'Computer Science',
    job_type: 'research_assistant',
  }),
  createMockJobPosting({
    id: 'job-2',
    title: 'Teaching Assistant - Calculus',
    department: 'Mathematics',
    job_type: 'teaching_assistant',
  }),
  createMockJobPosting({
    id: 'job-3',
    title: 'Lab Assistant - Chemistry',
    department: 'Chemistry',
    job_type: 'work_study',
  }),
]

export const mockApplications = [
  createMockApplication({
    id: 'app-1',
    job_id: 'job-1',
    status: 'pending',
  }),
  createMockApplication({
    id: 'app-2',
    job_id: 'job-2',
    status: 'reviewed',
  }),
  createMockApplication({
    id: 'app-3',
    job_id: 'job-3',
    status: 'accepted',
  }),
]

export const mockNotifications = [
  createMockNotification({
    id: 'notif-1',
    title: 'Application Received',
    message: 'You have received a new application for Research Assistant position.',
    type: 'application_received',
    read: false,
  }),
  createMockNotification({
    id: 'notif-2',
    title: 'Application Status Updated',
    message: 'Your application status has been updated to "reviewed".',
    type: 'status_update',
    read: true,
  }),
  createMockNotification({
    id: 'notif-3',
    title: 'New Job Posted',
    message: 'A new job has been posted in Computer Science department.',
    type: 'new_job',
    read: false,
  }),
]