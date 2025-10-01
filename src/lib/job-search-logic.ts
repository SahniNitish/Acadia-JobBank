import { JobPosting } from '@/types/database'

/**
 * Advanced search utilities for job postings
 */

export interface SearchResult {
  job: JobPosting
  relevanceScore: number
  matchedFields: string[]
}

/**
 * Calculate relevance score for a job posting based on search terms
 */
export function calculateRelevanceScore(job: JobPosting, searchTerms: string[]): SearchResult {
  let score = 0
  const matchedFields: string[] = []

  if (!searchTerms.length) {
    return { job, relevanceScore: 1, matchedFields: [] }
  }

  const fields = {
    title: { weight: 3, value: job.title?.toLowerCase() || '' },
    description: { weight: 2, value: job.description?.toLowerCase() || '' },
    requirements: { weight: 2, value: job.requirements?.toLowerCase() || '' },
    department: { weight: 1.5, value: job.department?.toLowerCase() || '' },
    job_type: { weight: 1, value: job.job_type?.toLowerCase() || '' },
    compensation: { weight: 1, value: job.compensation?.toLowerCase() || '' }
  }

  searchTerms.forEach(term => {
    const lowerTerm = term.toLowerCase()
    
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (field.value.includes(lowerTerm)) {
        // Exact match gets higher score
        if (field.value === lowerTerm) {
          score += field.weight * 2
        }
        // Word boundary match gets medium score
        else if (new RegExp(`\\b${lowerTerm}\\b`).test(field.value)) {
          score += field.weight * 1.5
        }
        // Partial match gets base score
        else {
          score += field.weight
        }
        
        if (!matchedFields.includes(fieldName)) {
          matchedFields.push(fieldName)
        }
      }
    })
  })

  return { job, relevanceScore: score, matchedFields }
}

/**
 * Extract search terms from a search query
 */
export function extractSearchTerms(query: string): string[] {
  if (!query.trim()) return []
  
  // Split by spaces and filter out empty strings
  return query
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.toLowerCase())
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length || !text) return text

  let highlightedText = text
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
  })

  return highlightedText
}

/**
 * Get search suggestions based on existing job data
 */
export function getSearchSuggestions(jobs: JobPosting[], currentQuery: string): string[] {
  if (!currentQuery.trim()) return []

  const suggestions = new Set<string>()
  const query = currentQuery.toLowerCase()

  jobs.forEach(job => {
    // Extract words from various fields
    const words = [
      ...(job.title?.split(/\s+/) || []),
      ...(job.department?.split(/\s+/) || []),
      ...(job.job_type?.split('_') || []),
      ...(job.description?.split(/\s+/) || [])
    ]

    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      if (cleanWord.length > 2 && cleanWord.startsWith(query) && cleanWord !== query) {
        suggestions.add(cleanWord)
      }
    })
  })

  return Array.from(suggestions).slice(0, 5)
}

/**
 * Filter jobs by multiple criteria with advanced logic
 */
export function filterJobs(
  jobs: JobPosting[],
  filters: {
    search?: string
    department?: string
    jobType?: string
    deadlineFrom?: string
    deadlineTo?: string
    hasCompensation?: boolean
  }
): JobPosting[] {
  return jobs.filter(job => {
    // Search filter
    if (filters.search) {
      const searchTerms = extractSearchTerms(filters.search)
      const result = calculateRelevanceScore(job, searchTerms)
      if (result.relevanceScore === 0) return false
    }

    // Department filter
    if (filters.department && job.department !== filters.department) {
      return false
    }

    // Job type filter
    if (filters.jobType && job.job_type !== filters.jobType) {
      return false
    }

    // Deadline filters
    if (filters.deadlineFrom && job.application_deadline) {
      if (new Date(job.application_deadline) < new Date(filters.deadlineFrom)) {
        return false
      }
    }

    if (filters.deadlineTo && job.application_deadline) {
      if (new Date(job.application_deadline) > new Date(filters.deadlineTo)) {
        return false
      }
    }

    // Compensation filter
    if (filters.hasCompensation && !job.compensation) {
      return false
    }

    return true
  })
}

/**
 * Sort jobs by various criteria
 */
export function sortJobs(
  jobs: JobPosting[],
  sortBy: 'created_at' | 'title' | 'deadline' | 'department' | 'compensation' | 'relevance',
  sortOrder: 'asc' | 'desc' = 'desc',
  searchResults?: SearchResult[]
): JobPosting[] {
  const sortedJobs = [...jobs]

  sortedJobs.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '')
        break
      
      case 'deadline':
        const aDeadline = a.application_deadline ? new Date(a.application_deadline).getTime() : 0
        const bDeadline = b.application_deadline ? new Date(b.application_deadline).getTime() : 0
        comparison = aDeadline - bDeadline
        break
      
      case 'department':
        comparison = (a.department || '').localeCompare(b.department || '')
        break
      
      case 'compensation':
        // Simple string comparison for now - could be enhanced for numeric comparison
        const aComp = a.compensation || ''
        const bComp = b.compensation || ''
        comparison = aComp.localeCompare(bComp)
        break
      
      case 'relevance':
        if (searchResults) {
          const aResult = searchResults.find(r => r.job.id === a.id)
          const bResult = searchResults.find(r => r.job.id === b.id)
          comparison = (bResult?.relevanceScore || 0) - (aResult?.relevanceScore || 0)
        } else {
          comparison = 0
        }
        break
      
      default: // 'created_at'
        const aTime = new Date(a.created_at || 0).getTime()
        const bTime = new Date(b.created_at || 0).getTime()
        comparison = bTime - aTime // Default to newest first
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sortedJobs
}