import { createClient } from '@/lib/supabase'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  read?: boolean
}

export interface EmailNotificationData {
  to: string
  subject?: string
  template: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  data: Record<string, any>
}

export interface BatchEmailData {
  recipients: Array<{
    email: string
    userId: string
    data: Record<string, any>
  }>
  template: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  subject?: string
}

class NotificationService {
  private supabase = createClient()

  /**
   * Send a single email notification
   */
  async sendEmailNotification(emailData: EmailNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-email-notification', {
        body: emailData
      })

      if (error) {
        console.error('Error sending email notification:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error invoking email function:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send batch email notifications
   */
  async sendBatchEmailNotifications(batchData: BatchEmailData): Promise<{ success: boolean; error?: string; results?: any }> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-batch-notifications', {
        body: batchData
      })

      if (error) {
        console.error('Error sending batch notifications:', error)
        return { success: false, error: error.message }
      }

      return { success: true, results: data }
    } catch (error) {
      console.error('Error invoking batch email function:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create an in-app notification
   */
  async createNotification(notification: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read || false
        })

      if (error) {
        console.error('Error creating notification:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit = 50): Promise<{ notifications: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        return { notifications: [], error: error.message }
      }

      return { notifications: data || [] }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return { notifications: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: string): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error getting unread notification count:', error)
        return { count: 0, error: error.message }
      }

      return { count: count || 0 }
    } catch (error) {
      console.error('Error getting unread notification count:', error)
      return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send application received notification to faculty
   */
  async notifyApplicationReceived(
    facultyEmail: string,
    facultyName: string,
    facultyId: string,
    jobTitle: string,
    applicantName: string,
    appliedAt: string,
    dashboardUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    // Send email notification
    const emailResult = await this.sendEmailNotification({
      to: facultyEmail,
      template: 'application_received',
      data: {
        facultyName,
        jobTitle,
        applicantName,
        appliedAt,
        dashboardUrl,
        userId: facultyId
      }
    })

    // Create in-app notification
    await this.createNotification({
      userId: facultyId,
      title: `New Application for ${jobTitle}`,
      message: `${applicantName} has applied for your job posting "${jobTitle}"`,
      type: 'application_received'
    })

    return emailResult
  }

  /**
   * Send application status update notification to student
   */
  async notifyApplicationStatusUpdate(
    studentEmail: string,
    studentName: string,
    studentId: string,
    jobTitle: string,
    status: string,
    updatedAt: string,
    dashboardUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    // Send email notification
    const emailResult = await this.sendEmailNotification({
      to: studentEmail,
      template: 'status_update',
      data: {
        studentName,
        jobTitle,
        status,
        updatedAt,
        dashboardUrl,
        userId: studentId
      }
    })

    // Create in-app notification
    const statusMessage = status === 'accepted' ? 
      'Congratulations! Your application has been accepted.' :
      status === 'rejected' ?
      'Your application was not selected for this position.' :
      'Your application status has been updated.'

    await this.createNotification({
      userId: studentId,
      title: `Application Status Update: ${jobTitle}`,
      message: statusMessage,
      type: 'status_update'
    })

    return emailResult
  }

  /**
   * Send new job notification to interested students
   */
  async notifyNewJob(
    students: Array<{ email: string; name: string; id: string }>,
    jobTitle: string,
    department: string,
    jobType: string,
    description: string,
    applicationDeadline: string | null,
    jobUrl: string
  ): Promise<{ success: boolean; error?: string; results?: any }> {
    const recipients = students.map(student => ({
      email: student.email,
      userId: student.id,
      data: {
        studentName: student.name,
        jobTitle,
        department,
        jobType,
        description,
        applicationDeadline,
        jobUrl,
        userId: student.id
      }
    }))

    // Send batch email notifications
    const emailResult = await this.sendBatchEmailNotifications({
      recipients,
      template: 'new_job',
      subject: `New Job Opportunity: ${jobTitle}`
    })

    // Create in-app notifications for each student
    for (const student of students) {
      await this.createNotification({
        userId: student.id,
        title: `New Job Opportunity: ${jobTitle}`,
        message: `A new ${jobType.replace('_', ' ')} position is available in ${department}`,
        type: 'new_job'
      })
    }

    return emailResult
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

export const notificationService = new NotificationService()
export default notificationService