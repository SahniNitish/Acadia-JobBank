'use client'

import { useState, useEffect } from 'react'
import { 
  createApplication, 
  getUserApplications, 
  getJobApplications, 
  updateApplicationStatus,
  hasUserApplied,
  getApplicationById,
  deleteApplication,
  CreateApplicationData,
  ApplicationWithDetails
} from '@/lib/applications'
import { Application } from '@/types/database'

export function useApplications() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserApplications = async (userId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getUserApplications(userId)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchJobApplications = async (jobId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getJobApplications(jobId)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job applications')
    } finally {
      setIsLoading(false)
    }
  }

  const submitApplication = async (data: CreateApplicationData): Promise<Application> => {
    setError(null)
    try {
      const application = await createApplication(data)
      // Refresh applications list
      await fetchUserApplications()
      return application
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateStatus = async (applicationId: string, status: Application['status']) => {
    setError(null)
    try {
      await updateApplicationStatus(applicationId, status)
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, updated_at: new Date().toISOString() }
            : app
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application status')
      throw err
    }
  }

  const removeApplication = async (applicationId: string) => {
    setError(null)
    try {
      await deleteApplication(applicationId)
      // Remove from local state
      setApplications(prev => prev.filter(app => app.id !== applicationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application')
      throw err
    }
  }

  return {
    applications,
    isLoading,
    error,
    fetchUserApplications,
    fetchJobApplications,
    submitApplication,
    updateStatus,
    removeApplication,
    clearError: () => setError(null)
  }
}

export function useApplicationStatus(jobId: string) {
  const [hasApplied, setHasApplied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const applied = await hasUserApplied(jobId)
        setHasApplied(applied)
      } catch (error) {
        console.error('Error checking application status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (jobId) {
      checkApplicationStatus()
    }
  }, [jobId])

  const markAsApplied = () => {
    setHasApplied(true)
  }

  return {
    hasApplied,
    isLoading,
    markAsApplied
  }
}

export function useApplication(applicationId: string) {
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getApplicationById(applicationId)
        setApplication(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch application')
      } finally {
        setIsLoading(false)
      }
    }

    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  return {
    application,
    isLoading,
    error
  }
}