import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobPostingForm } from '@/components/jobs/job-posting-form'
import { JobPosting } from '@/types/database'

// Mock the UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled }: any) => (
    <select 
      data-testid="select" 
      onChange={(e) => onValueChange?.(e.target.value)}
      value={value}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

describe('JobPostingForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnPreview = jest.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onPreview: mockOnPreview,
    isLoading: false,
    title: 'Create Job Posting',
    description: 'Fill out the details for your job posting',
    submitButtonText: 'Post Job'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Validation', () => {
    it('should render all required form fields', () => {
      render(<JobPostingForm {...defaultProps} />)

      expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/requirements/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/compensation/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/application deadline/i)).toBeInTheDocument()
    })

    it('should disable submit button when required fields are empty', () => {
      render(<JobPostingForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /post job/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when all required fields are filled', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByLabelText(/job title/i), 'Research Assistant')
      await user.type(screen.getByLabelText(/job description/i), 'Help with research projects')
      
      // Select job type and department using the mocked select components
      const jobTypeSelect = screen.getAllByTestId('select')[0]
      const departmentSelect = screen.getAllByTestId('select')[1]
      
      fireEvent.change(jobTypeSelect, { target: { value: 'research_assistant' } })
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } })

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /post job/i })
        expect(submitButton).toBeEnabled()
      })
    })

    it('should validate required fields on form submission', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} />)

      const form = screen.getByRole('form') || screen.getByTestId('job-posting-form') || document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Form should not submit with empty required fields
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show validation errors for required fields', () => {
      render(<JobPostingForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/job title/i)
      const descriptionInput = screen.getByLabelText(/job description/i)

      expect(titleInput).toHaveAttribute('required')
      expect(descriptionInput).toHaveAttribute('required')
    })

    it('should validate minimum date for application deadline', () => {
      render(<JobPostingForm {...defaultProps} />)

      const deadlineInput = screen.getByLabelText(/application deadline/i)
      const today = new Date().toISOString().split('T')[0]
      
      expect(deadlineInput).toHaveAttribute('min', today)
    })
  })

  describe('Form Submission', () => {
    const validFormData = {
      title: 'Research Assistant Position',
      description: 'Help with computer science research',
      requirements: 'Strong programming skills',
      compensation: '$15/hour',
      jobType: 'research_assistant' as JobPosting['job_type'],
      department: 'Computer Science',
      duration: '3 months',
      applicationDeadline: '2024-12-31'
    }

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} />)

      // Fill out the form
      await user.type(screen.getByLabelText(/job title/i), validFormData.title)
      await user.type(screen.getByLabelText(/job description/i), validFormData.description)
      await user.type(screen.getByLabelText(/requirements/i), validFormData.requirements)
      await user.type(screen.getByLabelText(/compensation/i), validFormData.compensation)
      await user.type(screen.getByLabelText(/duration/i), validFormData.duration)
      await user.type(screen.getByLabelText(/application deadline/i), validFormData.applicationDeadline)

      // Select job type and department
      const selects = screen.getAllByTestId('select')
      fireEvent.change(selects[0], { target: { value: validFormData.jobType } })
      fireEvent.change(selects[1], { target: { value: validFormData.department } })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /post job/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(validFormData)
      })
    })

    it('should show loading state during submission', () => {
      render(<JobPostingForm {...defaultProps} isLoading={true} />)

      const submitButton = screen.getByRole('button', { name: /posting/i })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Posting...')
    })

    it('should disable all form fields during loading', () => {
      render(<JobPostingForm {...defaultProps} isLoading={true} />)

      const titleInput = screen.getByLabelText(/job title/i)
      const descriptionInput = screen.getByLabelText(/job description/i)
      const selects = screen.getAllByTestId('select')

      expect(titleInput).toBeDisabled()
      expect(descriptionInput).toBeDisabled()
      expect(selects[0]).toBeDisabled()
      expect(selects[1]).toBeDisabled()
    })
  })

  describe('Preview Functionality', () => {
    it('should call onPreview when preview button is clicked', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} />)

      // Fill required fields to enable preview
      await user.type(screen.getByLabelText(/job title/i), 'Test Job')
      await user.type(screen.getByLabelText(/job description/i), 'Test description')
      
      const selects = screen.getAllByTestId('select')
      fireEvent.change(selects[0], { target: { value: 'research_assistant' } })
      fireEvent.change(selects[1], { target: { value: 'Computer Science' } })

      const previewButton = screen.getByRole('button', { name: /preview/i })
      await user.click(previewButton)

      expect(mockOnPreview).toHaveBeenCalledWith({
        title: 'Test Job',
        description: 'Test description',
        requirements: '',
        compensation: '',
        jobType: 'research_assistant',
        department: 'Computer Science',
        duration: '',
        applicationDeadline: ''
      })
    })

    it('should disable preview button when form is invalid', () => {
      render(<JobPostingForm {...defaultProps} />)

      const previewButton = screen.getByRole('button', { name: /preview/i })
      expect(previewButton).toBeDisabled()
    })

    it('should not render preview button when onPreview is not provided', () => {
      render(<JobPostingForm {...defaultProps} onPreview={undefined} />)

      expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument()
    })
  })

  describe('Initial Data Population', () => {
    const initialJobData: Partial<JobPosting> = {
      title: 'Existing Job',
      description: 'Existing description',
      requirements: 'Existing requirements',
      compensation: '$20/hour',
      job_type: 'teaching_assistant',
      department: 'Mathematics',
      duration: '6 months',
      application_deadline: '2024-06-30'
    }

    it('should populate form with initial data', () => {
      render(<JobPostingForm {...defaultProps} initialData={initialJobData} />)

      expect(screen.getByDisplayValue('Existing Job')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing requirements')).toBeInTheDocument()
      expect(screen.getByDisplayValue('$20/hour')).toBeInTheDocument()
      expect(screen.getByDisplayValue('6 months')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-06-30')).toBeInTheDocument()
    })

    it('should enable submit button with valid initial data', () => {
      render(<JobPostingForm {...defaultProps} initialData={initialJobData} />)

      const submitButton = screen.getByRole('button', { name: /post job/i })
      expect(submitButton).toBeEnabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Failed to create job posting'
      render(<JobPostingForm {...defaultProps} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should style error message appropriately', () => {
      const errorMessage = 'Test error'
      render(<JobPostingForm {...defaultProps} error={errorMessage} />)

      const errorElement = screen.getByText(errorMessage)
      expect(errorElement).toHaveClass('text-red-600')
    })
  })

  describe('Job Type and Department Options', () => {
    it('should include all job type options', () => {
      render(<JobPostingForm {...defaultProps} />)

      const jobTypeOptions = [
        'Research Assistant',
        'Teaching Assistant', 
        'Work Study',
        'Internship',
        'Other'
      ]

      jobTypeOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument()
      })
    })

    it('should include all department options', () => {
      render(<JobPostingForm {...defaultProps} />)

      const departments = [
        'Biology',
        'Chemistry', 
        'Computer Science',
        'Mathematics',
        'Physics'
      ]

      departments.forEach(dept => {
        expect(screen.getByText(dept)).toBeInTheDocument()
      })
    })
  })

  describe('Form Field Updates', () => {
    it('should update form data when fields change', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/job title/i)
      await user.type(titleInput, 'New Job Title')

      expect(titleInput).toHaveValue('New Job Title')
    })

    it('should clear form data when fields are emptied', async () => {
      const user = userEvent.setup()
      render(<JobPostingForm {...defaultProps} initialData={{ title: 'Initial Title' }} />)

      const titleInput = screen.getByLabelText(/job title/i)
      await user.clear(titleInput)

      expect(titleInput).toHaveValue('')
    })
  })
})