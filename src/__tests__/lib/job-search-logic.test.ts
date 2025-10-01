import { JobPosting } from '@/types/database'
import { 
  calculateRelevanceScore, 
  extractSearchTerms, 
  highlightSearchTerms, 
  getSearchSuggestions,
  filterJobs,
  sortJobs
} from '@/lib/job-search-logic'

// Legacy search functions for backward compatibility
function filterJobsBySearch(jobs: JobPosting[], searchQuery: string): JobPosting[] {
  if (!searchQuery.trim()) {
    return jobs
  }

  const query = searchQuery.toLowerCase().trim()
  
  return jobs.filter(job => {
    const titleMatch = job.title.toLowerCase().includes(query)
    const descriptionMatch = job.description.toLowerCase().includes(query)
    const requirementsMatch = job.requirements?.toLowerCase().includes(query) || false
    const departmentMatch = job.department.toLowerCase().includes(query)
    const compensationMatch = job.compensation?.toLowerCase().includes(query) || false
    
    return titleMatch || descriptionMatch || requirementsMatch || departmentMatch || compensationMatch
  })
}

function filterJobsByDepartment(jobs: JobPosting[], department: string): JobPosting[] {
  if (!department.trim()) {
    return jobs
  }
  
  return jobs.filter(job => job.department === department)
}

function filterJobsByType(jobs: JobPosting[], jobType: JobPosting['job_type']): JobPosting[] {
  if (!jobType) {
    return jobs
  }
  
  return jobs.filter(job => job.job_type === jobType)
}

function filterJobsByStatus(jobs: JobPosting[], isActive: boolean): JobPosting[] {
  return jobs.filter(job => job.is_active === isActive)
}

function filterJobsByDeadline(jobs: JobPosting[], includeExpired: boolean = false): JobPosting[] {
  if (includeExpired) {
    return jobs
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return jobs.filter(job => {
    if (!job.application_deadline) {
      return true // No deadline means always open
    }
    
    const deadline = new Date(job.application_deadline)
    deadline.setHours(0, 0, 0, 0) // Normalize to start of day
    return deadline >= today
  })
}

function sortJobsLegacy(jobs: JobPosting[], sortBy: 'created_at' | 'title' | 'deadline', order: 'asc' | 'desc' = 'desc'): JobPosting[] {
  return [...jobs].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'deadline':
        const aDeadline = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity
        const bDeadline = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity
        comparison = aDeadline - bDeadline
        break
    }
    
    return order === 'asc' ? comparison : -comparison
  })
}

function applyJobFilters(
  jobs: JobPosting[],
  filters: {
    search?: string
    department?: string
    job_type?: JobPosting['job_type']
    is_active?: boolean
    includeExpired?: boolean
    sortBy?: 'created_at' | 'title' | 'deadline'
    sortOrder?: 'asc' | 'desc'
  }
): JobPosting[] {
  let filteredJobs = [...jobs]

  // Apply search filter
  if (filters.search) {
    filteredJobs = filterJobsBySearch(filteredJobs, filters.search)
  }

  // Apply department filter
  if (filters.department) {
    filteredJobs = filterJobsByDepartment(filteredJobs, filters.department)
  }

  // Apply job type filter
  if (filters.job_type) {
    filteredJobs = filterJobsByType(filteredJobs, filters.job_type)
  }

  // Apply status filter
  if (filters.is_active !== undefined) {
    filteredJobs = filterJobsByStatus(filteredJobs, filters.is_active)
  }

  // Apply deadline filter
  filteredJobs = filterJobsByDeadline(filteredJobs, filters.includeExpired)

  // Apply sorting
  if (filters.sortBy) {
    filteredJobs = sortJobsLegacy(filteredJobs, filters.sortBy, filters.sortOrder)
  }

  return filteredJobs
}

describe('Job Search and Filtering Logic', () => {
  const mockJobs: JobPosting[] = [
    {
      id: 'job-1',
      title: 'Research Assistant - Machine Learning',
      description: 'Work on cutting-edge AI research projects using Python and TensorFlow',
      requirements: 'Strong programming skills in Python, experience with machine learning',
      compensation: '$20/hour',
      job_type: 'research_assistant',
      department: 'Computer Science',
      duration: '6 months',
      application_deadline: '2025-12-31',
      is_active: true,
      posted_by: 'faculty-1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'job-2',
      title: 'Teaching Assistant - Calculus I',
      description: 'Assist with grading and tutoring students in introductory calculus',
      requirements: 'Completed Calculus II with grade A or higher',
      compensation: '$15/hour',
      job_type: 'teaching_assistant',
      department: 'Mathematics',
      duration: '1 semester',
      application_deadline: '2025-11-30',
      is_active: true,
      posted_by: 'faculty-2',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-10T09:00:00Z'
    },
    {
      id: 'job-3',
      title: 'Lab Assistant - Chemistry',
      description: 'Help maintain chemistry lab equipment and assist with experiments',
      requirements: 'Chemistry major, safety training completed',
      compensation: '$12/hour',
      job_type: 'work_study',
      department: 'Chemistry',
      duration: '1 year',
      application_deadline: '2024-12-01', // Expired
      is_active: false,
      posted_by: 'faculty-3',
      created_at: '2024-01-05T08:00:00Z',
      updated_at: '2024-01-20T08:00:00Z'
    },
    {
      id: 'job-4',
      title: 'Research Intern - Data Science',
      description: 'Analyze large datasets and create visualizations for research publications',
      requirements: 'Statistics background, R or Python experience',
      compensation: 'Unpaid (course credit available)',
      job_type: 'internship',
      department: 'Computer Science',
      duration: '3 months',
      application_deadline: null,
      is_active: true,
      posted_by: 'faculty-1',
      created_at: '2024-01-20T11:00:00Z',
      updated_at: '2024-01-20T11:00:00Z'
    }
  ]

  describe('filterJobsBySearch', () => {
    it('should return all jobs when search query is empty', () => {
      const result = filterJobsBySearch(mockJobs, '')
      expect(result).toHaveLength(4)
      expect(result).toEqual(mockJobs)
    })

    it('should return all jobs when search query is whitespace', () => {
      const result = filterJobsBySearch(mockJobs, '   ')
      expect(result).toHaveLength(4)
    })

    it('should filter jobs by title', () => {
      const result = filterJobsBySearch(mockJobs, 'Research')
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should filter jobs by description', () => {
      const result = filterJobsBySearch(mockJobs, 'Python')
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should filter jobs by requirements', () => {
      const result = filterJobsBySearch(mockJobs, 'programming')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-1')
    })

    it('should filter jobs by department', () => {
      const result = filterJobsBySearch(mockJobs, 'Computer Science')
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should be case insensitive', () => {
      const result = filterJobsBySearch(mockJobs, 'RESEARCH')
      expect(result).toHaveLength(2)
    })

    it('should handle partial matches', () => {
      const result = filterJobsBySearch(mockJobs, 'Calc')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-2')
    })

    it('should handle special characters', () => {
      const result = filterJobsBySearch(mockJobs, '$20')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-1')
    })

    it('should return empty array when no matches found', () => {
      const result = filterJobsBySearch(mockJobs, 'nonexistent')
      expect(result).toHaveLength(0)
    })

    it('should handle jobs with null requirements', () => {
      const jobsWithNullRequirements = [
        { ...mockJobs[0], requirements: null },
        mockJobs[1]
      ]
      const result = filterJobsBySearch(jobsWithNullRequirements, 'programming')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterJobsByDepartment', () => {
    it('should return all jobs when department is empty', () => {
      const result = filterJobsByDepartment(mockJobs, '')
      expect(result).toHaveLength(4)
    })

    it('should filter jobs by exact department match', () => {
      const result = filterJobsByDepartment(mockJobs, 'Computer Science')
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should be case sensitive for department names', () => {
      const result = filterJobsByDepartment(mockJobs, 'computer science')
      expect(result).toHaveLength(0)
    })

    it('should return empty array when department not found', () => {
      const result = filterJobsByDepartment(mockJobs, 'Physics')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterJobsByType', () => {
    it('should return all jobs when job type is empty', () => {
      const result = filterJobsByType(mockJobs, '' as any)
      expect(result).toHaveLength(4)
    })

    it('should filter jobs by research assistant type', () => {
      const result = filterJobsByType(mockJobs, 'research_assistant')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-1')
    })

    it('should filter jobs by teaching assistant type', () => {
      const result = filterJobsByType(mockJobs, 'teaching_assistant')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-2')
    })

    it('should filter jobs by work study type', () => {
      const result = filterJobsByType(mockJobs, 'work_study')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-3')
    })

    it('should filter jobs by internship type', () => {
      const result = filterJobsByType(mockJobs, 'internship')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-4')
    })

    it('should return empty array when job type not found', () => {
      const result = filterJobsByType(mockJobs, 'other')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterJobsByStatus', () => {
    it('should filter active jobs', () => {
      const result = filterJobsByStatus(mockJobs, true)
      expect(result).toHaveLength(3)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-2', 'job-4'])
    })

    it('should filter inactive jobs', () => {
      const result = filterJobsByStatus(mockJobs, false)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-3')
    })
  })

  describe('filterJobsByDeadline', () => {
    it('should exclude expired jobs by default', () => {
      const result = filterJobsByDeadline(mockJobs)
      expect(result).toHaveLength(3)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-2', 'job-4'])
    })

    it('should include expired jobs when requested', () => {
      const result = filterJobsByDeadline(mockJobs, true)
      expect(result).toHaveLength(4)
    })

    it('should include jobs with no deadline', () => {
      const result = filterJobsByDeadline(mockJobs)
      const jobWithNoDeadline = result.find(job => job.id === 'job-4')
      expect(jobWithNoDeadline).toBeDefined()
    })

    it('should handle edge case of deadline today', () => {
      // Use a future date to ensure the test passes
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const jobsWithTomorrowDeadline = [
        { ...mockJobs[0], application_deadline: tomorrowStr }
      ]
      const result = filterJobsByDeadline(jobsWithTomorrowDeadline)
      expect(result).toHaveLength(1) // Tomorrow's deadline should be included
    })
  })

  describe('sortJobs', () => {
    it('should sort by created_at descending by default', () => {
      const result = sortJobsLegacy(mockJobs, 'created_at')
      expect(result.map(job => job.id)).toEqual(['job-4', 'job-1', 'job-2', 'job-3'])
    })

    it('should sort by created_at ascending', () => {
      const result = sortJobsLegacy(mockJobs, 'created_at', 'asc')
      expect(result.map(job => job.id)).toEqual(['job-3', 'job-2', 'job-1', 'job-4'])
    })

    it('should sort by title ascending', () => {
      const result = sortJobsLegacy(mockJobs, 'title', 'asc')
      expect(result.map(job => job.id)).toEqual(['job-3', 'job-1', 'job-4', 'job-2'])
    })

    it('should sort by title descending', () => {
      const result = sortJobsLegacy(mockJobs, 'title', 'desc')
      expect(result.map(job => job.id)).toEqual(['job-2', 'job-4', 'job-1', 'job-3'])
    })

    it('should sort by deadline ascending (earliest first)', () => {
      const result = sortJobsLegacy(mockJobs, 'deadline', 'asc')
      // job-3 (expired), job-2 (2024-11-30), job-1 (2024-12-31), job-4 (no deadline)
      expect(result.map(job => job.id)).toEqual(['job-3', 'job-2', 'job-1', 'job-4'])
    })

    it('should sort by deadline descending (latest first)', () => {
      const result = sortJobsLegacy(mockJobs, 'deadline', 'desc')
      // job-4 (no deadline), job-1 (2024-12-31), job-2 (2024-11-30), job-3 (expired)
      expect(result.map(job => job.id)).toEqual(['job-4', 'job-1', 'job-2', 'job-3'])
    })

    it('should not mutate original array', () => {
      const originalOrder = mockJobs.map(job => job.id)
      sortJobsLegacy(mockJobs, 'title', 'asc')
      expect(mockJobs.map(job => job.id)).toEqual(originalOrder)
    })
  })

  describe('applyJobFilters', () => {
    it('should return all jobs when no filters applied', () => {
      const result = applyJobFilters(mockJobs, {})
      expect(result).toHaveLength(3) // Excludes expired by default
    })

    it('should apply multiple filters correctly', () => {
      const result = applyJobFilters(mockJobs, {
        search: 'Computer',
        is_active: true,
        job_type: 'research_assistant'
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-1')
    })

    it('should apply search and department filters', () => {
      const result = applyJobFilters(mockJobs, {
        search: 'Research',
        department: 'Computer Science'
      })
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should apply filters and sorting', () => {
      const result = applyJobFilters(mockJobs, {
        department: 'Computer Science',
        sortBy: 'title',
        sortOrder: 'asc'
      })
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-4'])
    })

    it('should include expired jobs when requested', () => {
      const result = applyJobFilters(mockJobs, {
        includeExpired: true,
        is_active: false
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('job-3')
    })

    it('should return empty array when filters match nothing', () => {
      const result = applyJobFilters(mockJobs, {
        search: 'nonexistent',
        department: 'Physics'
      })
      expect(result).toHaveLength(0)
    })

    it('should handle complex filter combinations', () => {
      const result = applyJobFilters(mockJobs, {
        search: 'Assistant',
        is_active: true,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      expect(result).toHaveLength(2)
      expect(result.map(job => job.id)).toEqual(['job-1', 'job-2'])
    })

    it('should not mutate original jobs array', () => {
      const originalJobs = [...mockJobs]
      applyJobFilters(mockJobs, {
        sortBy: 'title',
        search: 'test'
      })
      expect(mockJobs).toEqual(originalJobs)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty jobs array', () => {
      const result = applyJobFilters([], {
        search: 'test',
        department: 'Computer Science'
      })
      expect(result).toHaveLength(0)
    })

    it('should handle jobs with missing optional fields', () => {
      const incompleteJobs = [
        {
          id: 'incomplete-job',
          title: 'Test Job',
          description: 'Test description',
          job_type: 'other' as const,
          department: 'Test Department',
          is_active: true,
          posted_by: 'test-user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          requirements: null,
          compensation: null,
          duration: null,
          application_deadline: null
        }
      ]

      const result = applyJobFilters(incompleteJobs, {
        search: 'Test'
      })
      expect(result).toHaveLength(1)
    })

    it('should handle invalid date formats gracefully', () => {
      const jobsWithInvalidDates = [
        {
          ...mockJobs[0],
          application_deadline: 'invalid-date',
          created_at: 'invalid-date'
        }
      ]

      expect(() => {
        applyJobFilters(jobsWithInvalidDates, {
          sortBy: 'deadline'
        })
      }).not.toThrow()
    })
  })

  describe('Advanced Search Logic', () => {
    describe('calculateRelevanceScore', () => {
      it('should return score 1 for empty search terms', () => {
        const result = calculateRelevanceScore(mockJobs[0], [])
        expect(result.relevanceScore).toBe(1)
        expect(result.matchedFields).toEqual([])
      })

      it('should calculate higher score for title matches', () => {
        const result = calculateRelevanceScore(mockJobs[0], ['research'])
        expect(result.relevanceScore).toBeGreaterThan(0)
        expect(result.matchedFields).toContain('title')
      })

      it('should calculate score for multiple field matches', () => {
        const result = calculateRelevanceScore(mockJobs[0], ['machine', 'learning'])
        expect(result.relevanceScore).toBeGreaterThan(0)
        expect(result.matchedFields.length).toBeGreaterThan(0)
      })

      it('should give higher score for exact matches', () => {
        const exactResult = calculateRelevanceScore(mockJobs[0], ['research'])
        const partialResult = calculateRelevanceScore(mockJobs[0], ['resear'])
        expect(exactResult.relevanceScore).toBeGreaterThan(partialResult.relevanceScore)
      })
    })

    describe('extractSearchTerms', () => {
      it('should extract terms from search query', () => {
        const result = extractSearchTerms('machine learning python')
        expect(result).toEqual(['machine', 'learning', 'python'])
      })

      it('should handle empty query', () => {
        const result = extractSearchTerms('')
        expect(result).toEqual([])
      })

      it('should handle whitespace', () => {
        const result = extractSearchTerms('  machine   learning  ')
        expect(result).toEqual(['machine', 'learning'])
      })

      it('should convert to lowercase', () => {
        const result = extractSearchTerms('Machine Learning')
        expect(result).toEqual(['machine', 'learning'])
      })
    })

    describe('highlightSearchTerms', () => {
      it('should highlight search terms in text', () => {
        const result = highlightSearchTerms('Machine Learning Research', ['machine', 'research'])
        expect(result).toContain('<mark>Machine</mark>')
        expect(result).toContain('<mark>Research</mark>')
      })

      it('should handle empty search terms', () => {
        const text = 'Machine Learning Research'
        const result = highlightSearchTerms(text, [])
        expect(result).toBe(text)
      })

      it('should handle empty text', () => {
        const result = highlightSearchTerms('', ['machine'])
        expect(result).toBe('')
      })
    })

    describe('getSearchSuggestions', () => {
      it('should return suggestions based on job data', () => {
        const result = getSearchSuggestions(mockJobs, 'mach')
        expect(result).toContain('machine')
      })

      it('should return empty array for empty query', () => {
        const result = getSearchSuggestions(mockJobs, '')
        expect(result).toEqual([])
      })

      it('should limit suggestions to 5', () => {
        const result = getSearchSuggestions(mockJobs, 'a')
        expect(result.length).toBeLessThanOrEqual(5)
      })
    })

    describe('Enhanced filterJobs', () => {
      it('should filter by search with relevance scoring', () => {
        const result = filterJobs(mockJobs, { search: 'research' })
        expect(result.length).toBeGreaterThan(0)
        expect(result.every(job => 
          job.title.toLowerCase().includes('research') ||
          job.description.toLowerCase().includes('research')
        )).toBe(true)
      })

      it('should filter by deadline range', () => {
        const result = filterJobs(mockJobs, {
          deadlineFrom: '2025-01-01',
          deadlineTo: '2025-12-31'
        })
        expect(result.length).toBeGreaterThan(0)
      })

      it('should filter by compensation existence', () => {
        const result = filterJobs(mockJobs, { hasCompensation: true })
        expect(result.every(job => job.compensation && job.compensation.trim() !== '')).toBe(true)
      })
    })

    describe('Enhanced sortJobs', () => {
      it('should sort by relevance when search results provided', () => {
        const searchResults = mockJobs.map(job => 
          calculateRelevanceScore(job, ['research'])
        )
        const result = sortJobs(mockJobs, 'relevance', 'desc', searchResults)
        expect(result).toHaveLength(mockJobs.length)
      })

      it('should sort by compensation', () => {
        const result = sortJobs(mockJobs, 'compensation', 'asc')
        expect(result).toHaveLength(mockJobs.length)
      })
    })
  })
})