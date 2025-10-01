import { supabase } from './supabase'
import { Profile } from '@/types/database'

export interface CreateProfileData {
  id: string
  email: string
  fullName: string
  role: 'faculty' | 'student' | 'admin'
  department?: string
  yearOfStudy?: number
}

export interface UpdateProfileData {
  fullName?: string
  department?: string
  yearOfStudy?: number
}

// Create a new profile
export const createProfile = async (data: CreateProfileData): Promise<Profile> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: data.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      department: data.department || null,
      year_of_study: data.yearOfStudy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return profile
}

// Get profile by user ID
export const getProfile = async (userId: string): Promise<Profile | null> => {
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
    throw error
  }

  return data
}

// Get profile by email
export const getProfileByEmail = async (email: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null
    }
    throw error
  }

  return data
}

// Update profile
export const updateProfile = async (userId: string, updates: UpdateProfileData): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      full_name: updates.fullName,
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

// Delete profile (soft delete by setting inactive)
export const deleteProfile = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    throw error
  }
}

// Get all profiles (admin function)
export const getAllProfiles = async (filters?: {
  role?: 'faculty' | 'student' | 'admin'
  department?: string
  limit?: number
  offset?: number
}): Promise<{ profiles: Profile[], count: number }> => {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.role) {
    query = query.eq('role', filters.role)
  }

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    profiles: data || [],
    count: count || 0
  }
}

// Get profiles by department
export const getProfilesByDepartment = async (department: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('department', department)
    .order('full_name', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

// Get faculty profiles
export const getFacultyProfiles = async (department?: string): Promise<Profile[]> => {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'faculty')
    .order('full_name', { ascending: true })

  if (department) {
    query = query.eq('department', department)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

// Get student profiles
export const getStudentProfiles = async (filters?: {
  department?: string
  yearOfStudy?: number
}): Promise<Profile[]> => {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }

  if (filters?.yearOfStudy) {
    query = query.eq('year_of_study', filters.yearOfStudy)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

// Validate profile data
export const validateProfileData = (data: Partial<CreateProfileData | UpdateProfileData>): string[] => {
  const errors: string[] = []

  if ('fullName' in data && (!data.fullName || data.fullName.trim().length < 2)) {
    errors.push('Full name must be at least 2 characters long')
  }

  if ('role' in data && data.role && !['faculty', 'student', 'admin'].includes(data.role)) {
    errors.push('Invalid role selected')
  }

  if ('yearOfStudy' in data && data.yearOfStudy && (data.yearOfStudy < 1 || data.yearOfStudy > 10)) {
    errors.push('Year of study must be between 1 and 10')
  }

  if ('email' in data && data.email && !data.email.toLowerCase().endsWith('@acadiau.ca')) {
    errors.push('Email must be an Acadia University email address')
  }

  return errors
}

// Check if profile is complete
export const isProfileComplete = (profile: Profile): boolean => {
  if (!profile.full_name || !profile.role) {
    return false
  }

  // For students, year of study is required
  if (profile.role === 'student' && !profile.year_of_study) {
    return false
  }

  return true
}

// Get profile completion percentage
export const getProfileCompletionPercentage = (profile: Profile): number => {
  let completed = 0
  let total = 4 // email, full_name, role, department

  if (profile.email) completed++
  if (profile.full_name) completed++
  if (profile.role) completed++
  if (profile.department) completed++

  // For students, year of study is also counted
  if (profile.role === 'student') {
    total++
    if (profile.year_of_study) completed++
  }

  return Math.round((completed / total) * 100)
}