import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/auth-context'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'

// Mock the dependencies
jest.mock('../../lib/supabase')
jest.mock('../../lib/auth')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>

// Test component that uses the auth context
function TestComponent() {
  const { user, profile, session, loading, signOut, refreshProfile } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div data-testid="user-id">{user?.id || 'No user'}</div>
      <div data-testid="user-email">{user?.email || 'No email'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'No profile'}</div>
      <div data-testid="profile-role">{profile?.role || 'No role'}</div>
      <div data-testid="session-status">{session ? 'Authenticated' : 'Not authenticated'}</div>
      <button onClick={signOut} data-testid="sign-out-btn">Sign Out</button>
      <button onClick={refreshProfile} data-testid="refresh-profile-btn">Refresh Profile</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('should initialize with loading state', async () => {
    // Mock initial session as null
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    // Mock auth state change subscription
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('No user')
    })

    expect(screen.getByTestId('session-status')).toHaveTextContent('Not authenticated')
  })

  it('should handle authenticated user with profile', async () => {
    const mockUser = {
      id: '123',
      email: 'john.doe@acadiau.ca'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }

    const mockProfile = {
      id: '123',
      email: 'john.doe@acadiau.ca',
      full_name: 'John Doe',
      role: 'student' as const,
      department: 'Computer Science',
      year_of_study: 3,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    // Mock initial session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock profile fetch
    mockGetUserProfile.mockResolvedValue(mockProfile)

    // Mock auth state change subscription
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('123')
    })

    expect(screen.getByTestId('user-email')).toHaveTextContent('john.doe@acadiau.ca')
    expect(screen.getByTestId('profile-name')).toHaveTextContent('John Doe')
    expect(screen.getByTestId('profile-role')).toHaveTextContent('student')
    expect(screen.getByTestId('session-status')).toHaveTextContent('Authenticated')
  })

  it('should handle authenticated user without profile', async () => {
    const mockUser = {
      id: '123',
      email: 'john.doe@acadiau.ca'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }

    // Mock initial session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock profile fetch returning null
    mockGetUserProfile.mockResolvedValue(null)

    // Mock auth state change subscription
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('123')
    })

    expect(screen.getByTestId('user-email')).toHaveTextContent('john.doe@acadiau.ca')
    expect(screen.getByTestId('profile-name')).toHaveTextContent('No profile')
    expect(screen.getByTestId('profile-role')).toHaveTextContent('No role')
    expect(screen.getByTestId('session-status')).toHaveTextContent('Authenticated')
  })

  it('should handle sign out', async () => {
    const mockUser = {
      id: '123',
      email: 'john.doe@acadiau.ca'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }

    // Mock initial session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    mockGetUserProfile.mockResolvedValue(null)

    // Mock sign out
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    // Mock auth state change subscription
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('123')
    })

    // Click sign out
    const signOutBtn = screen.getByTestId('sign-out-btn')
    await act(async () => {
      signOutBtn.click()
    })

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('should handle profile refresh', async () => {
    const mockUser = {
      id: '123',
      email: 'john.doe@acadiau.ca'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }

    const initialProfile = {
      id: '123',
      email: 'john.doe@acadiau.ca',
      full_name: 'John Doe',
      role: 'student' as const,
      department: 'Computer Science',
      year_of_study: 3,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    const updatedProfile = {
      ...initialProfile,
      full_name: 'John Updated Doe',
      department: 'Mathematics'
    }

    // Mock initial session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock initial profile fetch
    mockGetUserProfile.mockResolvedValueOnce(initialProfile)

    // Mock auth state change subscription
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('John Doe')
    })

    // Mock updated profile fetch
    mockGetUserProfile.mockResolvedValueOnce(updatedProfile)

    // Click refresh profile
    const refreshBtn = screen.getByTestId('refresh-profile-btn')
    await act(async () => {
      refreshBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('John Updated Doe')
    })
  })

  it('should handle auth state changes', async () => {
    let authStateChangeCallback: (event: string, session: any) => void

    // Mock initial session as null
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    // Mock auth state change subscription and capture the callback
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial load (no user)
    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('No user')
    })

    // Simulate sign in via auth state change
    const mockUser = {
      id: '123',
      email: 'john.doe@acadiau.ca'
    }

    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }

    const mockProfile = {
      id: '123',
      email: 'john.doe@acadiau.ca',
      full_name: 'John Doe',
      role: 'student' as const,
      department: 'Computer Science',
      year_of_study: 3,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    mockGetUserProfile.mockResolvedValue(mockProfile)

    await act(async () => {
      authStateChangeCallback('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('123')
    })

    expect(screen.getByTestId('profile-name')).toHaveTextContent('John Doe')

    // Simulate sign out via auth state change
    await act(async () => {
      authStateChangeCallback('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('No user')
    })

    expect(screen.getByTestId('profile-name')).toHaveTextContent('No profile')
  })

  it('should clean up subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})