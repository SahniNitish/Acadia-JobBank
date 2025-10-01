'use client'

import { useState } from 'react'
import { JobPostingForm } from './job-posting-form'
import { JobPostingPreview } from './job-posting-preview'
import { JobPosting } from '@/types/database'

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

interface JobPostingWizardProps {
  initialData?: Partial<JobPosting>
  onSubmit: (data: JobPostingFormData) => Promise<void>
  isLoading?: boolean
  error?: string
}

export function JobPostingWizard({
  initialData,
  onSubmit,
  isLoading = false,
  error
}: JobPostingWizardProps) {
  const [step, setStep] = useState<'form' | 'preview'>('form')
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

  const handleFormSubmit = async (data: JobPostingFormData) => {
    setFormData(data)
    setStep('preview')
  }

  const handlePreview = (data: JobPostingFormData) => {
    setFormData(data)
    setStep('preview')
  }

  const handleEdit = () => {
    setStep('form')
  }

  const handleConfirm = async () => {
    await onSubmit(formData)
  }

  if (step === 'preview') {
    return (
      <JobPostingPreview
        data={formData}
        onEdit={handleEdit}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    )
  }

  return (
    <JobPostingForm
      initialData={formData}
      onSubmit={handleFormSubmit}
      onPreview={handlePreview}
      isLoading={isLoading}
      error={error}
    />
  )
}