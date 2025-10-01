'use client'

import { useState } from 'react'
import { Save, Mail, Bell, Clock, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useNotificationPreferences } from '@/hooks/use-notifications'
import { useAuth } from '@/contexts/auth-context'

export function NotificationPreferences() {
  const { user } = useAuth()
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    setSaving(true)
    setSaveMessage(null)

    const result = await updatePreferences({ [key]: value })
    
    if (result.success) {
      setSaveMessage('Preferences saved successfully')
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage(`Error: ${result.error}`)
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription className="text-red-500">
            Error loading preferences: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about job-related activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                In-App Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the application
              </p>
            </div>
            <Switch
              checked={preferences.in_app_notifications}
              onCheckedChange={(checked: boolean) => 
                handlePreferenceChange('in_app_notifications', checked)
              }
              disabled={saving}
            />
          </div>
        </div>

        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Mail className="h-4 w-4" />
            <Label className="text-base font-medium">Email Notifications</Label>
          </div>

          {/* New Job Notifications */}
          <div className="flex items-center justify-between pl-6">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-3 w-3" />
                New Job Opportunities
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when new jobs are posted that match your interests
              </p>
            </div>
            <Switch
              checked={preferences.email_new_jobs}
              onCheckedChange={(checked: boolean) => 
                handlePreferenceChange('email_new_jobs', checked)
              }
              disabled={saving}
            />
          </div>

          {/* Application Updates (for students) */}
          {user?.user_metadata?.role === 'student' && (
            <div className="flex items-center justify-between pl-6">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Application Status Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when your application status changes
                </p>
              </div>
              <Switch
                checked={preferences.email_application_updates}
                onCheckedChange={(checked: boolean) => 
                  handlePreferenceChange('email_application_updates', checked)
                }
                disabled={saving}
              />
            </div>
          )}

          {/* Application Received (for faculty) */}
          {user?.user_metadata?.role === 'faculty' && (
            <div className="flex items-center justify-between pl-6">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">New Applications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when students apply to your job postings
                </p>
              </div>
              <Switch
                checked={preferences.email_application_received}
                onCheckedChange={(checked: boolean) => 
                  handlePreferenceChange('email_application_received', checked)
                }
                disabled={saving}
              />
            </div>
          )}

          {/* Deadline Reminders */}
          <div className="flex items-center justify-between pl-6">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Deadline Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get reminded about approaching application deadlines
              </p>
            </div>
            <Switch
              checked={preferences.email_deadline_reminders}
              onCheckedChange={(checked: boolean) => 
                handlePreferenceChange('email_deadline_reminders', checked)
              }
              disabled={saving}
            />
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`text-sm p-3 rounded-md ${
            saveMessage.startsWith('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">Note:</p>
          <p>
            Changes are saved automatically. Email notifications will be sent to your registered email address: {user?.email}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}