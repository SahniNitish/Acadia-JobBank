'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobPosting } from '@/types/database'
import { Search, Filter, X, ArrowUpDown, Calendar } from 'lucide-react'

const departments = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Economics',
  'English',
  'History',
  'Mathematics',
  'Physics',
  'Psychology',
  'Business Administration',
  'Education',
  'Engineering',
  'Environmental Science',
  'Geology',
  'Kinesiology',
  'Music',
  'Philosophy',
  'Political Science',
  'Sociology',
  'Theatre Arts'
]

const jobTypes = [
  { value: 'research_assistant', label: 'Research Assistant' },
  { value: 'teaching_assistant', label: 'Teaching Assistant' },
  { value: 'work_study', label: 'Work Study' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' }
]

const sortOptions = [
  { value: 'created_at', label: 'Date Posted' },
  { value: 'title', label: 'Job Title' },
  { value: 'deadline', label: 'Application Deadline' },
  { value: 'department', label: 'Department' },
  { value: 'compensation', label: 'Compensation' }
]

export interface JobSearchFilters {
  search: string
  department: string
  jobType: JobPosting['job_type'] | ''
  deadlineFrom: string
  deadlineTo: string
  sortBy: 'created_at' | 'title' | 'deadline' | 'department' | 'compensation'
  sortOrder: 'asc' | 'desc'
}

interface JobSearchFiltersProps {
  filters: JobSearchFilters
  onFiltersChange: (filters: JobSearchFilters) => void
  onSearch: () => void
  isLoading?: boolean
  showAdvancedFilters?: boolean
}

export function JobSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  showAdvancedFilters = true
}: JobSearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof JobSearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      department: '',
      jobType: '',
      deadlineFrom: '',
      deadlineTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.department || filters.jobType || filters.deadlineFrom || filters.deadlineTo

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2" role="search" aria-label="Job search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <Input
            placeholder="Search jobs by title, description, requirements, or department..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
            disabled={isLoading}
            aria-label="Search jobs"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Enter keywords to search for jobs. Press Enter to search or use the Search button.
          </div>
        </div>
        
        {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1">
            <Select 
              value={`${filters.sortBy}-${filters.sortOrder}`} 
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder]
                onFiltersChange({
                  ...filters,
                  sortBy,
                  sortOrder
                })
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <div key={option.value}>
                    <SelectItem value={`${option.value}-desc`}>
                      {option.label} (Newest First)
                    </SelectItem>
                    <SelectItem value={`${option.value}-asc`}>
                      {option.label} (Oldest First)
                    </SelectItem>
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onSearch} 
              disabled={isLoading} 
              className="flex-1 sm:flex-none"
              aria-describedby="search-status"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <div id="search-status" className="sr-only" aria-live="polite">
              {isLoading ? 'Searching for jobs...' : 'Ready to search'}
            </div>
            
            {showAdvancedFilters && (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 flex-1 sm:flex-none"
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
                aria-label={`${showFilters ? 'Hide' : 'Show'} advanced filters${hasActiveFilters ? ` (${[filters.department, filters.jobType, filters.deadlineFrom, filters.deadlineTo].filter(Boolean).length} active)` : ''}`}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
                {hasActiveFilters && (
                  <span 
                    className="bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
                    aria-label={`${[filters.department, filters.jobType, filters.deadlineFrom, filters.deadlineTo].filter(Boolean).length} active filters`}
                  >
                    {[filters.department, filters.jobType, filters.deadlineFrom, filters.deadlineTo].filter(Boolean).length}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <Card id="advanced-filters" role="region" aria-labelledby="filter-title">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle id="filter-title" className="text-base">Filter Jobs</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Clear all active filters"
                >
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={filters.department} 
                  onValueChange={(value) => updateFilter('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select 
                  value={filters.jobType} 
                  onValueChange={(value) => updateFilter('jobType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All job types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All job types</SelectItem>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Application Deadline Range
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadlineFrom" className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    id="deadlineFrom"
                    type="date"
                    value={filters.deadlineFrom}
                    onChange={(e) => updateFilter('deadlineFrom', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadlineTo" className="text-xs text-muted-foreground">To Date</Label>
                  <Input
                    id="deadlineTo"
                    type="date"
                    value={filters.deadlineTo}
                    onChange={(e) => updateFilter('deadlineTo', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort Results
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortBy" className="text-xs text-muted-foreground">Sort By</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => updateFilter('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-xs text-muted-foreground">Order</Label>
                  <Select 
                    value={filters.sortOrder} 
                    onValueChange={(value) => updateFilter('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={onSearch} className="flex-1" disabled={isLoading}>
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}