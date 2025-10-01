import { supabase } from './supabase'

/**
 * Check and close expired job postings
 * This function should be called periodically (e.g., daily via cron job or Edge Function)
 */
export async function closeExpiredJobs() {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    // Get all active jobs with deadlines that have passed
    const { data: expiredJobs, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title, posted_by, application_deadline')
      .eq('is_active', true)
      .not('application_deadline', 'is', null)
      .lt('application_deadline', today)

    if (fetchError) {
      throw fetchError
    }

    if (!expiredJobs || expiredJobs.length === 0) {
      console.log('No expired jobs found')
      return { closedCount: 0, expiredJobs: [] }
    }

    // Close the expired jobs
    const { error: updateError } = await supabase
      .from('job_postings')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in('id', expiredJobs.map(job => job.id))

    if (updateError) {
      throw updateError
    }

    console.log(`Closed ${expiredJobs.length} expired job postings`)

    // Optionally, create notifications for faculty members about closed jobs
    const notifications = expiredJobs.map(job => ({
      user_id: job.posted_by,
      title: 'Job Posting Closed',
      message: `Your job posting "${job.title}" has been automatically closed due to the application deadline passing.`,
      type: 'deadline_reminder' as const
    }))

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Failed to create notifications for closed jobs:', notificationError)
      }
    }

    return { 
      closedCount: expiredJobs.length, 
      expiredJobs: expiredJobs.map(job => ({ id: job.id, title: job.title }))
    }
  } catch (error) {
    console.error('Error closing expired jobs:', error)
    throw error
  }
}

/**
 * Send deadline reminders to students who haven't applied yet
 * This should be called a few days before deadlines
 */
export async function sendDeadlineReminders(daysBefore = 3) {
  const reminderDate = new Date()
  reminderDate.setDate(reminderDate.getDate() + daysBefore)
  const reminderDateString = reminderDate.toISOString().split('T')[0]

  try {
    // Get jobs with deadlines approaching
    const { data: upcomingJobs, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title, application_deadline, department, job_type')
      .eq('is_active', true)
      .eq('application_deadline', reminderDateString)

    if (fetchError) {
      throw fetchError
    }

    if (!upcomingJobs || upcomingJobs.length === 0) {
      console.log('No jobs with upcoming deadlines found')
      return { reminderCount: 0 }
    }

    // Get students who might be interested (same department or no department preference)
    // This is a simplified approach - in a real system, you might have user preferences
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, department')
      .eq('role', 'student')

    if (studentsError) {
      throw studentsError
    }

    if (!students || students.length === 0) {
      console.log('No students found')
      return { reminderCount: 0 }
    }

    // Create notifications for relevant students
    const notifications: Array<{
      user_id: string
      title: string
      message: string
      type: 'deadline_reminder'
    }> = []

    for (const job of upcomingJobs) {
      for (const student of students) {
        // Send to students in the same department or if student has no department set
        if (!student.department || student.department === job.department) {
          notifications.push({
            user_id: student.id,
            title: 'Application Deadline Approaching',
            message: `The application deadline for "${job.title}" is in ${daysBefore} days. Don't miss out!`,
            type: 'deadline_reminder'
          })
        }
      }
    }

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        throw notificationError
      }
    }

    console.log(`Sent ${notifications.length} deadline reminders`)
    return { reminderCount: notifications.length }
  } catch (error) {
    console.error('Error sending deadline reminders:', error)
    throw error
  }
}

/**
 * Get jobs that will expire soon (for dashboard warnings)
 */
export async function getJobsExpiringSoon(facultyId: string, daysAhead = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  const futureDateString = futureDate.toISOString().split('T')[0]

  try {
    const { data: expiringSoon, error } = await supabase
      .from('job_postings')
      .select('id, title, application_deadline')
      .eq('posted_by', facultyId)
      .eq('is_active', true)
      .not('application_deadline', 'is', null)
      .lte('application_deadline', futureDateString)
      .order('application_deadline', { ascending: true })

    if (error) {
      throw error
    }

    return expiringSoon || []
  } catch (error) {
    console.error('Error fetching jobs expiring soon:', error)
    throw error
  }
}