import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../../../components/auth/register-form'
import { signUp } from '../../../lib/auth'

// Mock the auth functions
jest.mock('../../../lib/auth')
const mockSignUp = signUp as jest.MockedFunction<typeof signUp>

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/university email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should validate university email domain', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'invalid@gmail.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please use your acadia university email address/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should validate password confirmation', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'differentpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(passwordInput, '123')
    await user.type(confirmPasswordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should require role selection', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    const emailInput = screen.getByLabelText(/university email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const fullNameInput = screen.getByLabelText(/full name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(fullNameInput, 'John Doe')
    await user.type(emailInput, 'john.doe@acadiau.ca')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select your role/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should show year of study field only for students', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    // Initially, year of study should not be visible
    expect(screen.queryByLabelText(/year of study/i)).not.toBeInTheDocument()

    // Select student role
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    await user.click(roleSelect)
    
    const studentOption = screen.getByRole('option', { name: /student/i })
    await user.click(studentOption)

    // Now year of study should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/year of study/i)).toBeInTheDocument()
    })

    // Select faculty role
    await user.click(roleSelect)
    const facultyOption = screen.getByRole('option', { name: /faculty/i })
    await user.click(facultyOption)

    // Year of study should be hidden again
    await waitFor(() => {
      expect(screen.queryByLabelText(/year of study/i)).not.toBeInTheDocument()
    })
  })

  it('should successfully submit form with valid student data', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({
      user: { id: '123', email: 'john.doe@acadiau.ca' },
      session: null
    })

    render(<RegisterForm />)

    // Fill out the form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/university email/i), 'john.doe@acadiau.ca')
    
    // Select student role
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    await user.click(roleSelect)
    await user.click(screen.getByRole('option', { name: /student/i }))

    // Select department
    const departmentSelect = screen.getByRole('combobox', { name: /department/i })
    await user.click(departmentSelect)
    await user.click(screen.getByRole('option', { name: /computer science/i }))

    // Select year of study
    await waitFor(() => {
      expect(screen.getByLabelText(/year of study/i)).toBeInTheDocument()
    })
    const yearSelect = screen.getByRole('combobox', { name: /year of study/i })
    await user.click(yearSelect)
    await user.click(screen.getByRole('option', { name: /3rd year/i }))

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john.doe@acadiau.ca',
        password: 'password123',
        fullName: 'John Doe',
        role: 'student',
        department: 'Computer Science',
        yearOfStudy: 3
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/auth/confirm-email')
  })

  it('should successfully submit form with valid faculty data', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({
      user: { id: '456', email: 'prof.smith@acadiau.ca' },
      session: null
    })

    render(<RegisterForm />)

    // Fill out the form
    await user.type(screen.getByLabelText(/full name/i), 'Prof Smith')
    await user.type(screen.getByLabelText(/university email/i), 'prof.smith@acadiau.ca')
    
    // Select faculty role
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    await user.click(roleSelect)
    await user.click(screen.getByRole('option', { name: /faculty/i }))

    // Select department
    const departmentSelect = screen.getByRole('combobox', { name: /department/i })
    await user.click(departmentSelect)
    await user.click(screen.getByRole('option', { name: /mathematics/i }))

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'prof.smith@acadiau.ca',
        password: 'password123',
        fullName: 'Prof Smith',
        role: 'faculty',
        department: 'Mathematics',
        yearOfStudy: undefined
      })
    })

    expect(mockPush).toHaveBeenCalledWith('/auth/confirm-email')
  })

  it('should handle sign up errors', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already registered'
    mockSignUp.mockRejectedValue(new Error(errorMessage))

    render(<RegisterForm />)

    // Fill out valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/university email/i), 'john.doe@acadiau.ca')
    
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    await user.click(roleSelect)
    await user.click(screen.getByRole('option', { name: /student/i }))

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should disable form during submission', async () => {
    const user = userEvent.setup()
    // Mock a delayed response
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<RegisterForm />)

    // Fill out minimal valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/university email/i), 'john.doe@acadiau.ca')
    
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    await user.click(roleSelect)
    await user.click(screen.getByRole('option', { name: /student/i }))

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    // Check that button shows loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
    })

    // Check that form fields are disabled
    expect(screen.getByLabelText(/full name/i)).toBeDisabled()
    expect(screen.getByLabelText(/university email/i)).toBeDisabled()
  })
})