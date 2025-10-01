import { CreateJobPostingData, UpdateJobPostingData } from '@/lib/jobs'
import { JobPosting } from '@/types/database'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
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
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { describe } from 'node:test'
import { describe } from 'node:test'

// Job posting validation functions
export function validateJobPostingData(data: Partial<CreateJobPostingData>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required field validation
  if (!data.title?.trim()) {
    errors.push('Job title is required')
  } else if (data.title.length < 3) {
    errors.push('Job title must be at least 3 characters long')
  } else if (data.title.length > 200) {
    errors.push('Job title must be less than 200 characters')
  }

  if (!data.description?.trim()) {
    errors.push('Job description is required')
  } else if (data.description.length < 10) {
    errors.push('Job description must be at least 10 characters long')
  } else if (data.description.length > 5000) {
    errors.push('Job description must be less than 5000 characters')
  }

  if (!data.job_type) {
    errors.push('Job type is required')
  } else if (!['research_assistant', 'teaching_assistant', 'work_study', 'internship', 'other'].includes(data.job_type)) {
    errors.push('Invalid job type')
  }

  if (!data.department?.trim()) {
    errors.push('Department is required')
  }

  if (!data.posted_by?.trim()) {
    errors.push('Posted by user ID is required')
  }

  // Optional field validation
  if (data.requirements && data.requirements.length > 3000) {
    errors.push('Requirements must be less than 3000 characters')
  }

  if (data.compensation && data.compensation.length > 100) {
    errors.push('Compensation must be less than 100 characters')
  }

  if (data.duration && data.duration.length > 100) {
    errors.push('Duration must be less than 100 characters')
  }

  // Date validation
  if (data.application_deadline) {
    const deadline = new Date(data.application_deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(deadline.getTime())) {
      errors.push('Invalid application deadline date')
    } else if (deadline < today) {
      errors.push('Application deadline must be in the future')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateJobSearchFilters(filters: {
  search?: string
  department?: string
  job_type?: JobPosting['job_type']
}): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Search query validation
  if (filters.search && filters.search.length > 500) {
    errors.push('Search query must be less than 500 characters')
  }

  // Department validation - allow empty string as it means "no filter"
  // Only validate if department is provided and not empty

  // Job type validation
  if (filters.job_type && !['research_assistant', 'teaching_assistant', 'work_study', 'internship', 'other'].includes(filters.job_type)) {
    errors.push('Invalid job type filter')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

describe('Job Posting Validation', () => {
  describe('validateJobPostingData', () => {
    const validJobData: CreateJobPostingData = {
      title: 'Research Assistant Position',
      description: 'Help with computer science research projects and data analysis',
      requirements: 'Strong programming skills in Python or R',
      compensation: '$15/hour',
      job_type: 'research_assistant',
      department: 'Computer Science',
      duration: '3 months',
      application_deadline: '2025-12-31',
      posted_by: 'faculty-123'
    }

    describe('Required Field Validation', () => {
      it('should validate a complete valid job posting', () => {
        const result = validateJobPostingData(validJobData)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should require job title', () => {
        const result = validateJobPostingData({ ...validJobData, title: '' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job title is required')
      })

      it('should require job title with minimum length', () => {
        const result = validateJobPostingData({ ...validJobData, title: 'AB' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job title must be at least 3 characters long')
      })

      it('should enforce maximum title length', () => {
        const longTitle = 'A'.repeat(201)
        const result = validateJobPostingData({ ...validJobData, title: longTitle })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job title must be less than 200 characters')
      })

      it('should require job description', () => {
        const result = validateJobPostingData({ ...validJobData, description: '' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job description is required')
      })

      it('should require job description with minimum length', () => {
        const result = validateJobPostingData({ ...validJobData, description: 'Short' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job description must be at least 10 characters long')
      })

      it('should enforce maximum description length', () => {
        const longDescription = 'A'.repeat(5001)
        const result = validateJobPostingData({ ...validJobData, description: longDescription })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job description must be less than 5000 characters')
      })

      it('should require job type', () => {
        const result = validateJobPostingData({ ...validJobData, job_type: undefined as any })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job type is required')
      })

      it('should validate job type values', () => {
        const result = validateJobPostingData({ ...validJobData, job_type: 'invalid_type' as any })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid job type')
      })

      it('should accept all valid job types', () => {
        const validTypes: JobPosting['job_type'][] = ['research_assistant', 'teaching_assistant', 'work_study', 'internship', 'other']
        
        validTypes.forEach(type => {
          const result = validateJobPostingData({ ...validJobData, job_type: type })
          expect(result.isValid).toBe(true)
        })
      })

      it('should require department', () => {
        const result = validateJobPostingData({ ...validJobData, department: '' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Department is required')
      })

      it('should require posted_by user ID', () => {
        const result = validateJobPostingData({ ...validJobData, posted_by: '' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Posted by user ID is required')
      })
    })

    describe('Optional Field Validation', () => {
      it('should allow empty optional fields', () => {
        const minimalData = {
          title: 'Test Job',
          description: 'This is a test job description',
          job_type: 'research_assistant' as const,
          department: 'Computer Science',
          posted_by: 'faculty-123'
        }
        const result = validateJobPostingData(minimalData)
        expect(result.isValid).toBe(true)
      })

      it('should enforce maximum requirements length', () => {
        const longRequirements = 'A'.repeat(3001)
        const result = validateJobPostingData({ ...validJobData, requirements: longRequirements })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Requirements must be less than 3000 characters')
      })

      it('should enforce maximum compensation length', () => {
        const longCompensation = 'A'.repeat(101)
        const result = validateJobPostingData({ ...validJobData, compensation: longCompensation })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Compensation must be less than 100 characters')
      })

      it('should enforce maximum duration length', () => {
        const longDuration = 'A'.repeat(101)
        const result = validateJobPostingData({ ...validJobData, duration: longDuration })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Duration must be less than 100 characters')
      })
    })

    describe('Date Validation', () => {
      it('should accept valid future dates', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        const result = validateJobPostingData({ 
          ...validJobData, 
          application_deadline: futureDate.toISOString().split('T')[0] 
        })
        expect(result.isValid).toBe(true)
      })

      it('should reject past dates', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        const result = validateJobPostingData({ 
          ...validJobData, 
          application_deadline: pastDate.toISOString().split('T')[0] 
        })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Application deadline must be in the future')
      })

      it('should reject invalid date formats', () => {
        const result = validateJobPostingData({ ...validJobData, application_deadline: 'invalid-date' })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid application deadline date')
      })

      it('should allow empty application deadline', () => {
        const result = validateJobPostingData({ ...validJobData, application_deadline: undefined })
        expect(result.isValid).toBe(true)
      })
    })

    describe('Multiple Validation Errors', () => {
      it('should return all validation errors at once', () => {
        const invalidData = {
          title: '',
          description: '',
          job_type: undefined as any,
          department: '',
          posted_by: '',
          application_deadline: 'invalid-date'
        }
        const result = validateJobPostingData(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
        expect(result.errors).toContain('Job title is required')
        expect(result.errors).toContain('Job description is required')
        expect(result.errors).toContain('Job type is required')
        expect(result.errors).toContain('Department is required')
        expect(result.errors).toContain('Posted by user ID is required')
        expect(result.errors).toContain('Invalid application deadline date')
      })
    })

    describe('Whitespace Handling', () => {
      it('should trim whitespace from required fields', () => {
        const result = validateJobPostingData({ 
          ...validJobData, 
          title: '   ',
          description: '   ',
          department: '   ',
          posted_by: '   '
        })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Job title is required')
        expect(result.errors).toContain('Job description is required')
        expect(result.errors).toContain('Department is required')
        expect(result.errors).toContain('Posted by user ID is required')
      })

      it('should accept fields with leading/trailing whitespace if content exists', () => {
        const result = validateJobPostingData({
          ...validJobData,
          title: '  Valid Title  ',
          description: '  Valid description with enough content  ',
          department: '  Computer Science  ',
          posted_by: '  faculty-123  '
        })
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('validateJobSearchFilters', () => {
    it('should validate empty filters', () => {
      const result = validateJobSearchFilters({})
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid search filters', () => {
      const result = validateJobSearchFilters({
        search: 'research assistant',
        department: 'Computer Science',
        job_type: 'research_assistant'
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should enforce maximum search query length', () => {
      const longSearch = 'A'.repeat(501)
      const result = validateJobSearchFilters({ search: longSearch })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Search query must be less than 500 characters')
    })

    it('should allow empty string department filter', () => {
      const result = validateJobSearchFilters({ department: '' })
      expect(result.isValid).toBe(true)
    })

    it('should validate job type filter values', () => {
      const result = validateJobSearchFilters({ job_type: 'invalid_type' as any })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid job type filter')
    })

    it('should accept all valid job type filters', () => {
      const validTypes: JobPosting['job_type'][] = ['research_assistant', 'teaching_assistant', 'work_study', 'internship', 'other']
      
      validTypes.forEach(type => {
        const result = validateJobSearchFilters({ job_type: type })
        expect(result.isValid).toBe(true)
      })
    })

    it('should handle special characters in search query', () => {
      const result = validateJobSearchFilters({ search: 'C++ & Java programming' })
      expect(result.isValid).toBe(true)
    })

    it('should handle unicode characters in search query', () => {
      const result = validateJobSearchFilters({ search: 'Recherche en français' })
      expect(result.isValid).toBe(true)
    })

    it('should return multiple errors when applicable', () => {
      const result = validateJobSearchFilters({
        search: 'A'.repeat(501),
        job_type: 'invalid_type' as any
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(2)
      expect(result.errors).toContain('Search query must be less than 500 characters')
      expect(result.errors).toContain('Invalid job type filter')
    })
  })
})