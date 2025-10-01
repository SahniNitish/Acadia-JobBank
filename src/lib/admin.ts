import { supabase } from './supabase'
import { Profile, JobPosting, Application } from '@/types/database'

export interface PlatformStats {
  totalUsers: number
  totalFaculty: number
  totalStudents: number
  totalJobPostings: number
  activeJobPostings: number
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
}

export interface UserManagementData {
  users: Profile[]
  totalCount: number
  totalPages: number
  currentPage: number
}

/**
 * Get platform statistics for admin dashboard
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    // Get user counts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')

    if (profilesError) throw profilesError

    const totalUsers = profiles?.length || 0
    const totalFaculty = profiles?.filter(p => p.role === 'faculty').length || 0
    const totalStudents = profiles?.filter(p => p.role === 'student').length || 0

    // Get job posting counts
    const { data: jobPostings, error: jobsError } = await supabase
      .from('job_postings')
      .select('is_active')

    if (jobsError) throw jobsError

    const totalJobPostings = jobPostings?.length || 0
    const activeJobPostings = jobPostings?.filter(j => j.is_active).length || 0

    // Get application counts
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('status')

    if (appsError) throw appsError

    const totalApplications = applications?.length || 0
    const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0
    const acceptedApplications = applications?.filter(a => a.status === 'accepted').length || 0
    const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0

    return {
      totalUsers,
      totalFaculty,
      totalStudents,
      totalJobPostings,
      activeJobPostings,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications
    }
  } catch (error) {
    throw new Error(`Failed to fetch platform stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get users for admin management with pagination
 */
export async function getUsers(
  page = 1,
  limit = 20,
  role?: Profile['role'],
  search?: string
): Promise<UserManagementData> {
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      users: users || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, newRole: Profile['role']): Promise<Profile> {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return user
  } catch (error) {
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Deactivate user account (soft delete)
 */
export async function deactivateUser(userId: string): Promise<void> {
  try {
    // Note: In a real implementation, you might want to add an 'active' field to profiles
    // For now, we'll just update the updated_at timestamp to mark as "processed"
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    // Also deactivate all job postings by this user if they're faculty
    const { error: jobsError } = await supabase
      .from('job_postings')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('posted_by', userId)

    if (jobsError) {
      console.error('Failed to deactivate user job postings:', jobsError)
      // Don't throw here as the main operation succeeded
    }
  } catch (error) {
    throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get flagged content for moderation
 */
export async function getFlaggedContent() {
  try {
    // Get job postings that might need moderation (e.g., recently created, many applications)
    const { data: suspiciousJobs, error: jobsError } = await supabase
      .from('job_postings')
      .select(`
        *,
        profiles!job_postings_posted_by_fkey(full_name, email),
        applications(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (jobsError) throw jobsError

    // Get applications with potentially problematic content (placeholder logic)
    const { data: recentApplications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(full_name, email),
        job_posting:job_postings!applications_job_id_fkey(title)
      `)
      .order('applied_at', { ascending: false })
      .limit(10)

    if (appsError) throw appsError

    return {
      suspiciousJobs: suspiciousJobs || [],
      recentApplications: recentApplications || []
    }
  } catch (error) {
    throw new Error(`Failed to fetch flagged content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Moderate job posting (approve/reject/edit)
 */
export async function moderateJobPosting(
  jobId: string, 
  action: 'approve' | 'reject' | 'deactivate',
  reason?: string
): Promise<void> {
  try {
    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'approve':
        updateData.is_active = true
        break
      case 'reject':
      case 'deactivate':
        updateData.is_active = false
        break
    }

    const { error } = await supabase
      .from('job_postings')
      .update(updateData)
      .eq('id', jobId)

    if (error) throw error

    // TODO: Send notification to job poster about moderation action
    // This would be implemented when the notification system is built
  } catch (error) {
    throw new Error(`Failed to moderate job posting: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get recent activity for admin monitoring
 */
export async function getRecentActivity() {
  try {
    // Get recent user registrations
    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) throw usersError

    // Get recent job postings
    const { data: recentJobs, error: jobsError } = await supabase
      .from('job_postings')
      .select(`
        *,
        profiles!job_postings_posted_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (jobsError) throw jobsError

    // Get recent applications
    const { data: recentApplications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:profiles!applications_applicant_id_fkey(full_name),
        job_posting:job_postings!applications_job_id_fkey(title)
      `)
      .order('applied_at', { ascending: false })
      .limit(5)

    if (appsError) throw appsError

    return {
      recentUsers: recentUsers || [],
      recentJobs: recentJobs || [],
      recentApplications: recentApplications || []
    }
  } catch (error) {
    throw new Error(`Failed to fetch recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export platform data for reporting
 */
export async function exportPlatformData(type: 'users' | 'jobs' | 'applications') {
  try {
    let data: any[] = []
    
    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (usersError) throw usersError
        data = users || []
        break

      case 'jobs':
        const { data: jobs, error: jobsError } = await supabase
          .from('job_postings')
          .select(`
            *,
            profiles!job_postings_posted_by_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false })
        
        if (jobsError) throw jobsError
        data = jobs || []
        break

      case 'applications':
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select(`
            *,
            applicant:profiles!applications_applicant_id_fkey(full_name, email),
            job_posting:job_postings!applications_job_id_fkey(title, department)
          `)
          .order('applied_at', { ascending: false })
        
        if (appsError) throw appsError
        data = applications || []
        break
    }

    return data
  } catch (error) {
    throw new Error(`Failed to export ${type} data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}