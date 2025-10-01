import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import {
  useJobPostings,
  useJobPosting,
  useCreateJobPosting,
  useUpdateJobPosting,
  useDeleteJobPosting,
  useFacultyJobs
} from '@/hooks/use-jobs'
import * as jobsLib from '@/lib/jobs'

// Mock the jobs library
jest.mock('@/lib/jobs')

const mockJobsLib = jobsLib as jest.Mocked<typeof jobsLib>

describe('useJobPostings Hook', () => {
  const mockJobPostings = [
    {
      id: 'job-1',
      title: 'Research Assistant',
      description: 'Help with research',
      job_type: 'research_assistant' as const,
      department: 'Computer Science',
      is_active: true,
      posted_by: 'faculty-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'job-2', 
      title: 'Teaching Assistant',
      description: 'Help with teaching',
      job_type: 'teaching_assistant' as const,
      department: 'Mathematics',
      is_active: true,
      posted_by: 'faculty-2',
      created_at: '2024-01-02',
      updated_at: '2024-01-02'
    }
  ]

  const mockJobPostingsResult = {
    jobPostings: mockJobPostings,
    totalCount: 2,
    totalPages: 1,
    currentPage: 1
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockJobsLib.getJobPostings.mockResolvedValue(mockJobPostingsResult)
  })

  it('should fetch job postings on mount', async () => {
    const { result } = renderHook(() => useJobPostings())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledWith({}, 1, 10)
    expect(result.current.jobPostings).toEqual(mockJobPostings)
    expect(result.current.totalCount).toBe(2)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.error).toBeNull()
  })

  it('should apply filters correctly', async () => {
    const filters = {
      search: 'research',
      department: 'Computer Science',
      job_type: 'research_assistant' as const
    }

    const { result } = renderHook(() => useJobPostings(filters))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledWith(filters, 1, 10)
  })

  it('should handle pagination correctly', async () => {
    const { result } = renderHook(() => useJobPostings({}, 2, 5))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledWith({}, 2, 5)
  })

  it('should refetch when filters change', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useJobPostings(filters),
      { initialProps: { filters: {} } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledTimes(1)

    // Change filters
    rerender({ filters: { search: 'assistant' } })

    await waitFor(() => {
      expect(mockJobsLib.getJobPostings).toHaveBeenCalledTimes(2)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenLastCalledWith({ search: 'assistant' }, 1, 10)
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch jobs'
    mockJobsLib.getJobPostings.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useJobPostings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.jobPostings).toEqual([])
  })

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useJobPostings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledTimes(1)

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(mockJobsLib.getJobPostings).toHaveBeenCalledTimes(2)
  })
})

describe('useJobPosting Hook', () => {
  const mockJobPosting = {
    id: 'job-1',
    title: 'Research Assistant',
    description: 'Help with research',
    job_type: 'research_assistant' as const,
    department: 'Computer Science',
    is_active: true,
    posted_by: 'faculty-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockJobsLib.getJobPosting.mockResolvedValue(mockJobPosting)
  })

  it('should fetch job posting by ID', async () => {
    const { result } = renderHook(() => useJobPosting('job-1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPosting).toHaveBeenCalledWith('job-1')
    expect(result.current.jobPosting).toEqual(mockJobPosting)
    expect(result.current.error).toBeNull()
  })

  it('should not fetch when ID is null', () => {
    const { result } = renderHook(() => useJobPosting(null))

    expect(result.current.isLoading).toBe(false)
    expect(mockJobsLib.getJobPosting).not.toHaveBeenCalled()
    expect(result.current.jobPosting).toBeNull()
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Job not found'
    mockJobsLib.getJobPosting.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useJobPosting('invalid-id'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.jobPosting).toBeNull()
  })

  it('should refetch when ID changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useJobPosting(id),
      { initialProps: { id: 'job-1' } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getJobPosting).toHaveBeenCalledTimes(1)

    // Change ID
    rerender({ id: 'job-2' })

    await waitFor(() => {
      expect(mockJobsLib.getJobPosting).toHaveBeenCalledTimes(2)
    })

    expect(mockJobsLib.getJobPosting).toHaveBeenLastCalledWith('job-2')
  })
})

describe('useCreateJobPosting Hook', () => {
  const mockJobData = {
    title: 'New Job',
    description: 'Job description',
    job_type: 'research_assistant' as const,
    department: 'Computer Science',
    posted_by: 'faculty-1'
  }

  const mockCreatedJob = {
    id: 'job-new',
    ...mockJobData,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockJobsLib.createJobPosting.mockResolvedValue(mockCreatedJob)
  })

  it('should create job posting successfully', async () => {
    const { result } = renderHook(() => useCreateJobPosting())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()

    let createdJob
    await act(async () => {
      createdJob = await result.current.createJob(mockJobData)
    })

    expect(mockJobsLib.createJobPosting).toHaveBeenCalledWith(mockJobData)
    expect(createdJob).toEqual(mockCreatedJob)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle creation errors', async () => {
    const errorMessage = 'Failed to create job'
    mockJobsLib.createJobPosting.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useCreateJobPosting())

    await act(async () => {
      try {
        await result.current.createJob(mockJobData)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.isLoading).toBe(false)
  })

  it('should set loading state during creation', async () => {
    let resolveCreate: (value: any) => void
    const createPromise = new Promise(resolve => {
      resolveCreate = resolve
    })
    mockJobsLib.createJobPosting.mockReturnValue(createPromise)

    const { result } = renderHook(() => useCreateJobPosting())

    act(() => {
      result.current.createJob(mockJobData)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveCreate(mockCreatedJob)
      await createPromise
    })

    expect(result.current.isLoading).toBe(false)
  })
})

describe('useFacultyJobs Hook', () => {
  const mockFacultyJobs = [
    {
      id: 'job-1',
      title: 'Research Assistant',
      description: 'Help with research',
      job_type: 'research_assistant' as const,
      department: 'Computer Science',
      is_active: true,
      posted_by: 'faculty-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ]

  const mockFacultyJobsResult = {
    jobPostings: mockFacultyJobs,
    totalCount: 1,
    totalPages: 1,
    currentPage: 1
  }

  const mockStats = {
    activeJobs: 1,
    inactiveJobs: 0,
    totalJobs: 1
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockJobsLib.getFacultyJobPostings.mockResolvedValue(mockFacultyJobsResult)
    mockJobsLib.getFacultyJobStats.mockResolvedValue(mockStats)
  })

  it('should fetch faculty jobs and stats', async () => {
    const { result } = renderHook(() => useFacultyJobs('faculty-1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledWith('faculty-1', false)
    expect(mockJobsLib.getFacultyJobStats).toHaveBeenCalledWith('faculty-1')
    expect(result.current.jobPostings).toEqual(mockFacultyJobs)
    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.error).toBeNull()
  })

  it('should include inactive jobs when requested', async () => {
    const { result } = renderHook(() => useFacultyJobs('faculty-1', true))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledWith('faculty-1', true)
  })

  it('should not fetch when facultyId is null', () => {
    const { result } = renderHook(() => useFacultyJobs(null))

    expect(result.current.isLoading).toBe(false)
    expect(mockJobsLib.getFacultyJobPostings).not.toHaveBeenCalled()
    expect(mockJobsLib.getFacultyJobStats).not.toHaveBeenCalled()
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch faculty jobs'
    mockJobsLib.getFacultyJobPostings.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useFacultyJobs('faculty-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.jobPostings).toEqual([])
  })

  it('should refetch when facultyId changes', async () => {
    const { result, rerender } = renderHook(
      ({ facultyId }) => useFacultyJobs(facultyId),
      { initialProps: { facultyId: 'faculty-1' } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledTimes(1)

    // Change facultyId
    rerender({ facultyId: 'faculty-2' })

    await waitFor(() => {
      expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledTimes(2)
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenLastCalledWith('faculty-2', false)
  })

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useFacultyJobs('faculty-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledTimes(1)

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(mockJobsLib.getFacultyJobPostings).toHaveBeenCalledTimes(2)
  })
})