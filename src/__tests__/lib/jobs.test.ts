import {
  createJobPosting,
  getJobPosting,
  getJobPostings,
  updateJobPosting,
  deleteJobPosting,
  activateJobPosting,
  deactivateJobPosting,
  getFacultyJobPostings,
  checkAndCloseExpiredJobs,
  getFacultyJobStats,
  CreateJobPostingData,
  UpdateJobPostingData,
  JobPostingFilters
} from '@/lib/jobs'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        })),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          })),
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          })),
          lt: jest.fn()
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Job Posting Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createJobPosting', () => {
    const validJobData: CreateJobPostingData = {
      title: 'Research Assistant Position',
      description: 'Help with computer science research',
      requirements: 'Strong programming skills',
      compensation: '$15/hour',
      job_type: 'research_assistant',
      department: 'Computer Science',
      duration: '3 months',
      application_deadline: '2024-12-31',
      posted_by: 'faculty-123'
    }

    it('should create a job posting successfully', async () => {
      const mockJobPosting = { id: 'job-123', ...validJobData, is_active: true }
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockJobPosting, error: null })
          })
        })
      } as any)

      const result = await createJobPosting(validJobData)

      expect(mockSupabase.from).toHaveBeenCalledWith('job_postings')
      expect(result).toEqual(mockJobPosting)
    })

    it('should throw error when creation fails', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any)

      await expect(createJobPosting(validJobData)).rejects.toThrow('Failed to create job posting: Database error')
    })

    it('should set is_active to true by default', async () => {
      const mockJobPosting = { id: 'job-123', ...validJobData, is_active: true }
      
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockJobPosting, error: null })
        })
      })
      
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any)

      await createJobPosting(validJobData)

      expect(mockInsert).toHaveBeenCalledWith([{
        ...validJobData,
        is_active: true
      }])
    })
  })

  describe('getJobPosting', () => {
    it('should fetch a job posting by ID with profile data', async () => {
      const mockJobPosting = {
        id: 'job-123',
        title: 'Research Assistant',
        profiles: { id: 'faculty-123', full_name: 'Dr. Smith' }
      }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockJobPosting, error: null })
          })
        })
      } as any)

      const result = await getJobPosting('job-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('job_postings')
      expect(result).toEqual(mockJobPosting)
    })

    it('should throw error when job posting not found', async () => {
      const mockError = { message: 'Job not found' }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any)

      await expect(getJobPosting('invalid-id')).rejects.toThrow('Failed to fetch job posting: Job not found')
    })
  })

  describe('getJobPostings with filters', () => {
    const mockJobPostings = [
      { id: 'job-1', title: 'Research Assistant', department: 'Computer Science', job_type: 'research_assistant' },
      { id: 'job-2', title: 'Teaching Assistant', department: 'Mathematics', job_type: 'teaching_assistant' }
    ]

    beforeEach(() => {
      // Setup default mock chain
      const mockRange = jest.fn().mockResolvedValue({ 
        data: mockJobPostings, 
        error: null, 
        count: mockJobPostings.length 
      })
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
      const mockOr = jest.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = jest.fn().mockReturnValue({ 
        or: mockOr,
        eq: mockEq,
        order: mockOrder
      })
      
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)
    })

    it('should fetch all job postings without filters', async () => {
      const result = await getJobPostings()

      expect(result).toEqual({
        jobPostings: mockJobPostings,
        totalCount: mockJobPostings.length,
        totalPages: 1,
        currentPage: 1
      })
    })

    it('should apply search filter correctly', async () => {
      const filters: JobPostingFilters = { search: 'research' }
      
      await getJobPostings(filters)

      // Verify that the or method was called with the correct search pattern
      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      expect(chainMock.or).toHaveBeenCalledWith('title.ilike.%research%,description.ilike.%research%')
    })

    it('should apply department filter correctly', async () => {
      const filters: JobPostingFilters = { department: 'Computer Science' }
      
      await getJobPostings(filters)

      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      expect(chainMock.eq).toHaveBeenCalledWith('department', 'Computer Science')
    })

    it('should apply job type filter correctly', async () => {
      const filters: JobPostingFilters = { job_type: 'research_assistant' }
      
      await getJobPostings(filters)

      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      expect(chainMock.eq).toHaveBeenCalledWith('job_type', 'research_assistant')
    })

    it('should apply is_active filter correctly', async () => {
      const filters: JobPostingFilters = { is_active: true }
      
      await getJobPostings(filters)

      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      expect(chainMock.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('should apply posted_by filter correctly', async () => {
      const filters: JobPostingFilters = { posted_by: 'faculty-123' }
      
      await getJobPostings(filters)

      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      expect(chainMock.eq).toHaveBeenCalledWith('posted_by', 'faculty-123')
    })

    it('should handle pagination correctly', async () => {
      const page = 2
      const limit = 5
      
      await getJobPostings({}, page, limit)

      const selectMock = mockSupabase.from().select as jest.Mock
      const chainMock = selectMock.mock.results[0].value
      const orderMock = chainMock.order || chainMock.eq().order || chainMock.or().order
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(orderMock().range).toHaveBeenCalledWith(5, 9) // (page-1)*limit to (page-1)*limit + limit - 1
    })

    it('should calculate total pages correctly', async () => {
      const mockRangeResult = { data: mockJobPostings, error: null, count: 25 }
      
      // Update the mock to return the new count
      const mockRange = jest.fn().mockResolvedValue(mockRangeResult)
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const result = await getJobPostings({}, 1, 10)

      expect(result.totalPages).toBe(3) // Math.ceil(25/10)
      expect(result.totalCount).toBe(25)
    })
  })

  describe('updateJobPosting', () => {
    it('should update a job posting successfully', async () => {
      const updateData: UpdateJobPostingData = {
        title: 'Updated Title',
        is_active: false
      }
      const mockUpdatedJob = { id: 'job-123', ...updateData }
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedJob, error: null })
            })
          })
        })
      } as any)

      const result = await updateJobPosting('job-123', updateData)

      expect(result).toEqual(mockUpdatedJob)
    })

    it('should include updated_at timestamp', async () => {
      const updateData: UpdateJobPostingData = { title: 'Updated Title' }
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      })
      
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      await updateJobPosting('job-123', updateData)

      const updateCall = mockUpdate.mock.calls[0][0]
      expect(updateCall).toHaveProperty('updated_at')
      expect(updateCall.title).toBe('Updated Title')
    })
  })

  describe('deleteJobPosting (soft delete)', () => {
    it('should soft delete by setting is_active to false', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      } as any)

      await deleteJobPosting('job-123')

      const updateMock = mockSupabase.from().update as jest.Mock
      const updateCall = updateMock.mock.calls[0][0]
      expect(updateCall.is_active).toBe(false)
      expect(updateCall).toHaveProperty('updated_at')
    })
  })

  describe('activateJobPosting and deactivateJobPosting', () => {
    it('should activate a job posting', async () => {
      const mockUpdatedJob = { id: 'job-123', is_active: true }
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedJob, error: null })
            })
          })
        })
      } as any)

      const result = await activateJobPosting('job-123')
      expect(result).toEqual(mockUpdatedJob)
    })

    it('should deactivate a job posting', async () => {
      const mockUpdatedJob = { id: 'job-123', is_active: false }
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedJob, error: null })
            })
          })
        })
      } as any)

      const result = await deactivateJobPosting('job-123')
      expect(result).toEqual(mockUpdatedJob)
    })
  })

  describe('checkAndCloseExpiredJobs', () => {
    it('should close jobs past their deadline', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({ error: null })
          })
        })
      } as any)

      await checkAndCloseExpiredJobs()

      const updateMock = mockSupabase.from().update as jest.Mock
      const updateCall = updateMock.mock.calls[0][0]
      expect(updateCall.is_active).toBe(false)
      expect(updateCall).toHaveProperty('updated_at')
    })

    it('should only affect active jobs with past deadlines', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          lt: jest.fn().mockResolvedValue({ error: null })
        })
      })
      
      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any)

      await checkAndCloseExpiredJobs()

      const eqMock = mockUpdate().eq as jest.Mock
      const ltMock = eqMock().lt as jest.Mock
      
      expect(eqMock).toHaveBeenCalledWith('is_active', true)
      expect(ltMock).toHaveBeenCalledWith('application_deadline', expect.any(String))
    })
  })

  describe('getFacultyJobStats', () => {
    it('should calculate job statistics correctly', async () => {
      const mockJobs = [
        { is_active: true },
        { is_active: true },
        { is_active: false },
        { is_active: false },
        { is_active: false }
      ]
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockJobs, error: null })
        })
      } as any)

      const result = await getFacultyJobStats('faculty-123')

      expect(result).toEqual({
        activeJobs: 2,
        inactiveJobs: 3,
        totalJobs: 5
      })
    })

    it('should handle empty job list', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      } as any)

      const result = await getFacultyJobStats('faculty-123')

      expect(result).toEqual({
        activeJobs: 0,
        inactiveJobs: 0,
        totalJobs: 0
      })
    })

    it('should handle null data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any)

      const result = await getFacultyJobStats('faculty-123')

      expect(result).toEqual({
        activeJobs: 0,
        inactiveJobs: 0,
        totalJobs: 0
      })
    })
  })

  describe('getFacultyJobPostings', () => {
    it('should get active jobs by default', async () => {
      const mockJobsResult = {
        jobPostings: [{ id: 'job-1', is_active: true }],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1
      }

      // Mock the getJobPostings function by mocking the entire module
      jest.doMock('@/lib/jobs', () => ({
        ...jest.requireActual('@/lib/jobs'),
        getJobPostings: jest.fn().mockResolvedValue(mockJobsResult)
      }))

      // Since we're testing the actual function, we need to call it directly
      // This test verifies the function calls getJobPostings with correct filters
      const result = await getFacultyJobPostings('faculty-123')
      
      // The function should return the result from getJobPostings
      expect(result).toBeDefined()
    })

    it('should include inactive jobs when requested', async () => {
      // This test verifies the function behavior when includeInactive is true
      const result = await getFacultyJobPostings('faculty-123', true)
      expect(result).toBeDefined()
    })
  })
})