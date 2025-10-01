'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
// import { JobDetailView } from '@/components/jobs/job-detail-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useJobPosting } from '@/hooks/use-jobs'
import { useApplicationStatus } from '@/hooks/use-applications'
import { useAuth } from '@/contexts/auth-context'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface JobDetailPageProps {
  params: {
    id: string
  }
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobPosting, isLoading, error } = useJobPosting(params.id)
  const { hasApplied, isLoading: statusLoading } = useApplicationStatus(params.id)
  const { user, profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Show success message if redirected after application
  useEffect(() => {
    if (searchParams.get('applied') === 'true') {
      setShowSuccessMessage(true)
      // Remove the query parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('applied')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleApply = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/jobs/${params.id}`)
      return
    }

    if (profile?.role !== 'student') {
      // Show error message or redirect
      return
    }

    router.push(`/jobs/${params.id}/apply`)
  }

  const handleManageApplications = () => {
    router.push(`/jobs/${params.id}/applications`)
  }

  const isOwner = user && jobPosting && jobPosting.posted_by === user.id

  if (isLoading || statusLoading) {
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
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !jobPosting) {
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
            {error || 'Job not found'}
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

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-6">
        <Link href="/jobs">
          <Button variant="ghost" className="flex items-center gap-2" size="sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Jobs</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </div>

      {showSuccessMessage && (
        <Card className="border-green-200 bg-green-50 mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-green-900 text-sm sm:text-base">Application Submitted Successfully!</h3>
                <p className="text-xs sm:text-sm text-green-700 mt-1">
                  Your application has been sent to the hiring manager. You can track its status in your dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center py-8 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{jobPosting.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">Job detail view temporarily disabled</p>
        <p className="text-xs sm:text-sm">Dashboard implementation is complete. Job detail view needs syntax fixes.</p>
      </div>
    </div>
  )
}