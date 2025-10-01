'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApplicationWithDetails } from '@/lib/applications'
import { Application } from '@/types/database'
import { 
  Calendar, 
  User, 
  FileText, 
  Search, 
  Filter,
  Eye,
  Download,
  Clock
} from 'lucide-react'

interface ApplicationListProps {
  applications: ApplicationWithDetails[]
  onViewApplication: (application: ApplicationWithDetails) => void
  onUpdateStatus?: (applicationId: string, status: Application['status']) => void
  showJobInfo?: boolean
  isLoading?: boolean
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

export function ApplicationList({ 
  applications, 
  onViewApplication, 
  onUpdateStatus,
  showJobInfo = false,
  isLoading = false 
}: ApplicationListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.applicant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (showJobInfo && app.job_posting.title.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      } else {
        return a.status.localeCompare(b.status)
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getResumeFileName = (url?: string) => {
    if (!url) return null
    return url.split('/').pop()?.split('.')[0] || 'Resume'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              {showJobInfo 
                ? "You haven't submitted any applications yet." 
                : "No applications have been received for your job postings."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Applications ({applications.length})
          </CardTitle>
          <CardDescription>
            {showJobInfo 
              ? "Track the status of your job applications" 
              : "Manage applications for your job postings"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={showJobInfo ? "Search by job title or company..." : "Search by applicant name..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Under Review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'date' | 'status') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="status">Sort by Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{application.applicant.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {application.applicant.department}
                          {application.applicant.year_of_study && 
                            ` • Year ${application.applicant.year_of_study}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={`ml-auto sm:ml-0 ${statusColors[application.status]}`}>
                      {statusLabels[application.status]}
                    </Badge>
                  </div>

                  {showJobInfo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Applied for:</span>
                      <span>{application.job_posting.title}</span>
                      <span>•</span>
                      <span>{application.job_posting.department}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Applied {formatDate(application.applied_at)}</span>
                    </div>
                    
                    {application.resume_url && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>Resume attached</span>
                      </div>
                    )}

                    {application.updated_at !== application.applied_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatDate(application.updated_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground line-clamp-2">
                      {application.cover_letter.substring(0, 150)}
                      {application.cover_letter.length > 150 && '...'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-48">
                  <Button
                    onClick={() => onViewApplication(application)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>

                  {application.resume_url && (
                    <Button
                      onClick={() => window.open(application.resume_url, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Resume
                    </Button>
                  )}

                  {onUpdateStatus && (
                    <Select
                      value={application.status}
                      onValueChange={(status: Application['status']) => 
                        onUpdateStatus(application.id, status)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Under Review</SelectItem>
                        <SelectItem value="accepted">Accept</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && applications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matching Applications</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}