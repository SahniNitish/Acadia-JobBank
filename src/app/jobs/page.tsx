'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { JobSearchFilters } from '@/components/jobs/job-search-filters'
import { JobListingGrid } from '@/components/jobs/job-listing-grid'
import { SavedSearchManager } from '@/components/jobs/saved-search-manager'
import { SearchSuggestions } from '@/components/jobs/search-suggestions'
import { JobRecommendations } from '@/components/jobs/job-recommendations'
import { useJobPostings } from '@/hooks/use-jobs'
import { useAuth } from '@/contexts/auth-context'
import { JobPostingFilters } from '@/lib/jobs'
import { recordSearchHistory } from '@/lib/saved-searches'

export default function JobsPage() {
  const [searchFilters, setSearchFilters] = useState<JobSearchFilters>({
    search: '',
    department: '',
    jobType: '',
    deadlineFrom: '',
    deadlineTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [appliedFilters, setAppliedFilters] = useState<JobPostingFilters>({
    is_active: true
  })
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  
  const { user, profile } = useAuth()
  const router = useRouter()

  const { 
    jobPostings, 
    totalCount, 
    totalPages, 
    isLoading, 
    error, 
    refetch 
  } = useJobPostings(appliedFilters, currentPage, 12)

  const handleSearch = async () => {
    const filters: JobPostingFilters = {
      is_active: true
    }

    if (searchFilters.search.trim()) {
      filters.search = searchFilters.search.trim()
    }

    if (searchFilters.department) {
      filters.department = searchFilters.department
    }

    if (searchFilters.jobType) {
      filters.job_type = searchFilters.jobType as any
    }

    if (searchFilters.deadlineFrom) {
      filters.deadline_from = searchFilters.deadlineFrom
    }

    if (searchFilters.deadlineTo) {
      filters.deadline_to = searchFilters.deadlineTo
    }

    // Always apply sorting
    filters.sort_by = searchFilters.sortBy
    filters.sort_order = searchFilters.sortOrder

    setAppliedFilters(filters)
    setCurrentPage(1)

    // Record search history if user is logged in and has search query
    if (user && searchFilters.search.trim()) {
      try {
        await recordSearchHistory(
          user.id,
          searchFilters.search.trim(),
          {
            department: searchFilters.department,
            job_type: searchFilters.jobType,
            deadline_from: searchFilters.deadlineFrom,
            deadline_to: searchFilters.deadlineTo
          },
          0 // Will be updated after we get results
        )
      } catch (error) {
        console.error('Failed to record search history:', error)
      }
    }
  }

  const handleApply = (jobId: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/jobs')
      return
    }

    if (profile?.role !== 'student') {
      // Show error or redirect
      return
    }

    router.push(`/jobs/${jobId}/apply`)
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleSelectSuggestion = (query: string) => {
    setSearchFilters(prev => ({ ...prev, search: query }))
  }

  const handleLoadSavedSearch = (filters: JobSearchFilters) => {
    setSearchFilters(filters)
  }

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchFilters.search, searchFilters.sortBy, searchFilters.sortOrder])

  // Immediate search when other filters change
  useEffect(() => {
    handleSearch()
  }, [searchFilters.department, searchFilters.jobType, searchFilters.deadlineFrom, searchFilters.deadlineTo])

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Job Opportunities</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover job opportunities at Acadia University
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <JobSearchFilters
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          <JobListingGrid
            jobs={jobPostings}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            onApply={handleApply}
            showApplyButton={profile?.role === 'student'}
          />
        </div>

        {/* Sidebar - Hidden on mobile, shown as collapsible section */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-first lg:order-last">
          {/* Job Recommendations for Students */}
          {profile?.role === 'student' && (
            <JobRecommendations
              onApply={handleApply}
              onViewJob={handleViewJob}
              limit={3}
            />
          )}

          {/* Search Suggestions */}
          <div className="hidden sm:block">
            <SearchSuggestions
              onSelectSuggestion={handleSelectSuggestion}
              currentQuery={searchFilters.search}
            />
          </div>

          {/* Saved Searches */}
          {user && (
            <div className="hidden sm:block">
              <SavedSearchManager
                currentFilters={searchFilters}
                onLoadSearch={handleLoadSavedSearch}
                onSaveSearch={() => {
                  // Optionally show a success message
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}