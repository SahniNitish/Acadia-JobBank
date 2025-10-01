'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JobPosting } from '@/types/database'

interface JobPostingPreviewData {
  title: string
  description: string
  requirements: string
  compensation: string
  jobType: JobPosting['job_type'] | ''
  department: string
  duration: string
  applicationDeadline: string
}

interface JobPostingPreviewProps {
  data: JobPostingPreviewData
  onEdit?: () => void
  onConfirm?: () => void
  isLoading?: boolean
}

const jobTypeLabels: Record<JobPosting['job_type'], string> = {
  'research_assistant': 'Research Assistant',
  'teaching_assistant': 'Teaching Assistant',
  'work_study': 'Work Study',
  'internship': 'Internship',
  'other': 'Other'
}

export function JobPostingPreview({ 
  data, 
  onEdit, 
  onConfirm, 
  isLoading = false 
}: JobPostingPreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl">{data.title || 'Untitled Job'}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span>{data.department || 'No Department'}</span>
                {data.jobType && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">
                      {jobTypeLabels[data.jobType as JobPosting['job_type']]}
                    </Badge>
                  </>
                )}
              </CardDescription>
            </div>
            {data.compensation && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Compensation</div>
                <div className="font-semibold">{data.compensation}</div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.description && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.description}
              </div>
            </div>
          )}

          {data.requirements && (
            <div>
              <h4 className="font-semibold mb-2">Requirements</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.requirements}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            {data.duration && (
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-sm text-muted-foreground">{data.duration}</div>
              </div>
            )}
            {data.applicationDeadline && (
              <div>
                <div className="text-sm font-medium">Application Deadline</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(data.applicationDeadline)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(onEdit || onConfirm) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {onEdit && (
            <Button 
              variant="outline" 
              onClick={onEdit}
              disabled={isLoading}
              className="flex-1"
            >
              Edit
            </Button>
          )}
          {onConfirm && (
            <Button 
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Publishing...' : 'Confirm & Publish'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}