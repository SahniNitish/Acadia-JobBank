'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ApplicationList, ApplicationDetailView } from '@/components/applications'
import { Button } from '@/components/ui/button'
import { useJobPosting } from '@/hooks/use-jobs'
import { useApplications } from '@/hooks/use-applications'
import { useAuth } from '@/contexts/auth-context'
import { ApplicationWithDetails } from '@/lib/applications'
import { Application } from '@/types/database'
import { ArrowLeft } from 'lucide-react'

interface JobApplicationsPageProps {
  params: {
    id: string
  }
}

export default function JobApplicationsPage({ params }: JobApplicationsPageProps) {
  const { jobPosting, isLoading: jobLoading, error: jobError } = useJobPosting(params.id)
  const { applications, isLoading, error, fetchJobApplications, updateStatus } = useApplications()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Redirect if not authenticated or not faculty
  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${params.id}/applications`)
      return
    }

    if (profile && profile.role !== 'faculty') {
      router.push(`/jobs/${params.id}`)
      return
    }
  }, [user, profile, router, params.id])

  // Check if user owns this job
  useEffect(() => {
    if (jobPosting && user && jobPosting.posted_by !== user.id) {
      router.push(`/jobs/${params.id}`)
      return
    }
  }, [jobPosting, user, router, params.id])

  // Fetch applications when component mounts
  useEffect(() => {
    if (params.id) {
      fetchJobApplications(params.id)
    }
  }, [params.id, fetchJobApplications])

  const handleViewApplication = (application: ApplicationWithDetails) => {
    setSelectedApplication(application)
  }

  const handleUpdateStatus = async (applicationId: string, status: Application['status']) => {
    setIsUpdating(true)
    try {
      await updateStatus(applicationId, status)
      // Update selected application if it's the one being updated
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication({
          ...selectedApplication,
          status,
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to update application status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBack = () => {
    setSelectedApplication(null)
  }

  if (jobLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/jobs/${params.id}`}>
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Job Details
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (jobError || !jobPosting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/jobs">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">
            {jobError || 'Job not found'}
          </div>
          <Link href="/jobs">
            <Button variant="outline">
              Browse Other Jobs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (selectedApplication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ApplicationDetailView
          application={selectedApplication}
          onUpdateStatus={(status) => handleUpdateStatus(selectedApplication.id, status)}
          onBack={handleBack}
          isUpdating={isUpdating}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/jobs/${params.id}`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Applications for &ldquo;{jobPosting.title}&rdquo;</h1>
        <p className="text-muted-foreground">
          Manage applications received for this position in {jobPosting.department}.
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
        onUpdateStatus={handleUpdateStatus}
        isLoading={isLoading}
      />
    </div>
  )
}