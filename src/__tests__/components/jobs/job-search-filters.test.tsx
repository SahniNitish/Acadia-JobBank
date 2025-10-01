import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobSearchFilters, JobSearchFiltersProps } from '@/components/jobs/job-search-filters'

// Mock the UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select 
      data-testid="select" 
      onChange={(e) => onValueChange?.(e.target.value)}
      value={value}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

describe('JobSearchFilters', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnSearch = jest.fn()

  const defaultFilters = {
    search: '',
    department: '',
    jobType: '' as const
  }

  const defaultProps: JobSearchFiltersProps = {
    filters: defaultFilters,
    onFiltersChange: mockOnFiltersChange,
    onSearch: mockOnSearch,
    isLoading: false,
    showAdvancedFilters: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Search Input', () => {
    it('should render search input with placeholder', () => {
      render(<JobSearchFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should display current search value', () => {
      const filtersWithSearch = { ...defaultFilters, search: 'research assistant' }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithSearch} />)

      const searchInput = screen.getByDisplayValue('research assistant')
      expect(searchInput).toBeInTheDocument()
    })

    it('should call onFiltersChange when search input changes', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      await user.type(searchInput, 'test search')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test search'
      })
    })

    it('should call onSearch when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      await user.type(searchInput, 'test{enter}')

      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('should disable search input when loading', () => {
      render(<JobSearchFilters {...defaultProps} isLoading={true} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      expect(searchInput).toBeDisabled()
    })
  })

  describe('Search Button', () => {
    it('should render search button', () => {
      render(<JobSearchFilters {...defaultProps} />)

      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toBeInTheDocument()
    })

    it('should call onSearch when search button is clicked', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)

      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('should show loading state on search button', () => {
      render(<JobSearchFilters {...defaultProps} isLoading={true} />)

      const searchButton = screen.getByRole('button', { name: /searching/i })
      expect(searchButton).toBeDisabled()
    })
  })

  describe('Advanced Filters Toggle', () => {
    it('should render filters button when showAdvancedFilters is true', () => {
      render(<JobSearchFilters {...defaultProps} showAdvancedFilters={true} />)

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      expect(filtersButton).toBeInTheDocument()
    })

    it('should not render filters button when showAdvancedFilters is false', () => {
      render(<JobSearchFilters {...defaultProps} showAdvancedFilters={false} />)

      const filtersButton = screen.queryByRole('button', { name: /filters/i })
      expect(filtersButton).not.toBeInTheDocument()
    })

    it('should show filter count badge when filters are active', () => {
      const filtersWithActive = {
        search: '',
        department: 'Computer Science',
        jobType: 'research_assistant' as const
      }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithActive} />)

      // Should show count of 2 (department + jobType)
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should toggle advanced filters panel', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      
      // Initially, advanced filters should not be visible
      expect(screen.queryByText(/filter jobs/i)).not.toBeInTheDocument()

      // Click to show filters
      await user.click(filtersButton)
      expect(screen.getByText(/filter jobs/i)).toBeInTheDocument()

      // Click to hide filters
      await user.click(filtersButton)
      await waitFor(() => {
        expect(screen.queryByText(/filter jobs/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Department Filter', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)
      
      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)
    })

    it('should render department select with all options', () => {
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

    it('should show "All departments" as default option', () => {
      expect(screen.getByText('All departments')).toBeInTheDocument()
    })

    it('should call onFiltersChange when department is selected', async () => {
      const departmentSelect = screen.getAllByTestId('select')[0]
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } })

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        department: 'Computer Science'
      })
    })

    it('should display selected department', () => {
      const filtersWithDept = { ...defaultFilters, department: 'Mathematics' }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithDept} />)
      
      // Need to open filters first
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)

      const departmentSelect = screen.getAllByTestId('select')[0]
      expect(departmentSelect).toHaveValue('Mathematics')
    })
  })

  describe('Job Type Filter', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)
      
      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)
    })

    it('should render job type select with all options', () => {
      const jobTypes = [
        'Research Assistant',
        'Teaching Assistant',
        'Work Study',
        'Internship',
        'Other'
      ]

      jobTypes.forEach(type => {
        expect(screen.getByText(type)).toBeInTheDocument()
      })
    })

    it('should show "All job types" as default option', () => {
      expect(screen.getByText('All job types')).toBeInTheDocument()
    })

    it('should call onFiltersChange when job type is selected', async () => {
      const jobTypeSelect = screen.getAllByTestId('select')[1]
      fireEvent.change(jobTypeSelect, { target: { value: 'research_assistant' } })

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        jobType: 'research_assistant'
      })
    })

    it('should display selected job type', () => {
      const filtersWithJobType = { ...defaultFilters, jobType: 'teaching_assistant' as const }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithJobType} />)
      
      // Need to open filters first
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      fireEvent.click(filtersButton)

      const jobTypeSelect = screen.getAllByTestId('select')[1]
      expect(jobTypeSelect).toHaveValue('teaching_assistant')
    })
  })

  describe('Clear Filters', () => {
    it('should show clear button when filters are active', async () => {
      const user = userEvent.setup()
      const filtersWithActive = {
        search: '',
        department: 'Computer Science',
        jobType: 'research_assistant' as const
      }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithActive} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toBeInTheDocument()
    })

    it('should not show clear button when no filters are active', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const clearButton = screen.queryByRole('button', { name: /clear/i })
      expect(clearButton).not.toBeInTheDocument()
    })

    it('should clear all filters when clear button is clicked', async () => {
      const user = userEvent.setup()
      const filtersWithActive = {
        search: 'test',
        department: 'Computer Science',
        jobType: 'research_assistant' as const
      }
      render(<JobSearchFilters {...defaultProps} filters={filtersWithActive} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: '',
        department: '',
        jobType: ''
      })
    })
  })

  describe('Apply Filters Button', () => {
    it('should call onSearch when apply filters button is clicked', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      await user.click(applyButton)

      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('should disable apply button when loading', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} isLoading={true} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      expect(applyButton).toBeDisabled()
    })
  })

  describe('Close Filters Button', () => {
    it('should close advanced filters panel when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      expect(screen.getByText(/filter jobs/i)).toBeInTheDocument()

      // Close filters
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText(/filter jobs/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Filter Validation', () => {
    it('should handle empty filter values correctly', () => {
      const emptyFilters = {
        search: '',
        department: '',
        jobType: '' as const
      }
      render(<JobSearchFilters {...defaultProps} filters={emptyFilters} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      expect(searchInput).toHaveValue('')
    })

    it('should handle special characters in search', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      await user.type(searchInput, 'C++ & Java')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'C++ & Java'
      })
    })

    it('should handle long search queries', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const longQuery = 'This is a very long search query that might be used to find specific job postings'
      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      await user.type(searchInput, longQuery)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: longQuery
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form elements', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      // Open advanced filters
      const filtersButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filtersButton)

      expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job type/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<JobSearchFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText(/search jobs by title/i)
      
      // Focus should work
      await user.click(searchInput)
      expect(searchInput).toHaveFocus()

      // Tab navigation should work
      await user.tab()
      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toHaveFocus()
    })
  })
})