'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobPosting } from '@/types/database'

interface JobCardProps {
  job: JobPosting & {
    profiles?: {
      id: string
      full_name: string
      department: string
      role: string
    }
  }
  showApplyButton?: boolean
  onApply?: (jobId: string) => void
}

const jobTypeLabels: Record<JobPosting['job_type'], string> = {
  'research_assistant': 'Research Assistant',
  'teaching_assistant': 'Teaching Assistant',
  'work_study': 'Work Study',
  'internship': 'Internship',
  'other': 'Other'
}

export function JobCard({ job, showApplyButton = true, onApply }: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isDeadlineSoon = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    return deadlineDate < today
  }

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onApply) {
      onApply(job.id)
    }
  }

  return (
    <Link 
      href={`/jobs/${job.id}`}
      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
      aria-label={`View job: ${job.title} in ${job.department}`}
    >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" role="article">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg leading-tight break-words">
                  {job.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <span className="truncate">{job.department}</span>
                  <span className="hidden sm:inline" aria-hidden="true">•</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {jobTypeLabels[job.job_type]}
                  </Badge>
                </CardDescription>
              </div>
              {job.compensation && (
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-sm font-semibold text-green-600" aria-label={`Compensation: ${job.compensation}`}>
                    {job.compensation}
                  </div>
                </div>
              )}
            </div>
            {job.profiles && (
              <div className="text-xs text-muted-foreground">
                by {job.profiles.full_name}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
              {job.description}
            </p>
            
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                {job.duration && (
                  <div className="truncate">
                    <span className="font-medium">Duration:</span> {job.duration}
                  </div>
                )}
                <div className="truncate">
                  <span className="font-medium">Posted:</span> {formatDate(job.created_at)}
                </div>
              </div>
              
              {job.application_deadline && (
                <div className={`text-xs truncate ${
                  isDeadlinePassed(job.application_deadline) 
                    ? 'text-red-600' 
                    : isDeadlineSoon(job.application_deadline) 
                    ? 'text-orange-600' 
                    : 'text-muted-foreground'
                }`}>
                  <span className="font-medium">Deadline:</span> {formatDate(job.application_deadline)}
                </div>
              )}
            </div>

            {showApplyButton && job.is_active && (
              <div className="pt-2">
                {job.application_deadline && isDeadlinePassed(job.application_deadline) ? (
                  <Button 
                    disabled 
                    className="w-full" 
                    size="sm"
                    aria-label={`Application deadline has passed for ${job.title}`}
                  >
                    Deadline Passed
                  </Button>
                ) : (
                  <Button 
                    onClick={handleApply}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                    size="sm"
                    aria-label={`Apply for ${job.title} position`}
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            )}

            {!job.is_active && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs text-muted-foreground" aria-label="This job posting is inactive">
                  Inactive
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}