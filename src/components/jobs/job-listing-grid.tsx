'use client'

import { JobCard } from './job-card'
import { Button } from '@/components/ui/button'
import { JobPosting } from '@/types/database'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface JobListingGridProps {
  jobs: (JobPosting & {
    profiles?: {
      id: string
      full_name: string
      department: string
      role: string
    }
  })[]
  isLoading?: boolean
  error?: string | null
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onApply?: (jobId: string) => void
  showApplyButton?: boolean
  emptyMessage?: string
}

export function JobListingGrid({
  jobs,
  isLoading = false,
  error,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onApply,
  showApplyButton = true,
  emptyMessage = "No job postings found. Try adjusting your search criteria."
}: JobListingGridProps) {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Error loading jobs</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading jobs...</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">{emptyMessage}</div>
      </div>
    )
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalCount)

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Showing {startItem}-{endItem} of {totalCount} jobs
        </div>
      </div>

      {/* Job Grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        role="region"
        aria-label="Job listings"
        aria-describedby="job-count"
      >
        <div id="job-count" className="sr-only">
          {totalCount} job postings found
        </div>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            showApplyButton={showApplyButton}
            onApply={onApply}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav role="navigation" aria-label="Job listings pagination" className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Mobile Pagination */}
          <div className="flex items-center space-x-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Go to previous page (page ${currentPage - 1})`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </Button>
            
            <span className="text-sm text-muted-foreground px-2" aria-current="page">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Go to next page (page ${currentPage + 1})`}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Go to previous page (page ${currentPage - 1})`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>

            <div className="flex items-center space-x-1" role="group" aria-label="Page numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                const isCurrentPage = currentPage === pageNum

                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-8 h-8 p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={isCurrentPage ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Go to next page (page ${currentPage + 1})`}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}