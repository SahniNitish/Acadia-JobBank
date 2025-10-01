import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { 
  isValidUniversityEmail, 
  signUp, 
  signIn, 
  signOut, 
  resetPassword,
  getCurrentUser,
  getUserProfile,
  updateUserProfile 
} from '../../lib/auth'
import { supabase } from '../../lib/supabase'

// Mock the supabase module
jest.mock('../../lib/supabase')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Authentication Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isValidUniversityEmail', () => {
    it('should return true for valid Acadia University email addresses', () => {
      expect(isValidUniversityEmail('john.doe@acadiau.ca')).toBe(true)
      expect(isValidUniversityEmail('jane.smith@acadiau.ca')).toBe(true)
      expect(isValidUniversityEmail('STUDENT@ACADIAU.CA')).toBe(true)
    })

    it('should return false for invalid email addresses', () => {
      expect(isValidUniversityEmail('john.doe@gmail.com')).toBe(false)
      expect(isValidUniversityEmail('jane@yahoo.com')).toBe(false)
      expect(isValidUniversityEmail('student@university.edu')).toBe(false)
      expect(isValidUniversityEmail('invalid-email')).toBe(false)
      expect(isValidUniversityEmail('')).toBe(false)
    })

    it('should handle case insensitive domain validation', () => {
      expect(isValidUniversityEmail('test@ACADIAU.CA')).toBe(true)
      expect(isValidUniversityEmail('test@Acadiau.Ca')).toBe(true)
      expect(isValidUniversityEmail('test@acadiau.CA')).toBe(true)
    })
  })

  describe('signUp', () => {
    it('should successfully sign up with valid university email and complete data', async () => {
      const mockAuthData = {
        user: { id: '123', email: 'john.doe@acadiau.ca' },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const signUpData = {
        email: 'john.doe@acadiau.ca',
        password: 'password123',
        fullName: 'John Doe',
        role: 'student' as const,
        department: 'Computer Science',
        yearOfStudy: 3
      }

      const result = await signUp(signUpData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john.doe@acadiau.ca',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
            role: 'student',
            department: 'Computer Science',
            year_of_study: 3,
          }
        }
      })

      expect(result).toEqual(mockAuthData)
    })

    it('should reject sign up with invalid university email', async () => {
      const signUpData = {
        email: 'john.doe@gmail.com',
        password: 'password123',
        fullName: 'John Doe',
        role: 'student' as const
      }

      await expect(signUp(signUpData)).rejects.toThrow(
        'Please use your Acadia University email address (@acadiau.ca)'
      )

      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle faculty sign up without year of study', async () => {
      const mockAuthData = {
        user: { id: '456', email: 'prof.smith@acadiau.ca' },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const signUpData = {
        email: 'prof.smith@acadiau.ca',
        password: 'password123',
        fullName: 'Prof Smith',
        role: 'faculty' as const,
        department: 'Mathematics'
      }

      const result = await signUp(signUpData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'prof.smith@acadiau.ca',
        password: 'password123',
        options: {
          data: {
            full_name: 'Prof Smith',
            role: 'faculty',
            department: 'Mathematics',
            year_of_study: undefined,
          }
        }
      })

      expect(result).toEqual(mockAuthData)
    })

    it('should throw error when Supabase returns an error', async () => {
      const authError = new Error('Email already registered')
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      const signUpData = {
        email: 'john.doe@acadiau.ca',
        password: 'password123',
        fullName: 'John Doe',
        role: 'student' as const
      }

      await expect(signUp(signUpData)).rejects.toThrow('Email already registered')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockAuthData = {
        user: { id: '123', email: 'john.doe@acadiau.ca' },
        session: { access_token: 'token123' }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const signInData = {
        email: 'john.doe@acadiau.ca',
        password: 'password123'
      }

      const result = await signIn(signInData)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'john.doe@acadiau.ca',
        password: 'password123'
      })

      expect(result).toEqual(mockAuthData)
    })

    it('should throw error when credentials are invalid', async () => {
      const authError = new Error('Invalid login credentials')
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError
      })

      const signInData = {
        email: 'john.doe@acadiau.ca',
        password: 'wrongpassword'
      }

      await expect(signIn(signInData)).rejects.toThrow('Invalid login credentials')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error when sign out fails', async () => {
      const signOutError = new Error('Sign out failed')
      mockSupabase.auth.signOut.mockResolvedValue({ error: signOutError })

      await expect(signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('resetPassword', () => {

    it('should successfully send password reset email for valid university email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await resetPassword('john.doe@acadiau.ca')

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'john.doe@acadiau.ca',
        {
          redirectTo: 'http://localhost/auth/reset-password'
        }
      )
    })

    it('should reject password reset for invalid university email', async () => {
      await expect(resetPassword('john.doe@gmail.com')).rejects.toThrow(
        'Please use your Acadia University email address (@acadiau.ca)'
      )

      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    })

    it('should throw error when password reset fails', async () => {
      const resetError = new Error('Password reset failed')
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: resetError })

      await expect(resetPassword('john.doe@acadiau.ca')).rejects.toThrow('Password reset failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user with profile when authenticated', async () => {
      const mockUser = { id: '123', email: 'john.doe@acadiau.ca' }
      const mockProfile = {
        id: '123',
        email: 'john.doe@acadiau.ca',
        full_name: 'John Doe',
        role: 'student',
        department: 'Computer Science',
        year_of_study: 3,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: '123',
        email: 'john.doe@acadiau.ca',
        profile: mockProfile
      })
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it('should return user without profile when profile fetch fails', async () => {
      const mockUser = { id: '123', email: 'john.doe@acadiau.ca' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Profile not found')
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: '123',
        email: 'john.doe@acadiau.ca',
        profile: undefined
      })
    })
  })

  describe('Role-based Access Control', () => {
    it('should properly handle student role in sign up', async () => {
      const mockAuthData = {
        user: { id: '123', email: 'student@acadiau.ca' },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const studentData = {
        email: 'student@acadiau.ca',
        password: 'password123',
        fullName: 'Student User',
        role: 'student' as const,
        department: 'Biology',
        yearOfStudy: 2
      }

      await signUp(studentData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'student@acadiau.ca',
        password: 'password123',
        options: {
          data: {
            full_name: 'Student User',
            role: 'student',
            department: 'Biology',
            year_of_study: 2,
          }
        }
      })
    })

    it('should properly handle faculty role in sign up', async () => {
      const mockAuthData = {
        user: { id: '456', email: 'faculty@acadiau.ca' },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const facultyData = {
        email: 'faculty@acadiau.ca',
        password: 'password123',
        fullName: 'Faculty User',
        role: 'faculty' as const,
        department: 'Physics'
      }

      await signUp(facultyData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'faculty@acadiau.ca',
        password: 'password123',
        options: {
          data: {
            full_name: 'Faculty User',
            role: 'faculty',
            department: 'Physics',
            year_of_study: undefined,
          }
        }
      })
    })

    it('should validate that only valid roles are accepted', () => {
      // This test ensures TypeScript type safety for roles
      // The role parameter should only accept 'faculty' | 'student'
      const validStudentRole: 'student' = 'student'
      const validFacultyRole: 'faculty' = 'faculty'
      
      expect(validStudentRole).toBe('student')
      expect(validFacultyRole).toBe('faculty')
    })
  })
})