'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ProfileForm } from '@/components/profile/profile-form'
import { updateProfile, validateProfileData } from '@/lib/profile'

interface ProfileFormData {
  fullName: string
  role: 'faculty' | 'student' | 'admin' | ''
  department: string
  yearOfStudy?: number
}

export default function ProfileEditPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!profile) {
      router.push('/profile/setup')
      return
    }
  }, [user, profile, router])

  const handleSubmit = async (formData: ProfileFormData) => {
    if (!user || !profile) return

    setIsLoading(true)
    setError('')

    // Validate the form data
    const validationErrors = validateProfileData({
      fullName: formData.fullName,
      department: formData.department,
      yearOfStudy: formData.yearOfStudy
    })

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      setIsLoading(false)
      return
    }

    try {
      await updateProfile(user.id, {
        fullName: formData.fullName,
        department: formData.department || undefined,
        yearOfStudy: formData.yearOfStudy || undefined
      })

      await refreshProfile()
      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating your profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !profile) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600">
            Update your profile information
          </p>
        </div>
        
        <ProfileForm
          initialData={profile}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          title="Edit Profile"
          description="Update your profile information"
          submitButtonText="Save Changes"
          showRoleSelection={false}
        />
      </div>
    </div>
  )
}