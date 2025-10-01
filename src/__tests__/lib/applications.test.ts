import {
  createApplication,
  uploadResume,
  getJobApplications,
  getUserApplications,
  updateApplicationStatus,
  hasUserApplied,
  getApplicationById,
  deleteApplication,
  enforceApplicationDeadlines,
  getJobApplicationStats,
  bulkUpdateApplicationStatus,
  CreateApplicationData
} from '@/lib/applications'
import { supabase } from '@/lib/supabase'
import { notifyApplicationReceived, notifyApplicationStatusUpdate } from '@/lib/notifications'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          })),
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn()
          })),
          not: jest.fn(() => ({
            lt: jest.fn()
          })),
          lt: jest.fn()
        })),
        in: jest.fn(),
        not: jest.fn(() => ({
          lt: jest.fn()
        })),
        lt: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        in: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn()
      }))
    }
  }
}))

// Mock notifications
jest.mock('@/lib/notifications', () => ({
  notifyApplicationReceived: jest.fn(),
  notifyApplicationStatusUpdate: jest.fn()
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockNotifyApplicationReceived = notifyApplicationReceived as jest.MockedFunction<typeof notifyApplicationReceived>
const mockNotifyApplicationStatusUpdate = notifyApplicationStatusUpdate as jest.MockedFunction<typeof notifyApplicationStatusUpdate>

describe('Application System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default auth mock - logged in user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'student@acadiau.ca' } },
      error: null
    } as any)
  })

  describe('createApplication - Application Submission Logic', () => {
    const validApplicationData: CreateApplicationData = {
      jobId: 'job-123',
      coverLetter: 'I am very interested in this position and believe my skills make me a great fit.',
      resumeFile: new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    }

    const mockJob = {
      id: 'job-123',
      is_active: true,
      application_deadline: null, // No deadline for successful tests
      title: 'Research Assistant',
      posted_by: 'faculty-123'
    }

    const mockJobDetails = {
      title: 'Research Assistant',
      posted_by: 'faculty-123',
      profiles: { full_name: 'Dr. Smith' }
    }

    const mockApplicantProfile = {
      full_name: 'John Student'
    }

    const mockApplication = {
      id: 'app-123',
      job_id: 'job-123',
      applicant_id: 'user-123',
      cover_letter: validApplicationData.coverLetter,
      status: 'pending',
      applied_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    beforeEach(() => {
      // Mock successful application creation flow
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' } // No existing application
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: mockApplication, 
                  error: null 
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockImplementation(() => {
                  // First call for job validation, second for job details
                  const callCount = (mockSupabase.from as jest.Mock).mock.calls.filter(call => call[0] === 'job_postings').length
                  if (callCount <= 2) {
                    return Promise.resolve({ data: mockJob, error: null })
                  } else {
                    return Promise.resolve({ data: mockJobDetails, error: null })
                  }
                })
              })
            })
          } as any
        }
        
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: mockApplicantProfile, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      // Mock storage upload
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ 
          data: { path: 'user-123/app-123.pdf' }, 
          error: null 
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.url/resume.pdf' }
        })
      } as any)
    })

    it('should create application successfully with all required data', async () => {
      const result = await createApplication(validApplicationData)

      expect(result).toEqual({
        ...mockApplication,
        resume_url: 'https://storage.url/resume.pdf'
      })
      
      // Verify application was inserted with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith('applications')
      expect(result.id).toBe('app-123')
      expect(result.job_id).toBe('job-123')
      expect(result.applicant_id).toBe('user-123')
      expect(result.cover_letter).toBe(validApplicationData.coverLetter)
      expect(result.status).toBe('pending')
    })

    it('should create application without resume file', async () => {
      const dataWithoutResume = {
        jobId: 'job-123',
        coverLetter: 'I am interested in this position.'
      }

      const result = await createApplication(dataWithoutResume)

      expect(result).toEqual(mockApplication)
      expect(mockSupabase.storage.from).not.toHaveBeenCalled()
    })

    it('should send notification to faculty member after successful application', async () => {
      await createApplication(validApplicationData)

      expect(mockNotifyApplicationReceived).toHaveBeenCalledWith(
        'faculty-123',
        'John Student',
        'Research Assistant'
      )
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      } as any)

      await expect(createApplication(validApplicationData)).rejects.toThrow(
        'You must be logged in to apply for jobs'
      )
    })

    it('should throw error when job posting fetch fails', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { message: 'Job not found' }
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      await expect(createApplication(validApplicationData)).rejects.toThrow('Job not found')
    })

    it('should throw error when job is inactive', async () => {
      const inactiveJob = { ...mockJob, is_active: false }
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: inactiveJob, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      await expect(createApplication(validApplicationData)).rejects.toThrow(
        'This job posting is no longer active'
      )
    })

    it('should continue with application creation even if resume upload fails', async () => {
      // Mock resume upload failure
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockRejectedValue(new Error('Upload failed')),
        getPublicUrl: jest.fn()
      } as any)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await createApplication(validApplicationData)

      expect(result).toEqual(mockApplication) // Should not include resume_url
      expect(consoleSpy).toHaveBeenCalledWith('Failed to upload resume:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should continue with application creation even if notification fails', async () => {
      mockNotifyApplicationReceived.mockRejectedValue(new Error('Notification failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await createApplication(validApplicationData)

      expect(result).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send application notification:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('createApplication - Duplicate Application Prevention', () => {
    const applicationData: CreateApplicationData = {
      jobId: 'job-123',
      coverLetter: 'I am interested in this position.'
    }

    it('should prevent duplicate applications for the same job', async () => {
      // Mock existing application found
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: { id: 'existing-app-123' }, 
                    error: null 
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      await expect(createApplication(applicationData)).rejects.toThrow(
        'You have already applied for this position'
      )
    })

    it('should allow application when no existing application found', async () => {
      // Mock no existing application (PGRST116 = no rows returned)
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'new-app-123' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { is_active: true, application_deadline: null }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { full_name: 'John Student' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      const result = await createApplication(applicationData)
      expect(result).toBeDefined()
    })

    it('should throw error when duplicate check fails with unexpected error', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'UNEXPECTED_ERROR', message: 'Database error' }
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      await expect(createApplication(applicationData)).rejects.toThrow(
        'Failed to check existing application'
      )
    })
  })

  describe('createApplication - Deadline Enforcement', () => {
    const applicationData: CreateApplicationData = {
      jobId: 'job-123',
      coverLetter: 'I am interested in this position.'
    }

    beforeEach(() => {
      // Mock no existing application
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })
    })

    it('should prevent applications after deadline has passed', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday
      
      const expiredJob = {
        is_active: true,
        application_deadline: pastDate.toISOString()
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: expiredJob, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      await expect(createApplication(applicationData)).rejects.toThrow(
        'The application deadline for this job has passed'
      )
    })

    it('should allow applications before deadline', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7) // Next week
      
      const activeJob = {
        is_active: true,
        application_deadline: futureDate.toISOString()
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'new-app-123' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockImplementation(() => {
                  // Return different data for different calls
                  const callCount = (mockSupabase.from as jest.Mock).mock.calls.filter(call => call[0] === 'job_postings').length
                  if (callCount <= 2) {
                    return Promise.resolve({ data: activeJob, error: null })
                  } else {
                    return Promise.resolve({ 
                      data: { 
                        title: 'Test Job', 
                        posted_by: 'faculty-123',
                        profiles: { full_name: 'Dr. Smith' }
                      }, 
                      error: null 
                    })
                  }
                })
              })
            })
          } as any
        }
        
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { full_name: 'John Student' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      const result = await createApplication(applicationData)
      expect(result).toBeDefined()
    })

    it('should allow applications when no deadline is set', async () => {
      const jobWithoutDeadline = {
        is_active: true,
        application_deadline: null
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { code: 'PGRST116' }
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'new-app-123' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockImplementation(() => {
                  const callCount = (mockSupabase.from as jest.Mock).mock.calls.filter(call => call[0] === 'job_postings').length
                  if (callCount <= 2) {
                    return Promise.resolve({ data: jobWithoutDeadline, error: null })
                  } else {
                    return Promise.resolve({ 
                      data: { 
                        title: 'Test Job', 
                        posted_by: 'faculty-123',
                        profiles: { full_name: 'Dr. Smith' }
                      }, 
                      error: null 
                    })
                  }
                })
              })
            })
          } as any
        }
        
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { full_name: 'John Student' }, 
                  error: null 
                })
              })
            })
          } as any
        }
        
        return {} as any
      })

      const result = await createApplication(applicationData)
      expect(result).toBeDefined()
    })
  })

  describe('enforceApplicationDeadlines', () => {
    it('should close jobs past their deadline', async () => {
      const expiredJobs = [
        { id: 'job-1', title: 'Job 1', posted_by: 'faculty-1' },
        { id: 'job-2', title: 'Job 2', posted_by: 'faculty-2' }
      ]

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({ error: null })
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  lt: jest.fn().mockResolvedValue({ 
                    data: expiredJobs, 
                    error: null 
                  })
                })
              })
            }),
            update: mockUpdate
          } as any
        }
        return {} as any
      })

      const result = await enforceApplicationDeadlines()

      expect(result).toBe(2)
      
      // Verify jobs were updated to inactive
      expect(mockUpdate).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String)
      })
      
      // Verify correct job IDs were targeted
      expect(mockUpdate().in).toHaveBeenCalledWith('id', ['job-1', 'job-2'])
    })

    it('should return 0 when no jobs are expired', async () => {
      const mockUpdate = jest.fn()
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  lt: jest.fn().mockResolvedValue({ 
                    data: [], 
                    error: null 
                  })
                })
              })
            }),
            update: mockUpdate
          } as any
        }
        return {} as any
      })

      const result = await enforceApplicationDeadlines()

      expect(result).toBe(0)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should handle null data from database', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  lt: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: null 
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      const result = await enforceApplicationDeadlines()

      expect(result).toBe(0)
    })

    it('should throw error when fetch fails', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  lt: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          } as any
        }
        return {} as any
      })

      await expect(enforceApplicationDeadlines()).rejects.toThrow(
        'Failed to fetch expired jobs: Database error'
      )
    })

    it('should throw error when update fails', async () => {
      const expiredJobs = [{ id: 'job-1', title: 'Job 1', posted_by: 'faculty-1' }]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  lt: jest.fn().mockResolvedValue({ 
                    data: expiredJobs, 
                    error: null 
                  })
                })
              })
            }),
            update: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({ 
                error: { message: 'Update failed' }
              })
            })
          } as any
        }
        return {} as any
      })

      await expect(enforceApplicationDeadlines()).rejects.toThrow(
        'Failed to close expired jobs: Update failed'
      )
    })
  })

  describe('hasUserApplied', () => {
    it('should return true when user has applied', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { id: 'app-123' }, 
                error: null 
              })
            })
          })
        })
      } as any)

      const result = await hasUserApplied('job-123')
      expect(result).toBe(true)
    })

    it('should return false when user has not applied', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      } as any)

      const result = await hasUserApplied('job-123')
      expect(result).toBe(false)
    })

    it('should return false when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      } as any)

      const result = await hasUserApplied('job-123')
      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { code: 'UNEXPECTED_ERROR', message: 'Database error' }
              })
            })
          })
        })
      } as any)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await hasUserApplied('job-123')
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error checking application status:', expect.any(Object))
      
      consoleSpy.mockRestore()
    })
  })
})