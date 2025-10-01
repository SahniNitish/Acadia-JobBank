'use client'

import { useRouter } from 'next/navigation'
import { JobPostingWizard } from '@/components/jobs/job-posting-wizard'
import { useAuth } from '@/contexts/auth-context'
import { useCreateJobPosting } from '@/hooks/use-jobs'
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

export default function CreateJobPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { createJob, isLoading, error } = useCreateJobPosting()

  // Redirect if not faculty
  if (profile && profile.role !== 'faculty') {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (data: JobPostingFormData) => {
    if (!user || !profile) {
      throw new Error('You must be logged in to create a job posting')
    }

    if (profile.role !== 'faculty') {
      throw new Error('Only faculty members can create job postings')
    }

    try {
      const jobData = {
        title: data.title,
        description: data.description,
        requirements: data.requirements || undefined,
        compensation: data.compensation || undefined,
        job_type: data.jobType as JobPosting['job_type'],
        department: data.department,
        duration: data.duration || undefined,
        application_deadline: data.applicationDeadline || undefined,
        posted_by: user.id
      }

      await createJob(jobData)
      
      // Redirect to dashboard or job listings
      router.push('/dashboard?tab=jobs')
    } catch (err) {
      console.error('Error creating job posting:', err)
      throw err
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Job Posting</h1>
        <p className="text-muted-foreground mt-2">
          Post a new job opportunity for students at Acadia University
        </p>
      </div>

      <JobPostingWizard
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error || undefined}
      />
    </div>
  )
}