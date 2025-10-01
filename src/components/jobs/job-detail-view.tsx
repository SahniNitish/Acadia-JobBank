'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobPosting } from '@/types/database'
import { Calendar, Clock, DollarSign, MapPin, User, Briefcase } from 'lucide-react'

interface JobDetailViewProps {
  job: JobPosting & {
    profiles?: {
      id: string
      full_name: string
      department: string
      role: string
    }
  }
  onApply?: () => void
  onManageApplications?: () => void
  showApplyButton?: boolean
  showManageButton?: boolean
  isLoading?: boolean
  hasApplied?: boolean
  applicationCount?: number
}

const jobTypeLabels: Record<JobPosting['job_type'], string> = {
  'research_assistant': 'Research Assistant',
  'teaching_assistant': 'Teaching Assistant',
  'work_study': 'Work Study',
  'internship': 'Internship',
  'other': 'Other'
}

export function JobDetailView({
  job,
  onApply,
  onManageApplications,
  showApplyButton = true,
  showManageButton = false,
  isLoading = false,
  hasApplied = false,
  applicationCount = 0
}: JobDetailViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    return deadlineDate < today
  }

  const isDeadlineSoon = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const canApply = job.is_active && 
    (!job.application_deadline || !isDeadlinePassed(job.application_deadline)) &&
    !hasApplied

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-base">
                <Badge variant="secondary" className="text-sm">
                  {jobTypeLabels[job.job_type]}
                </Badge>
                <span>•</span>
                <span>{job.department}</span>
                {job.profiles && (
                  <>
                    <span>•</span>
                    <span>Posted by {job.profiles.full_name}</span>
                  </>
                )}
              </CardDescription>
            </div>
            
            {(showApplyButton || showManageButton) && (
              <div className="flex flex-col gap-2">
                {showManageButton && (
                  <Button 
                    onClick={onManageApplications}
                    variant="outline"
                    className="lg:w-48"
                  >
                    Manage Applications ({applicationCount})
                  </Button>
                )}
                
                {showApplyButton && (
                  <>
                    {hasApplied ? (
                      <Button disabled className="lg:w-40">
                        Already Applied
                      </Button>
                    ) : !job.is_active ? (
                      <Button disabled className="lg:w-40">
                        Position Closed
                      </Button>
                    ) : job.application_deadline && isDeadlinePassed(job.application_deadline) ? (
                      <Button disabled className="lg:w-40">
                        Deadline Passed
                      </Button>
                    ) : (
                      <Button 
                        onClick={onApply}
                        disabled={isLoading}
                        className="lg:w-40"
                      >
                        {isLoading ? 'Applying...' : 'Apply Now'}
                      </Button>
                    )}
                    
                    {job.application_deadline && canApply && isDeadlineSoon(job.application_deadline) && (
                      <div className="text-xs text-orange-600 text-center">
                        Deadline approaching!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {job.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {job.requirements}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Job Type</div>
                  <div className="text-sm text-muted-foreground">
                    {jobTypeLabels[job.job_type]}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Department</div>
                  <div className="text-sm text-muted-foreground">{job.department}</div>
                </div>
              </div>

              {job.compensation && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Compensation</div>
                    <div className="text-sm text-muted-foreground">{job.compensation}</div>
                  </div>
                </div>
              )}

              {job.duration && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">{job.duration}</div>
                  </div>
                </div>
              )}

              {job.application_deadline && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Application Deadline</div>
                    <div className={`text-sm ${
                      isDeadlinePassed(job.application_deadline) 
                        ? 'text-red-600' 
                        : isDeadlineSoon(job.application_deadline) 
                        ? 'text-orange-600' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatDate(job.application_deadline)}
                    </div>
                  </div>
                </div>
              )}

              {job.profiles && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Posted By</div>
                    <div className="text-sm text-muted-foreground">
                      {job.profiles.full_name}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Posted On</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(job.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!job.is_active && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Position Closed
                  </Badge>
                  <p className="text-sm text-orange-600 mt-2">
                    This position is no longer accepting applications.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}