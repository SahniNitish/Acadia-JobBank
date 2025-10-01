import { useState, useCallback } from 'react'
import { Profile } from '@/types/database'
import { 
  getProfile, 
  updateProfile, 
  createProfile, 
  validateProfileData,
  isProfileComplete,
  getProfileCompletionPercentage,
  CreateProfileData,
  UpdateProfileData
} from '@/lib/profile'

export function useProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const profile = await getProfile(userId)
      return profile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createUserProfile = useCallback(async (data: CreateProfileData): Promise<Profile | null> => {
    setLoading(true)
    setError(null)

    // Validate data first
    const validationErrors = validateProfileData(data)
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      setLoading(false)
      return null
    }

    try {
      const profile = await createProfile(data)
      return profile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUserProfile = useCallback(async (userId: string, data: UpdateProfileData): Promise<Profile | null> => {
    setLoading(true)
    setError(null)

    // Validate data first
    const validationErrors = validateProfileData(data)
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      setLoading(false)
      return null
    }

    try {
      const profile = await updateProfile(userId, data)
      return profile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const checkProfileCompletion = useCallback((profile: Profile) => {
    return {
      isComplete: isProfileComplete(profile),
      completionPercentage: getProfileCompletionPercentage(profile)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    fetchProfile,
    createUserProfile,
    updateUserProfile,
    checkProfileCompletion,
    clearError
  }
}