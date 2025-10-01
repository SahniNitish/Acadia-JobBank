'use client'

import { useState, useEffect } from 'react'
import { 
  getJobPostings, 
  getJobPosting, 
  createJobPosting, 
  updateJobPosting, 
  deleteJobPosting,
  getFacultyJobPostings,
  getFacultyJobStats,
  JobPostingFilters,
  CreateJobPostingData,
  UpdateJobPostingData
} from '@/lib/jobs'
import { JobPosting } from '@/types/database'

export function useJobPostings(filters: JobPostingFilters = {}, page = 1, limit = 10) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobPostings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getJobPostings(filters, page, limit)
      setJobPostings(result.jobPostings)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(result.currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job postings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobPostings()
  }, [JSON.stringify(filters), page, limit])

  return {
    jobPostings,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    error,
    refetch: fetchJobPostings
  }
}

export function useJobPosting(id: string | null) {
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobPosting = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await getJobPosting(id)
      setJobPosting(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job posting')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobPosting()
  }, [id])

  return {
    jobPosting,
    isLoading,
    error,
    refetch: fetchJobPosting
  }
}

export function useCreateJobPosting() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createJob = async (data: CreateJobPostingData) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await createJobPosting(data)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job posting'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createJob,
    isLoading,
    error
  }
}

export function useUpdateJobPosting() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateJob = async (id: string, data: UpdateJobPostingData) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await updateJobPosting(id, data)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job posting'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateJob,
    isLoading,
    error
  }
}

export function useDeleteJobPosting() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteJob = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await deleteJobPosting(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job posting'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    deleteJob,
    isLoading,
    error
  }
}

export function useFacultyJobs(facultyId: string | null, includeInactive = false) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [stats, setStats] = useState({ activeJobs: 0, inactiveJobs: 0, totalJobs: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFacultyJobs = async () => {
    if (!facultyId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const [jobsResult, statsResult] = await Promise.all([
        getFacultyJobPostings(facultyId, includeInactive),
        getFacultyJobStats(facultyId)
      ])
      
      setJobPostings(jobsResult.jobPostings)
      setStats(statsResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch faculty jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFacultyJobs()
  }, [facultyId, includeInactive])

  return {
    jobPostings,
    stats,
    isLoading,
    error,
    refetch: fetchFacultyJobs
  }
}