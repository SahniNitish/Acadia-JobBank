'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JobPosting } from '@/types/database'

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

interface JobPostingFormData {
  title: string
  description: string
  requirements: string
  compensation: string
  jobType: JobPosting['job_type'] | ''
  department: string
  duration: string
  applicationDeadline: string
}

interface JobPostingFormProps {
  initialData?: Partial<JobPosting>
  onSubmit: (data: JobPostingFormData) => Promise<void>
  onPreview?: (data: JobPostingFormData) => void
  isLoading?: boolean
  error?: string
  title?: string
  description?: string
  submitButtonText?: string
}

export function JobPostingForm({
  initialData,
  onSubmit,
  onPreview,
  isLoading = false,
  error,
  title = "Create Job Posting",
  description = "Fill out the details for your job posting",
  submitButtonText = "Post Job"
}: JobPostingFormProps) {
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    requirements: initialData?.requirements || '',
    compensation: initialData?.compensation || '',
    jobType: initialData?.job_type || '',
    department: initialData?.department || '',
    duration: initialData?.duration || '',
    applicationDeadline: initialData?.application_deadline || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData)
    }
  }

  const updateFormData = (field: keyof JobPostingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return formData.title.trim() && 
           formData.description.trim() && 
           formData.jobType && 
           formData.department
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Research Assistant - Computer Science"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type *</Label>
              <Select 
                value={formData.jobType} 
                onValueChange={(value: string) => updateFormData('jobType', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value: string) => updateFormData('department', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the job responsibilities, expectations, and any relevant information..."
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              required
              disabled={isLoading}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="List any specific qualifications, skills, or prerequisites for this position..."
              value={formData.requirements}
              onChange={(e) => updateFormData('requirements', e.target.value)}
              disabled={isLoading}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation</Label>
              <Input
                id="compensation"
                type="text"
                placeholder="e.g., $15/hour, $500/month, Volunteer"
                value={formData.compensation}
                onChange={(e) => updateFormData('compensation', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="text"
                placeholder="e.g., 3 months, Fall semester, Ongoing"
                value={formData.duration}
                onChange={(e) => updateFormData('duration', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationDeadline">Application Deadline</Label>
            <Input
              id="applicationDeadline"
              type="date"
              value={formData.applicationDeadline}
              onChange={(e) => updateFormData('applicationDeadline', e.target.value)}
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onPreview && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreview}
                disabled={isLoading || !isFormValid()}
                className="flex-1"
              >
                Preview
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid()}
              className="flex-1"
            >
              {isLoading ? 'Posting...' : submitButtonText}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}