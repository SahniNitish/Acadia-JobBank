'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useFacultyJobs } from '@/hooks/use-jobs'
import { useApplications } from '@/hooks/use-applications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { JobPosting, Application } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface FacultyDashboardProps {
  className?: string
}

export function FacultyDashboard({ className }: FacultyDashboardProps) {
  const { profile } = useAuth()
  const { jobPostings, stats, isLoading: jobsLoading, error: jobsError } = useFacultyJobs(profile?.id || null, true)
  const { applications, fetchJobApplications, isLoading: appsLoading } = useApplications()
  const [recentApplications, setRecentApplications] = useState<any[]>([])

  // Fetch recent applications for all faculty jobs
  useEffect(() => {
    const fetchRecentApps = async () => {
      if (!jobPostings.length) return

      try {
        // Get applications for all faculty jobs
        const allApplications: any[] = []
        for (const job of jobPostings) {
          const { data } = await supabase
            .from('applications')
            .select(`
              *,
              applicant:profiles!applications_applicant_id_fkey(full_name, email),
              job_posting:job_postings!applications_job_id_fkey(title)
            `)
            .eq('job_id', job.id)
            .order('applied_at', { ascending: false })
            .limit(5)

          if (data) {
            allApplications.push(...data)
          }
        }

        // Sort by most recent and take top 5
        const sortedApps = allApplications
          .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
          .slice(0, 5)

        setRecentApplications(sortedApps)
      } catch (error) {
        console.error('Error fetching recent applications:', error)
      }
    }

    fetchRecentApps()
  }, [jobPostings])

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (jobsError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Error loading dashboard: {jobsError}</p>
      </div>
    )
  }

  const activeJobs = jobPostings.filter(job => job.is_active)
  const expiringSoonJobs = activeJobs.filter(job => {
    if (!job.application_deadline) return false
    const deadline = new Date(job.application_deadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0
  })

  const totalApplications = jobPostings.reduce((sum, job) => sum + (job.application_count || 0), 0)
  const pendingApplications = recentApplications.filter(app => app.status === 'pending').length

  return (
    <div className={className}>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalJobs} total postings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {pendingApplications} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoonJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/jobs/create">
              <Button className="w-full" size="sm">
                Post New Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Postings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Postings</CardTitle>
            <CardDescription>
              Your latest job postings and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeJobs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No active job postings</p>
                <Link href="/jobs/create">
                  <Button>Create Your First Job Posting</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.department} • {job.application_count || 0} applications
                      </p>
                      {job.application_deadline && (
                        <p className="text-xs text-muted-foreground">
                          Deadline: {formatDistanceToNow(new Date(job.application_deadline), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {activeJobs.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/jobs?posted_by=me">
                      <Button variant="outline" size="sm">
                        View All Jobs
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              Latest applications to your job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{application.applicant.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Applied for: {application.job_posting.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          application.status === 'pending' ? "secondary" :
                          application.status === 'accepted' ? "default" :
                          application.status === 'rejected' ? "destructive" : "outline"
                        }
                      >
                        {application.status}
                      </Badge>
                      <Link href={`/jobs/${application.job_id}/applications`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Jobs Alert */}
      {expiringSoonJobs.length > 0 && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Jobs Expiring Soon
            </CardTitle>
            <CardDescription className="text-orange-700">
              These job postings will close within the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringSoonJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Expires: {formatDistanceToNow(new Date(job.application_deadline!), { addSuffix: true })}
                    </p>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}