import { supabase } from './supabase'
import { Application, JobPosting, Profile } from '@/types/database'
import { notificationService } from './notifications'

export interface CreateApplicationData {
  jobId: string
  coverLetter: string
  resumeFile?: File
}

export interface ApplicationWithDetails extends Application {
  applicant: Profile
  job_posting: JobPosting & {
    profiles: Profile
  }
}

/**
 * Upload resume file to Supabase Storage
 */
export async function uploadResume(file: File, applicationId: string): Promise<string> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('You must be logged in to upload files')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${applicationId}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload resume: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Create a new job application
 */
export async function createApplication(data: CreateApplicationData): Promise<Application> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('You must be logged in to apply for jobs')
  }

  // Check if user has already applied for this job
  const { data: existingApplication, error: checkError } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', data.jobId)
    .eq('applicant_id', user.id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error('Failed to check existing application')
  }

  if (existingApplication) {
    throw new Error('You have already applied for this position')
  }

  // Check if job is still active and deadline hasn't passed
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('is_active, application_deadline')
    .eq('id', data.jobId)
    .single()

  if (jobError) {
    throw new Error('Job not found')
  }

  if (!job.is_active) {
    throw new Error('This job posting is no longer active')
  }

  if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
    throw new Error('The application deadline for this job has passed')
  }

  // Get job and applicant details for notifications
  const { data: jobDetails, error: jobDetailsError } = await supabase
    .from('job_postings')
    .select(`
      title,
      posted_by,
      profiles:profiles!job_postings_posted_by_fkey(full_name)
    `)
    .eq('id', data.jobId)
    .single()

  if (jobDetailsError) {
    throw new Error('Failed to fetch job details')
  }

  const { data: applicantProfile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error('Failed to fetch applicant profile')
  }

  // Create application record first
  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .insert({
      job_id: data.jobId,
      applicant_id: user.id,
      cover_letter: data.coverLetter,
      status: 'pending'
    })
    .select()
    .single()

  if (applicationError) {
    throw new Error(`Failed to create application: ${applicationError.message}`)
  }

  // Upload resume if provided
  let resumeUrl: string | undefined
  if (data.resumeFile) {
    try {
      resumeUrl = await uploadResume(data.resumeFile, application.id)
      
      // Update application with resume URL
      const { error: updateError } = await supabase
        .from('applications')
        .update({ resume_url: resumeUrl })
        .eq('id', application.id)

      if (updateError) {
        console.error('Failed to update application with resume URL:', updateError)
        // Don't throw here as the application was created successfully
      }
    } catch (error) {
      console.error('Failed to upload resume:', error)
      // Don't throw here as the application was created successfully
    }
  }

  // Send notification to faculty member
  try {
    // Get faculty email
    const { data: facultyProfile, error: facultyError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', jobDetails.posted_by)
      .single()

    if (!facultyError && facultyProfile) {
      await notificationService.notifyApplicationReceived(
        facultyProfile.email,
        facultyProfile.full_name,
        jobDetails.posted_by,
        jobDetails.title,
        applicantProfile.full_name,
        application.applied_at,
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      )
    }
  } catch (error) {
    console.error('Failed to send application notification:', error)
    // Don't throw here as the application was created successfully
  }

  return {
    ...application,
    resume_url: resumeUrl
  }
}

/**
 * Get applications for a specific job (for faculty)
 */
export async function getJobApplications(jobId: string): Promise<ApplicationWithDetails[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      applicant:profiles!applications_applicant_id_fkey(*),
      job_posting:job_postings!applications_job_id_fkey(
        *,
        profiles:profiles!job_postings_posted_by_fkey(*)
      )
    `)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }

  return data as ApplicationWithDetails[]
}

/**
 * Get applications by a specific user (for students)
 */
export async function getUserApplications(userId?: string): Promise<ApplicationWithDetails[]> {
  // Get current user if not provided
  let applicantId = userId
  if (!applicantId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('You must be logged in to view applications')
    }
    applicantId = user.id
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      applicant:profiles!applications_applicant_id_fkey(*),
      job_posting:job_postings!applications_job_id_fkey(
        *,
        profiles:profiles!job_postings_posted_by_fkey(*)
      )
    `)
    .eq('applicant_id', applicantId)
    .order('applied_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }

  return data as ApplicationWithDetails[]
}

/**
 * Update application status (for faculty)
 */
export async function updateApplicationStatus(
  applicationId: string, 
  status: Application['status']
): Promise<Application> {
  // Get application details for notification
  const { data: applicationDetails, error: fetchError } = await supabase
    .from('applications')
    .select(`
      applicant_id,
      job_posting:job_postings!applications_job_id_fkey(title)
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError) {
    throw new Error('Failed to fetch application details')
  }

  const jobPosting = applicationDetails.job_posting as any

  const { data, error } = await supabase
    .from('applications')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`)
  }

  // Send notification to applicant if status changed to reviewed, accepted, or rejected
  if (status !== 'pending') {
    try {
      // Get applicant email
      const { data: applicantProfile, error: applicantError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', applicationDetails.applicant_id)
        .single()

      if (!applicantError && applicantProfile) {
        await notificationService.notifyApplicationStatusUpdate(
          applicantProfile.email,
          applicantProfile.full_name,
          applicationDetails.applicant_id,
          jobPosting.title,
          status,
          data.updated_at,
          `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
        )
      }
    } catch (error) {
      console.error('Failed to send status update notification:', error)
      // Don't throw here as the status was updated successfully
    }
  }

  return data
}

/**
 * Check if user has applied for a specific job
 */
export async function hasUserApplied(jobId: string, userId?: string): Promise<boolean> {
  // Get current user if not provided
  let applicantId = userId
  if (!applicantId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }
    applicantId = user.id
  }

  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('applicant_id', applicantId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking application status:', error)
    return false
  }

  return !!data
}

/**
 * Get application by ID with full details
 */
export async function getApplicationById(applicationId: string): Promise<ApplicationWithDetails | null> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      applicant:profiles!applications_applicant_id_fkey(*),
      job_posting:job_postings!applications_job_id_fkey(
        *,
        profiles:profiles!job_postings_posted_by_fkey(*)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch application: ${error.message}`)
  }

  return data as ApplicationWithDetails
}

/**
 * Delete application (for students, only if pending)
 */
export async function deleteApplication(applicationId: string): Promise<void> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('You must be logged in to delete applications')
  }

  // Check if application exists and belongs to user
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('applicant_id, status, resume_url')
    .eq('id', applicationId)
    .single()

  if (fetchError) {
    throw new Error('Application not found')
  }

  if (application.applicant_id !== user.id) {
    throw new Error('You can only delete your own applications')
  }

  if (application.status !== 'pending') {
    throw new Error('You can only delete pending applications')
  }

  // Delete resume file if it exists
  if (application.resume_url) {
    try {
      // Extract file path from URL
      const urlParts = application.resume_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${user.id}/${fileName}`
      
      if (fileName) {
        await supabase.storage
          .from('resumes')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Failed to delete resume file:', error)
      // Continue with application deletion even if file deletion fails
    }
  }

  // Delete application
  const { error: deleteError } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)

  if (deleteError) {
    throw new Error(`Failed to delete application: ${deleteError.message}`)
  }
}

/**
 * Check and enforce application deadlines
 * This function should be called periodically to close jobs past their deadline
 */
export async function enforceApplicationDeadlines(): Promise<number> {
  const now = new Date().toISOString()
  
  // Find active jobs with passed deadlines
  const { data: expiredJobs, error: fetchError } = await supabase
    .from('job_postings')
    .select('id, title, posted_by')
    .eq('is_active', true)
    .not('application_deadline', 'is', null)
    .lt('application_deadline', now)

  if (fetchError) {
    throw new Error(`Failed to fetch expired jobs: ${fetchError.message}`)
  }

  if (!expiredJobs || expiredJobs.length === 0) {
    return 0
  }

  // Close expired jobs
  const jobIds = expiredJobs.map(job => job.id)
  const { error: updateError } = await supabase
    .from('job_postings')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .in('id', jobIds)

  if (updateError) {
    throw new Error(`Failed to close expired jobs: ${updateError.message}`)
  }

  // TODO: Send notifications to job posters about closed positions
  // This would be implemented when the notification system is built

  return expiredJobs.length
}

/**
 * Get application statistics for a job
 */
export async function getJobApplicationStats(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('job_id', jobId)

  if (error) {
    throw new Error(`Failed to fetch application stats: ${error.message}`)
  }

  const stats = {
    total: data.length,
    pending: data.filter(app => app.status === 'pending').length,
    reviewed: data.filter(app => app.status === 'reviewed').length,
    accepted: data.filter(app => app.status === 'accepted').length,
    rejected: data.filter(app => app.status === 'rejected').length
  }

  return stats
}

/**
 * Bulk update application statuses (for faculty)
 */
export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  status: Application['status']
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .in('id', applicationIds)

  if (error) {
    throw new Error(`Failed to bulk update applications: ${error.message}`)
  }
}

/**
 * Get applications that need attention (for notifications)
 */
export async function getApplicationsNeedingAttention() {
  // Get applications that have been pending for more than 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_posting:job_postings!applications_job_id_fkey(
        title,
        posted_by,
        profiles:profiles!job_postings_posted_by_fkey(full_name, email)
      )
    `)
    .eq('status', 'pending')
    .lt('applied_at', sevenDaysAgo.toISOString())

  if (error) {
    throw new Error(`Failed to fetch applications needing attention: ${error.message}`)
  }

  return data
}