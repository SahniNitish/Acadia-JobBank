'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ApplicationForm, ApplicationFormData } from '@/components/applications'
import { Button } from '@/components/ui/button'
import { useJobPosting } from '@/hooks/use-jobs'
import { useApplications, useApplicationStatus } from '@/hooks/use-applications'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ApplyPageProps {
  params: {
    id: string
  }
}

export default function ApplyPage({ params }: ApplyPageProps) {
  const { jobPosting, isLoading: jobLoading, error: jobError } = useJobPosting(params.id)
  const { hasApplied, isLoading: statusLoading } = useApplicationStatus(params.id)
  const { submitApplication, isLoading: submitting } = useApplications()
  const { user, profile } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${params.id}/apply`)
      return
    }

    if (profile && profile.role !== 'student') {
      router.push(`/jobs/${params.id}`)
      return
    }
  }, [user, profile, router, params.id])

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      await submitApplication({
        jobId: params.id,
        coverLetter: data.coverLetter,
        resumeFile: data.resumeFile
      })
      
      // Redirect to job detail page with success message
      router.push(`/jobs/${params.id}?applied=true`)
    } catch (error) {
      // Error is handled by the hook and displayed in the form
      console.error('Application submission failed:', error)
    }
  }

  const handleCancel = () => {
    router.push(`/jobs/${params.id}`)
  }

  if (jobLoading || statusLoading) {
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

  if (hasApplied) {
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
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Application Already Submitted
              </h2>
              <p className="text-green-700 mb-4">
                You have already applied for this position. You can view your application status in your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button>View Dashboard</Button>
                </Link>
                <Link href={`/jobs/${params.id}`}>
                  <Button variant="outline">Back to Job Details</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <ApplicationForm
        job={jobPosting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  )
}