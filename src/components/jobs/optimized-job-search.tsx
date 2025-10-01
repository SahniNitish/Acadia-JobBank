'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JobCard } from '@/components/jobs/job-card'
import { LoadingState, JobListSkeleton } from '@/components/ui/loading-states'
import { useDebounce, useVirtualScrolling, usePerformanceMonitor } from '@/lib/performance'
import { JobPosting } from '@/types/database'
import { Search, Filter, X } from 'lucide-react'

interface OptimizedJobSearchProps {
  jobs: JobPosting[]
  loading?: boolean
  onSearch?: (query: string, filters: SearchFilters) => void
}

interface SearchFilters {
  department?: string
  jobType?: string
  compensation?: string
}

const ITEM_HEIGHT = 280 // Approximate height of job card
const CONTAINER_HEIGHT = 600 // Height of scrollable container

export function OptimizedJobSearch({ jobs, loading, onSearch }: OptimizedJobSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Performance monitoring
  const startTiming = usePerformanceMonitor('job-search')
  
  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  // Memoized filtered jobs to avoid recalculation
  const filteredJobs = useMemo(() => {
    const endTiming = startTiming()
    
    let result = jobs
    
    // Filter by search query
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase()
      result = result.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query)
      )
    }
    
    // Apply filters
    if (filters.department) {
      result = result.filter(job => job.department === filters.department)
    }
    
    if (filters.jobType) {
      result = result.filter(job => job.job_type === filters.jobType)
    }
    
    if (filters.compensation) {
      result = result.filter(job => 
        job.compensation?.toLowerCase().includes(filters.compensation!.toLowerCase())
      )
    }
    
    endTiming()
    return result
  }, [jobs, debouncedQuery, filters, startTiming])
  
  // Virtual scrolling for large job lists
  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  } = useVirtualScrolling(filteredJobs, ITEM_HEIGHT, CONTAINER_HEIGHT)
  
  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])
  
  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }))
  }, [])
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilters({})
    setShowFilters(false)
  }, [])
  
  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [setScrollTop])
  
  // Notify parent of search changes
  React.useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery, filters)
    }
  }, [debouncedQuery, filters, onSearch])
  
  if (loading) {
    return <JobListSkeleton count={6} />
  }
  
  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search jobs by title, description, or department..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.department || filters.jobType || filters.compensation) && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
          
          {/* Clear Filters */}
          {(searchQuery || Object.values(filters).some(Boolean)) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Select
                value={filters.department || ''}
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Psychology">Psychology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Job Type</label>
              <Select
                value={filters.jobType || ''}
                onValueChange={(value) => handleFilterChange('jobType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="research_assistant">Research Assistant</SelectItem>
                  <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
                  <SelectItem value="work_study">Work Study</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Compensation</label>
              <Input
                type="text"
                placeholder="e.g., $15/hour"
                value={filters.compensation || ''}
                onChange={(e) => handleFilterChange('compensation', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          {debouncedQuery && ` for "${debouncedQuery}"`}
        </p>
      </div>
      
      {/* Job Results with Virtual Scrolling */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs found matching your criteria.</p>
          <Button onClick={clearFilters} variant="outline">
            Clear filters to see all jobs
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative overflow-auto border rounded-lg"
          style={{ height: CONTAINER_HEIGHT }}
          onScroll={handleScroll}
        >
          {/* Virtual scrolling container */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {visibleItems.map((job, index) => (
                  <div key={job.id} data-testid="job-card">
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}