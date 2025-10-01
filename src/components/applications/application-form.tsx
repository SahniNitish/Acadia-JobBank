'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { JobPosting } from '@/types/database'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ApplicationFormProps {
  job: JobPosting & {
    profiles?: {
      id: string
      full_name: string
      department: string
    }
  }
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface ApplicationFormData {
  coverLetter: string
  resumeFile?: File
}

export function ApplicationForm({ job, onSubmit, onCancel, isLoading = false }: ApplicationFormProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required'
    } else if (coverLetter.trim().length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters'
    }

    if (resumeFile) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      
      if (resumeFile.size > maxSize) {
        newErrors.resume = 'Resume file must be less than 5MB'
      } else if (!allowedTypes.includes(resumeFile.type)) {
        newErrors.resume = 'Resume must be a PDF or Word document'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        coverLetter: coverLetter.trim(),
        resumeFile: resumeFile || undefined
      })
    } catch (error) {
      console.error('Error submitting application:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      // Clear any previous resume errors
      if (errors.resume) {
        setErrors(prev => ({ ...prev, resume: '' }))
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      setResumeFile(files[0])
      // Clear any previous resume errors
      if (errors.resume) {
        setErrors(prev => ({ ...prev, resume: '' }))
      }
    }
  }

  const removeFile = () => {
    setResumeFile(null)
    // Clear file input
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isDeadlinePassed = job.application_deadline && new Date(job.application_deadline) < new Date()

  if (isDeadlinePassed) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Application Deadline Passed</h3>
            <p className="text-red-700 mb-4">
              The application deadline for this position was {new Date(job.application_deadline!).toLocaleDateString()}.
            </p>
            <Button onClick={onCancel} variant="outline">
              Back to Job Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Job Summary */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Apply for Position</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            You are applying for <strong>{job.title}</strong> in {job.department}
            {job.profiles && <span> posted by {job.profiles.full_name}</span>}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Application Details</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Please provide your cover letter and resume for this position.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="cover-letter">
                Cover Letter <span className="text-red-500" aria-label="required">*</span>
              </Label>
              <Textarea
                id="cover-letter"
                placeholder="Write a compelling cover letter explaining why you're interested in this position and how your skills and experience make you a good fit..."
                value={coverLetter}
                onChange={(e) => {
                  setCoverLetter(e.target.value)
                  // Clear error when user starts typing
                  if (errors.coverLetter) {
                    setErrors(prev => ({ ...prev, coverLetter: '' }))
                  }
                }}
                className={`min-h-[200px] resize-y ${errors.coverLetter ? 'border-red-500' : ''}`}
                disabled={isLoading}
                required
                aria-describedby="cover-letter-help cover-letter-error cover-letter-count"
                aria-invalid={errors.coverLetter ? 'true' : 'false'}
              />
              <div id="cover-letter-help" className="sr-only">
                Write a detailed cover letter explaining your interest and qualifications for this position. Minimum 50 characters required.
              </div>
              {errors.coverLetter && (
                <p id="cover-letter-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {errors.coverLetter}
                </p>
              )}
              <p id="cover-letter-count" className="text-sm text-muted-foreground" aria-live="polite">
                {coverLetter.length} characters (minimum 50 required)
              </p>
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume-upload">Resume (Optional)</Label>
              
              {!resumeFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : errors.resume 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-describedby="resume-help resume-error"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      document.getElementById('resume-upload')?.click()
                    }
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium mb-1">
                    Drop your resume here, or{' '}
                    <label htmlFor="resume-upload" className="text-primary cursor-pointer hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      browse files
                    </label>
                  </p>
                  <p id="resume-help" className="text-xs text-muted-foreground">
                    PDF, DOC, or DOCX up to 5MB
                  </p>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                    aria-describedby="resume-help resume-error"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50" role="region" aria-label="Selected resume file">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(resumeFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isLoading}
                      aria-label={`Remove ${resumeFile.name}`}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
              
              {errors.resume && (
                <p id="resume-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {errors.resume}
                </p>
              )}
            </div>

            {/* Deadline Warning */}
            {job.application_deadline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Application Deadline:</strong>{' '}
                  {new Date(job.application_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <Button
                type="submit"
                disabled={isLoading || !coverLetter.trim()}
                className="w-full sm:w-auto sm:flex-1"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto sm:flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}