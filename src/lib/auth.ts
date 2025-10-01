import { supabase } from './supabase'
import { Profile } from '@/types/database'

export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

export interface SignUpData {
  email: string
  password: string
  fullName: string
  role: 'faculty' | 'student'
  department?: string
  yearOfStudy?: number
}

export interface SignInData {
  email: string
  password: string
}

// Validate university email domain
export const isValidUniversityEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@acadiau.ca')
}

// Sign up with email and password
export const signUp = async (data: SignUpData) => {
  if (!isValidUniversityEmail(data.email)) {
    throw new Error('Please use your Acadia University email address (@acadiau.ca)')
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
        department: data.department,
        year_of_study: data.yearOfStudy,
      }
    }
  })

  if (authError) {
    throw authError
  }

  return authData
}

// Sign in with email and password
export const signIn = async (data: SignInData) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    throw error
  }

  return authData
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  if (!isValidUniversityEmail(email)) {
    throw new Error('Please use your Acadia University email address (@acadiau.ca)')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw error
  }
}

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    profile: profile || undefined
  }
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null
    }
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Permission checking functions
export const canCreateJob = (profile: Profile | null): boolean => {
  return profile?.role === 'faculty' || profile?.role === 'admin'
}

export const canManageApplications = (profile: Profile | null, jobId?: string): boolean => {
  return profile?.role === 'faculty' || profile?.role === 'admin'
}

export const canViewAllUsers = (profile: Profile | null): boolean => {
  return profile?.role === 'admin'
}

export const canModerateContent = (profile: Profile | null): boolean => {
  return profile?.role === 'admin'
}

export const isAdmin = (profile: Profile | null): boolean => {
  return profile?.role === 'admin'
}

export const isFaculty = (profile: Profile | null): boolean => {
  return profile?.role === 'faculty'
}

export const isStudent = (profile: Profile | null): boolean => {
  return profile?.role === 'student'
}