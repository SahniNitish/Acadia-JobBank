'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ApplicationList, ApplicationDetailView } from '@/components/applications'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/use-applications'
import { useAuth } from '@/contexts/auth-context'
import { ApplicationWithDetails } from '@/lib/applications'
import { ArrowLeft } from 'lucide-react'

export default function ApplicationsPage() {
  const { applications, isLoading, error, fetchUserApplications } = useApplications()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null)

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/applications')
      return
    }

    if (profile && profile.role !== 'student') {
      router.push('/dashboard')
      return
    }
  }, [user, profile, router])

  // Fetch user applications when component mounts
  useEffect(() => {
    if (user) {
      fetchUserApplications()
    }
  }, [user, fetchUserApplications])

  const handleViewApplication = (application: ApplicationWithDetails) => {
    setSelectedApplication(application)
  }

  const handleBack = () => {
    setSelectedApplication(null)
  }

  if (selectedApplication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ApplicationDetailView
          application={selectedApplication}
          onBack={handleBack}
          showJobInfo={true}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of your job applications and view application details.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <ApplicationList
        applications={applications}
        onViewApplication={handleViewApplication}
        showJobInfo={true}
        isLoading={isLoading}
      />
    </div>
  )
}