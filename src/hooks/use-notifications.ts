import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { notificationService } from '@/lib/notifications'
import { createClient } from '@/lib/supabase'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'application_received' | 'status_update' | 'new_job' | 'deadline_reminder'
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  email_new_jobs: boolean
  email_application_updates: boolean
  email_deadline_reminders: boolean
  email_application_received: boolean
  in_app_notifications: boolean
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    const { notifications: data, error: fetchError } = await notificationService.getUserNotifications(user.id)
    
    if (fetchError) {
      setError(fetchError)
    } else {
      setNotifications(data)
      const unread = data.filter(n => !n.read).length
      setUnreadCount(unread)
    }
    setLoading(false)
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { success, error: markError } = await notificationService.markNotificationAsRead(notificationId)
    
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } else if (markError) {
      setError(markError)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return

    const { success, error: markError } = await notificationService.markAllNotificationsAsRead(user.id)
    
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } else if (markError) {
      setError(markError)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const { success, error: deleteError } = await notificationService.deleteNotification(notificationId)
    
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId)
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } else if (deleteError) {
      setError(deleteError)
    }
  }

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return

    fetchNotifications()

    const subscription = notificationService.subscribeToNotifications(
      user.id,
      (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        if (!newNotification.read) {
          setUnreadCount(prev => prev + 1)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  }
}

export function useNotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_jobs: true,
    email_application_updates: true,
    email_deadline_reminders: true,
    email_application_received: true,
    in_app_notifications: true
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch notification preferences
  const fetchPreferences = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        setError(fetchError.message)
      } else if (data) {
        setPreferences({
          email_new_jobs: data.email_new_jobs,
          email_application_updates: data.email_application_updates,
          email_deadline_reminders: data.email_deadline_reminders,
          email_application_received: data.email_application_received,
          in_app_notifications: data.in_app_notifications
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    setLoading(false)
  }

  // Update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }

    try {
      const updatedPreferences = { ...preferences, ...newPreferences }
      
      const { error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updatedPreferences
        })

      if (upsertError) {
        setError(upsertError.message)
        return { success: false, error: upsertError.message }
      }

      setPreferences(updatedPreferences)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [user?.id])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences
  }
}