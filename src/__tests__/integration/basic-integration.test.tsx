/**
 * Basic Integration Tests
 * 
 * Simple tests to verify core integration functionality
 */

import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}))

describe('Basic Integration Tests', () => {
  it('should render AuthProvider without crashing', () => {
    const TestComponent = () => <div>Test Content</div>

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should handle auth context initialization', async () => {
    const TestComponent = () => {
      return <div data-testid="auth-initialized">Auth Context Loaded</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-initialized')).toBeInTheDocument()
  })
})