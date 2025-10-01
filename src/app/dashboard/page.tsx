'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { FacultyDashboard, StudentDashboard, AdminDashboard } from '@/components/dashboard'
import { NotificationBell } from '@/components/notifications'

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="px-4 py-4 sm:py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Welcome, {profile.full_name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 capitalize">
                {profile.role} • {profile.department}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <NotificationBell />
              <Button onClick={handleSignOut} variant="outline" size="sm" className="sm:size-default">
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Role-specific Dashboard Content */}
        <div className="px-4 py-4 sm:py-6 sm:px-0">
          {profile.role === 'faculty' && <FacultyDashboard />}
          {profile.role === 'student' && <StudentDashboard />}
          {profile.role === 'admin' && <AdminDashboard />}
        </div>
      </div>
    </div>
  )
}