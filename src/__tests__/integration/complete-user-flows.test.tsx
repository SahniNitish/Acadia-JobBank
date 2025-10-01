/**
 * Complete User Flow Integration Tests
 * 
 * These tests verify that all components work together properly
 * and that complete user journeys function as expected.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { createMockUser, createMockProfile, createMockJobPosting } from '../__mocks__/test-data'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
        limit: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Complete User Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
  })

  describe('Authentication Flow Integration', () => {
    it('should handle complete authentication flow', async () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile({ role: 'student' })

      // Mock successful authentication
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } as any },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      } as any)

      // Mock profile fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any)

      const TestComponent = () => {
        const { user, profile, loading } = useAuth()
        
        if (loading) return <div>Loading...</div>
        if (!user) return <div>Not authenticated</div>
        
        return (
          <div>
            <div data-testid="user-email">{user.email}</div>
            <div data-testid="profile-name">{profile?.full_name}</div>
            <div data-testid="profile-role">{profile?.role}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email)
        expect(screen.getByTestId('profile-name')).toHaveTextContent(mockProfile.full_name)
        expect(screen.getByTestId('profile-role')).toHaveTextContent('student')
      })
    })

    it('should handle sign out flow', async () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } as any },
        error: null,
      })

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      } as any)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      } as any)

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const TestComponent = () => {
        const { user, signOut } = useAuth()
        
        return (
          <div>
            {user ? (
              <button onClick={signOut} data-testid="sign-out-btn">
                Sign Out
              </button>
            ) : (
              <div data-testid="signed-out">Signed out</div>
            )}
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('sign-out-btn'))

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Job Management Flow Integration', () => {
    it('should handle complete job posting flow', async () => {
      const mockJob = createMockJobPosting()

      // Mock successful job creation
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockJob,
              error: null,
            }),
          }),
        }),
      } as any)

      const { createJobPosting } = require('@/lib/jobs')
      
      const result = await createJobPosting({
        title: 'Test Job',
        description: 'Test Description',
        job_type: 'research_assistant',
        department: 'Computer Science',
        posted_by: 'user-id',
      })

      expect(result).toEqual(mockJob)
      expect(mockSupabase.from).toHaveBeenCalledWith('job_postings')
    })

    it('should handle job search and filtering', async () => {
      const mockJobs = [
        createMockJobPosting({ title: 'Research Assistant', department: 'Computer Science' }),
        createMockJobPosting({ title: 'Teaching Assistant', department: 'Mathematics' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockJobs,
                error: null,
              }),
            }),
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockJobs,
              error: null,
            }),
          }),
        }),
      } as any)

      const { searchJobs } = require('@/lib/jobs')
      
      const result = await searchJobs({
        query: 'assistant',
        department: 'Computer Science',
      })

      expect(result).toEqual(mockJobs)
    })
  })

  describe('Application Flow Integration', () => {
    it('should handle complete application submission', async () => {
      const mockApplication = {
        id: 'app-1',
        job_id: 'job-1',
        applicant_id: 'user-1',
        cover_letter: 'Test cover letter',
        status: 'pending',
      }

      // Mock file upload
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'resumes/test.pdf' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.pdf' },
        }),
      } as any)

      // Mock application creation
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      } as any)

      const { submitApplication } = require('@/lib/applications')
      
      const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' })
      
      const result = await submitApplication({
        jobId: 'job-1',
        coverLetter: 'Test cover letter',
        resumeFile: file,
      })

      expect(result).toEqual(mockApplication)
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('resumes')
    })

    it('should handle application status updates', async () => {
      const updatedApplication = {
        id: 'app-1',
        status: 'reviewed',
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedApplication,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const { updateApplicationStatus } = require('@/lib/applications')
      
      const result = await updateApplicationStatus('app-1', 'reviewed')

      expect(result).toEqual(updatedApplication)
    })
  })

  describe('Notification System Integration', () => {
    it('should handle notification creation and delivery', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        title: 'New Application',
        message: 'You have a new application',
        type: 'application_received',
        read: false,
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      } as any)

      const { createNotification } = require('@/lib/notifications')
      
      const result = await createNotification({
        userId: 'user-1',
        title: 'New Application',
        message: 'You have a new application',
        type: 'application_received',
      })

      expect(result).toEqual(mockNotification)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      const { getUserProfile } = require('@/lib/auth')
      
      const result = await getUserProfile('user-1')

      expect(result).toBeNull()
    })

    it('should handle network errors in components', async () => {
      const mockUser = createMockUser()
      
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'))

      const TestComponent = () => {
        const { loading, user } = useAuth()
        
        if (loading) return <div>Loading...</div>
        
        return (
          <div data-testid="auth-state">
            {user ? 'Authenticated' : 'Not authenticated'}
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should handle error gracefully and show not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('Not authenticated')
      })
    })
  })

  describe('Role-Based Access Integration', () => {
    it('should enforce role-based permissions', async () => {
      const studentProfile = createMockProfile({ role: 'student' })
      const facultyProfile = createMockProfile({ role: 'faculty' })

      // Test student permissions
      const { canCreateJob, canManageApplications } = require('@/lib/auth')
      
      expect(canCreateJob(studentProfile)).toBe(false)
      expect(canManageApplications(studentProfile, 'job-1')).toBe(false)
      
      expect(canCreateJob(facultyProfile)).toBe(true)
      expect(canManageApplications(facultyProfile, 'job-1')).toBe(true)
    })
  })
})