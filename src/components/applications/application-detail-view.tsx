'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApplicationWithDetails } from '@/lib/applications'
import { Application } from '@/types/database'
import { 
  Calendar, 
  User, 
  FileText, 
  Download,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Clock,
  ArrowLeft
} from 'lucide-react'

interface ApplicationDetailViewProps {
  application: ApplicationWithDetails
  onUpdateStatus?: (status: Application['status']) => void
  onBack?: () => void
  showJobInfo?: boolean
  isUpdating?: boolean
}

const statusColors: Record<Application['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
}

const statusLabels: Record<Application['status'], string> = {
  pending: 'Pending Review',
  reviewed: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected'
}

export function ApplicationDetailView({ 
  application, 
  onUpdateStatus,
  onBack,
  showJobInfo = false,
  isUpdating = false
}: ApplicationDetailViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getResumeFileName = (url?: string) => {
    if (!url) return null
    const fileName = url.split('/').pop()
    return fileName?.split('.')[0] || 'Resume'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 flex-1">
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBack}
                  className="mb-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
              )}
              
              <CardTitle className="text-2xl">Application Details</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-base">
                <Badge className={statusColors[application.status]}>
                  {statusLabels[application.status]}
                </Badge>
                <span>•</span>
                <span>Applied {formatDate(application.applied_at)}</span>
                {application.updated_at !== application.applied_at && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(application.updated_at)}</span>
                  </>
                )}
              </CardDescription>
            </div>
            
            {onUpdateStatus && (
              <div className="flex flex-col gap-2">
                <Select
                  value={application.status}
                  onValueChange={onUpdateStatus}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Under Review</SelectItem>
                    <SelectItem value="accepted">Accept Application</SelectItem>
                    <SelectItem value="rejected">Reject Application</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdating && (
                  <div className="text-xs text-muted-foreground text-center">
                    Updating status...
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Information (if showing) */}
          {showJobInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Position Applied For</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{application.job_posting.title}</h3>
                  <p className="text-muted-foreground">{application.job_posting.department}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Posted By</div>
                    <div className="text-sm text-muted-foreground">
                      {application.job_posting.profiles.full_name}
                    </div>
                  </div>
                </div>

                {application.job_posting.compensation && (
                  <div className="text-sm">
                    <span className="font-medium">Compensation:</span> {application.job_posting.compensation}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {application.cover_letter}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div className="text-sm text-muted-foreground">
                    {application.applicant.full_name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">
                    {application.applicant.email}
                  </div>
                </div>
              </div>

              {application.applicant.department && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Department</div>
                    <div className="text-sm text-muted-foreground">
                      {application.applicant.department}
                    </div>
                  </div>
                </div>
              )}

              {application.applicant.year_of_study && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Year of Study</div>
                    <div className="text-sm text-muted-foreground">
                      Year {application.applicant.year_of_study}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Role</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {application.applicant.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          {application.resume_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {getResumeFileName(application.resume_url)}.pdf
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Resume document
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => window.open(application.resume_url, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <div className="text-sm font-medium">Application Submitted</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(application.applied_at)}
                    </div>
                  </div>
                </div>

                {application.updated_at !== application.applied_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <div className="text-sm font-medium">Status Updated</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(application.updated_at)}
                      </div>
                      <div className="text-xs">
                        <Badge className={`${statusColors[application.status]} text-xs`}>
                          {statusLabels[application.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}