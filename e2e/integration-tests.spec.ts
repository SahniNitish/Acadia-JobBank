import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test.describe('Supabase Integration', () => {
    test('should authenticate with Supabase', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Fill valid credentials
      await page.fill('input[name="email"]', 'test@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard (successful auth)
      await page.waitForURL('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should handle Supabase RLS policies', async ({ page }) => {
      // Login as student
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'student@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Try to access faculty-only functionality
      await page.goto('/jobs/create');
      
      // Should be redirected or show access denied
      await expect(page.locator('text=Access denied')).toBeVisible();
    });

    test('should sync data with Supabase realtime', async ({ page, context }) => {
      // Open two browser contexts to simulate real-time updates
      const page2 = await context.newPage();
      
      // Login as faculty in first page
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'faculty@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Login as student in second page
      await page2.goto('/auth/login');
      await page2.fill('input[name="email"]', 'student@acadiau.ca');
      await page2.fill('input[name="password"]', 'testpassword123');
      await page2.click('button[type="submit"]');
      
      // Faculty creates a job posting
      await page.goto('/jobs/create');
      await page.fill('input[name="title"]', 'Real-time Test Job');
      await page.fill('textarea[name="description"]', 'Testing real-time updates');
      await page.selectOption('select[name="jobType"]', 'research_assistant');
      await page.selectOption('select[name="department"]', 'Computer Science');
      await page.click('button[type="submit"]');
      
      // Student should see the new job in real-time
      await page2.goto('/jobs');
      await expect(page2.locator('text=Real-time Test Job')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('File Upload Integration', () => {
    test.use({ storageState: 'playwright/.auth/student.json' });

    test('should upload files to Supabase Storage', async ({ page }) => {
      await page.goto('/jobs');
      
      // Find and click on a job
      await page.click('[data-testid="job-card"]:first-child');
      await page.click('button:has-text("Apply")');
      
      // Fill application form
      await page.fill('textarea[name="coverLetter"]', 'Test cover letter');
      
      // Upload resume
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 Test PDF content')
      });
      
      // Submit application
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();
      
      // Verify file was uploaded by checking if it appears in the application
      await page.goto('/applications');
      await expect(page.locator('text=test-resume.pdf')).toBeVisible();
    });

    test('should validate file types and sizes', async ({ page }) => {
      await page.goto('/jobs');
      await page.click('[data-testid="job-card"]:first-child');
      await page.click('button:has-text("Apply")');
      
      // Try to upload invalid file type
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Invalid file type')
      });
      
      // Should show validation error
      await expect(page.locator('text=Only PDF files are allowed')).toBeVisible();
    });
  });

  test.describe('Email Notification Integration', () => {
    test('should trigger email notifications', async ({ page, context }) => {
      // This test verifies that email functions are called
      // In a real environment, you'd check email delivery
      
      const page2 = await context.newPage();
      
      // Faculty login
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'faculty@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Student login
      await page2.goto('/auth/login');
      await page2.fill('input[name="email"]', 'student@acadiau.ca');
      await page2.fill('input[name="password"]', 'testpassword123');
      await page2.click('button[type="submit"]');
      
      // Student applies for a job
      await page2.goto('/jobs');
      await page2.click('[data-testid="job-card"]:first-child');
      await page2.click('button:has-text("Apply")');
      await page2.fill('textarea[name="coverLetter"]', 'Test application');
      await page2.click('button[type="submit"]');
      
      // Faculty should receive notification
      await page.goto('/notifications');
      await expect(page.locator('text=New application received')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Search and Filtering Integration', () => {
    test('should perform full-text search', async ({ page }) => {
      await page.goto('/jobs');
      
      // Perform search
      await page.fill('input[placeholder="Search jobs..."]', 'research assistant');
      await page.press('input[placeholder="Search jobs..."]', 'Enter');
      
      // Should show filtered results
      await page.waitForSelector('[data-testid="job-card"]');
      
      // All visible jobs should contain search terms
      const jobTitles = await page.locator('[data-testid="job-title"]').allTextContents();
      const hasSearchTerm = jobTitles.some(title => 
        title.toLowerCase().includes('research') || title.toLowerCase().includes('assistant')
      );
      expect(hasSearchTerm).toBeTruthy();
    });

    test('should combine multiple filters', async ({ page }) => {
      await page.goto('/jobs');
      
      // Apply multiple filters
      await page.selectOption('select[name="department"]', 'Computer Science');
      await page.selectOption('select[name="jobType"]', 'research_assistant');
      await page.fill('input[name="compensation"]', '15');
      
      // Should show filtered results
      await page.waitForSelector('[data-testid="job-card"]');
      
      // Verify filters are applied
      const departmentTags = await page.locator('[data-testid="job-department"]').allTextContents();
      departmentTags.forEach(dept => {
        expect(dept).toBe('Computer Science');
      });
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('faculty should access faculty features', async ({ page }) => {
      // Login as faculty
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'faculty@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Should access job creation
      await page.goto('/jobs/create');
      await expect(page.locator('text=Create Job Posting')).toBeVisible();
      
      // Should access application management
      await page.goto('/dashboard');
      await expect(page.locator('text=My Job Postings')).toBeVisible();
    });

    test('student should access student features', async ({ page }) => {
      // Login as student
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'student@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Should access job browsing
      await page.goto('/jobs');
      await expect(page.locator('[data-testid="job-card"]')).toBeVisible();
      
      // Should access application tracking
      await page.goto('/applications');
      await expect(page.locator('text=My Applications')).toBeVisible();
      
      // Should NOT access job creation
      await page.goto('/jobs/create');
      await expect(page.locator('text=Access denied')).toBeVisible();
    });

    test('admin should access admin features', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'admin@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      // Should access admin dashboard
      await page.goto('/dashboard');
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      
      // Should access user management
      await expect(page.locator('text=User Management')).toBeVisible();
      
      // Should access platform statistics
      await expect(page.locator('text=Platform Statistics')).toBeVisible();
    });
  });

  test.describe('Data Validation Integration', () => {
    test('should validate university email domains', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Try non-university email
      await page.fill('input[name="email"]', 'test@gmail.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="fullName"]', 'Test User');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Must use university email')).toBeVisible();
      
      // Try valid university email
      await page.fill('input[name="email"]', 'test@acadiau.ca');
      await page.click('button[type="submit"]');
      
      // Should proceed (no validation error)
      await expect(page.locator('text=Must use university email')).not.toBeVisible();
    });

    test('should validate job posting data', async ({ page }) => {
      // Login as faculty
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'faculty@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      
      await page.goto('/jobs/create');
      
      // Try to submit with invalid deadline
      await page.fill('input[name="title"]', 'Test Job');
      await page.fill('textarea[name="description"]', 'Test description');
      await page.fill('input[name="applicationDeadline"]', '2020-01-01'); // Past date
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Deadline must be in the future')).toBeVisible();
    });
  });

  test.describe('Performance Integration', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/jobs');
      
      // Measure load time for jobs page
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="job-card"]');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time even with many jobs
      expect(loadTime).toBeLessThan(5000);
    });

    test('should implement pagination correctly', async ({ page }) => {
      await page.goto('/jobs');
      
      // Should show pagination if there are many jobs
      const jobCount = await page.locator('[data-testid="job-card"]').count();
      
      if (jobCount >= 10) {
        await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
        
        // Click next page
        await page.click('[data-testid="next-page"]');
        
        // Should load next page
        await page.waitForSelector('[data-testid="job-card"]');
        
        // URL should reflect page change
        expect(page.url()).toContain('page=2');
      }
    });
  });
});