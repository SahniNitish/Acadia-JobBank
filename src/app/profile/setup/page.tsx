'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ProfileForm } from '@/components/profile/profile-form'
import { createProfile, validateProfileData } from '@/lib/profile'

interface ProfileFormData {
  fullName: string
  role: 'faculty' | 'student' | 'admin' | ''
  department: string
  yearOfStudy?: number
}

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<any>({})

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Pre-fill with user metadata if available
    if (user.user_metadata) {
      setInitialData({
        full_name: user.user_metadata.full_name || '',
        role: user.user_metadata.role || '',
        department: user.user_metadata.department || '',
        year_of_study: user.user_metadata.year_of_study || undefined
      })
    }
  }, [user, router])

  const handleSubmit = async (formData: ProfileFormData) => {
    if (!user) return

    setIsLoading(true)
    setError('')

    if (!formData.role) {
      setError('Please select your role')
      setIsLoading(false)
      return
    }

    // Validate the form data
    const validationErrors = validateProfileData({
      id: user.id,
      email: user.email!,
      fullName: formData.fullName,
      role: formData.role,
      department: formData.department,
      yearOfStudy: formData.yearOfStudy
    })

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      setIsLoading(false)
      return
    }

    try {
      await createProfile({
        id: user.id,
        email: user.email!,
        fullName: formData.fullName,
        role: formData.role,
        department: formData.department || undefined,
        yearOfStudy: formData.yearOfStudy || undefined
      })

      await refreshProfile()
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Please provide some additional information to get started
          </p>
        </div>
        
        <ProfileForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          title="Profile Setup"
          description="Help us personalize your experience"
          submitButtonText="Complete Setup"
          showRoleSelection={true}
        />
      </div>
    </div>
  )
}