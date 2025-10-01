import { supabase } from './supabase'
import { JobPosting } from '@/types/database'
import { notificationService } from './notifications'
import { cachedFetch, cacheKeys, cacheInvalidation } from './cache'

export interface CreateJobPostingData {
  title: string
  description: string
  requirements?: string
  compensation?: string
  job_type: JobPosting['job_type']
  department: string
  duration?: string
  application_deadline?: string
  posted_by: string
}

export interface UpdateJobPostingData {
  title?: string
  description?: string
  requirements?: string
  compensation?: string
  job_type?: JobPosting['job_type']
  department?: string
  duration?: string
  application_deadline?: string
  is_active?: boolean
}

export interface JobPostingFilters {
  search?: string
  department?: string
  job_type?: JobPosting['job_type']
  is_active?: boolean
  posted_by?: string
  compensation_min?: number
  compensation_max?: number
  deadline_from?: string
  deadline_to?: string
  sort_by?: 'created_at' | 'title' | 'deadline' | 'department' | 'compensation'
  sort_order?: 'asc' | 'desc'
}

/**
 * Create a new job posting
 */
export async function createJobPosting(data: CreateJobPostingData) {
  const { data: jobPosting, error } = await supabase
    .from('job_postings')
    .insert([{
      ...data,
      is_active: true
    }])
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create job posting: ${error.message}`)
  }

  // Invalidate job-related caches
  cacheInvalidation.invalidateJobs()

  // Send notifications to interested students
  try {
    await sendNewJobNotifications(jobPosting)
  } catch (error) {
    console.error('Failed to send new job notifications:', error)
    // Don't throw here as the job was created successfully
  }

  return jobPosting
}

/**
 * Get a job posting by ID
 */
export async function getJobPosting(id: string) {
  return cachedFetch(
    cacheKeys.job(id),
    async () => {
      const { data: jobPosting, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          profiles!job_postings_posted_by_fkey (
            id,
            full_name,
            department,
            role
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch job posting: ${error.message}`)
      }

      // Get application count
      const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', id)

      return {
        ...jobPosting,
        application_count: applicationCount || 0
      }
    },
    5 * 60 * 1000 // Cache for 5 minutes
  )
}

/**
 * Get job postings with optional filtering and pagination
 */
export async function getJobPostings(
  filters: JobPostingFilters = {},
  page = 1,
  limit = 10
) {
  // Create cache key based on filters and pagination
  const cacheKey = cacheKeys.jobs({ ...filters, page, limit })
  
  return cachedFetch(
    cacheKey,
    async () => {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          profiles!job_postings_posted_by_fkey (
            id,
            full_name,
            department,
            role
          ),
          applications(count)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        // Enhanced full-text search across multiple fields
        const searchTerm = filters.search.toLowerCase()
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,requirements.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
      }

      if (filters.department) {
        query = query.eq('department', filters.department)
      }

      if (filters.job_type) {
        query = query.eq('job_type', filters.job_type)
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters.posted_by) {
        query = query.eq('posted_by', filters.posted_by)
      }

      // Date range filters
      if (filters.deadline_from) {
        query = query.gte('application_deadline', filters.deadline_from)
      }

      if (filters.deadline_to) {
        query = query.lte('application_deadline', filters.deadline_to)
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at'
      const sortOrder = filters.sort_order || 'desc'
      const ascending = sortOrder === 'asc'

      // Handle different sort fields
      switch (sortBy) {
        case 'title':
          query = query.order('title', { ascending })
          break
        case 'deadline':
          query = query.order('application_deadline', { ascending, nullsFirst: false })
          break
        case 'department':
          query = query.order('department', { ascending })
          break
        case 'compensation':
          query = query.order('compensation', { ascending, nullsFirst: false })
          break
        default:
          query = query.order('created_at', { ascending })
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data: jobPostings, error, count } = await query
        .range(from, to)

      if (error) {
        throw new Error(`Failed to fetch job postings: ${error.message}`)
      }

      return {
        jobPostings: jobPostings || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      }
    },
    2 * 60 * 1000 // Cache for 2 minutes
  )
}

/**
 * Update a job posting
 */
export async function updateJobPosting(id: string, data: UpdateJobPostingData) {
  const { data: jobPosting, error } = await supabase
    .from('job_postings')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update job posting: ${error.message}`)
  }

  return jobPosting
}

/**
 * Delete a job posting (soft delete by setting is_active to false)
 */
export async function deleteJobPosting(id: string) {
  const { error } = await supabase
    .from('job_postings')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete job posting: ${error.message}`)
  }
}

/**
 * Activate a job posting
 */
export async function activateJobPosting(id: string) {
  return updateJobPosting(id, { is_active: true })
}

/**
 * Deactivate a job posting
 */
export async function deactivateJobPosting(id: string) {
  return updateJobPosting(id, { is_active: false })
}

/**
 * Get job postings by faculty member
 */
export async function getFacultyJobPostings(facultyId: string, includeInactive = false) {
  const filters: JobPostingFilters = {
    posted_by: facultyId
  }

  if (!includeInactive) {
    filters.is_active = true
  }

  return getJobPostings(filters, 1, 100) // Get all for faculty dashboard
}

/**
 * Check if a job posting deadline has passed and auto-close if needed
 */
export async function checkAndCloseExpiredJobs() {
  const today = new Date().toISOString().split('T')[0]
  
  const { error } = await supabase
    .from('job_postings')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('is_active', true)
    .lt('application_deadline', today)

  if (error) {
    throw new Error(`Failed to close expired jobs: ${error.message}`)
  }
}

/**
 * Get job posting statistics for a faculty member
 */
export async function getFacultyJobStats(facultyId: string) {
  const { data: stats, error } = await supabase
    .from('job_postings')
    .select('is_active')
    .eq('posted_by', facultyId)

  if (error) {
    throw new Error(`Failed to fetch job stats: ${error.message}`)
  }

  const activeJobs = stats?.filter(job => job.is_active).length || 0
  const totalJobs = stats?.length || 0
  const inactiveJobs = totalJobs - activeJobs

  return {
    activeJobs,
    inactiveJobs,
    totalJobs
  }
}

/**
 * Send new job notifications to interested students
 */
async function sendNewJobNotifications(jobPosting: JobPosting) {
  // Get students who have notification preferences enabled for new jobs
  const { data: interestedStudents, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      department,
      notification_preferences!left(email_new_jobs)
    `)
    .eq('role', 'student')
    .or('notification_preferences.email_new_jobs.is.null,notification_preferences.email_new_jobs.eq.true')

  if (error) {
    console.error('Failed to fetch interested students:', error)
    return
  }

  if (!interestedStudents || interestedStudents.length === 0) {
    return
  }

  // Filter students who might be interested (same department or no department preference)
  const relevantStudents = interestedStudents.filter(student => {
    // If student has no department set, they get all notifications
    if (!student.department) return true
    // If job is in same department, notify
    if (student.department === jobPosting.department) return true
    // Otherwise, don't notify
    return false
  })

  if (relevantStudents.length === 0) {
    return
  }

  // Prepare student data for notification
  const students = relevantStudents.map(student => ({
    email: student.email,
    name: student.full_name,
    id: student.id
  }))

  // Send notifications
  await notificationService.notifyNewJob(
    students,
    jobPosting.title,
    jobPosting.department,
    jobPosting.job_type,
    jobPosting.description,
    jobPosting.application_deadline || null,
    `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/${jobPosting.id}`
  )
}