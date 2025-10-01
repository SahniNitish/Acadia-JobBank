import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../../components/auth/login-form'
import { signIn } from '../../../lib/auth'

// Mock the auth functions
jest.mock('../../../lib/auth')
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock next/navigation
const mockPush = jest.fn()
const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/university email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should successfully sign in with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      user: { id: '123', email: 'john.doe@acadiau.ca' },
      session: { access_token: 'token123' }
    })
    mockGet.mockReturnValue(null) // No redirect parameter

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'john.doe@acadiau.ca',
        password: 'password123'
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect to intended page after successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({
      user: { id: '123', email: 'john.doe@acadiau.ca' },
      session: { access_token: 'token123' }
    })
    mockGet.mockReturnValue('/profile/setup') // Redirect parameter present

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'john.doe@acadiau.ca',
        password: 'password123'
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/profile/setup')
  })

  it('should handle sign in errors', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid login credentials'
    mockSignIn.mockRejectedValue(new Error(errorMessage))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should require email and password fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('should disable form during submission', async () => {
    const user = userEvent.setup()
    // Mock a delayed response
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
    })

    // Check that form fields are disabled
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
  })

  it('should clear error message on new submission attempt', async () => {
    const user = userEvent.setup()
    
    // First attempt - error
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))
    
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Second attempt - should clear error
    mockSignIn.mockResolvedValueOnce({
      user: { id: '123', email: 'john.doe@acadiau.ca' },
      session: { access_token: 'token123' }
    })

    await user.clear(passwordInput)
    await user.type(passwordInput, 'correctpassword')
    await user.click(submitButton)

    // Error should be cleared before new attempt
    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
    })
  })

  it('should have correct navigation links', () => {
    render(<LoginForm />)

    const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i })
    const signUpLink = screen.getByRole('link', { name: /sign up/i })

    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
    expect(signUpLink).toHaveAttribute('href', '/auth/register')
  })
})