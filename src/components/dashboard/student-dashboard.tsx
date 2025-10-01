'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useJobPostings } from '@/hooks/use-jobs'
import { useApplications } from '@/hooks/use-applications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, BookmarkPlus, Clock, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import { JobPosting } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface StudentDashboardProps {
  className?: string
}

export function StudentDashboard({ className }: StudentDashboardProps) {
  const { profile } = useAuth()
  const { jobPostings: allJobs, isLoading: jobsLoading } = useJobPostings({ is_active: true }, 1, 20)
  const { applications, fetchUserApplications, isLoading: appsLoading } = useApplications()
  const [recommendedJobs, setRecommendedJobs] = useState<JobPosting[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<JobPosting[]>([])

  // Fetch user applications on mount
  useEffect(() => {
    if (profile?.id) {
      fetchUserApplications(profile.id)
    }
  }, [profile?.id, fetchUserApplications])

  // Filter jobs for recommendations and deadlines
  useEffect(() => {
    if (!allJobs.length || !profile) return

    // Get jobs in the same department as the student
    const departmentJobs = allJobs.filter(job => 
      job.department === profile.department && job.is_active
    )

    // Get jobs with upcoming deadlines (within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const jobsWithDeadlines = allJobs.filter(job => {
      if (!job.application_deadline) return false
      const deadline = new Date(job.application_deadline)
      return deadline > now && deadline <= sevenDaysFromNow
    })

    // Filter out jobs the student has already applied to
    const appliedJobIds = new Set(applications.map(app => app.job_id))
    
    const filteredRecommended = departmentJobs
      .filter(job => !appliedJobIds.has(job.id))
      .slice(0, 6)
    
    const filteredDeadlines = jobsWithDeadlines
      .filter(job => !appliedJobIds.has(job.id))
      .sort((a, b) => new Date(a.application_deadline!).getTime() - new Date(b.application_deadline!).getTime())
      .slice(0, 5)

    setRecommendedJobs(filteredRecommended)
    setUpcomingDeadlines(filteredDeadlines)
  }, [allJobs, applications, profile])

  if (jobsLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const pendingApplications = applications.filter(app => app.status === 'pending')
  const acceptedApplications = applications.filter(app => app.status === 'accepted')
  const recentApplications = applications.slice(0, 5)

  return (
    <div className={className}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Available Jobs</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{allJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {recommendedJobs.length} in your dept
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">My Applications</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingApplications.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Accepted</CardTitle>
            <BookmarkPlus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{acceptedApplications.length}</div>
            <p className="text-xs text-muted-foreground">
              Applications accepted
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Quick Actions</CardTitle>
            <Search className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/jobs">
              <Button className="w-full" size="sm">
                Browse Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recommended Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recommended for You</CardTitle>
            <CardDescription>
              Jobs in {profile?.department || 'your department'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendedJobs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No recommendations available</p>
                <Link href="/jobs">
                  <Button>Browse All Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recommendedJobs.map((job) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{job.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {job.department} • {job.job_type.replace('_', ' ')}
                      </p>
                      {job.compensation && (
                        <p className="text-xs text-muted-foreground">
                          {job.compensation}
                        </p>
                      )}
                      {job.application_deadline && (
                        <p className="text-xs text-muted-foreground">
                          Deadline: {formatDistanceToNow(new Date(job.application_deadline), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {job.job_type.replace('_', ' ')}
                      </Badge>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {recommendedJobs.length === 6 && (
                  <div className="text-center pt-2">
                    <Link href={`/jobs?department=${profile?.department}`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        View More in {profile?.department}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Application History</CardTitle>
            <CardDescription>
              Your recent job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No applications yet</p>
                <Link href="/jobs">
                  <Button>Find Your First Job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{application.job_posting?.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {application.job_posting?.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge 
                        variant={
                          application.status === 'pending' ? "secondary" :
                          application.status === 'accepted' ? "default" :
                          application.status === 'rejected' ? "destructive" : "outline"
                        }
                        className="text-xs"
                      >
                        {application.status}
                      </Badge>
                      <Link href={`/jobs/${application.job_id}`}>
                        <Button variant="outline" size="sm">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {applications.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/applications">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        View All Applications
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription className="text-blue-700">
              These job applications close within the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDeadlines.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.department} • Deadline: {formatDistanceToNow(new Date(job.application_deadline!), { addSuffix: true })}
                    </p>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm">
                      Apply Now
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