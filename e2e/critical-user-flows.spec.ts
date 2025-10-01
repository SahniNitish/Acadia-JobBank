import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.describe('Authentication Flow', () => {
    test('should allow faculty registration with university email', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Fill registration form
      await page.fill('input[name="email"]', 'newfaculty@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="fullName"]', 'Test Faculty');
      await page.selectOption('select[name="role"]', 'faculty');
      await page.selectOption('select[name="department"]', 'Computer Science');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to email confirmation
      await expect(page.locator('text=Check your email')).toBeVisible();
    });

    test('should reject non-university email registration', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Fill registration form with invalid email
      await page.fill('input[name="email"]', 'test@gmail.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="fullName"]', 'Test User');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Must use university email')).toBeVisible();
    });

    test('should allow student login and redirect to dashboard', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Fill login form
      await page.fill('input[name="email"]', 'student@acadiau.ca');
      await page.fill('input[name="password"]', 'testpassword123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('text=Student Dashboard')).toBeVisible();
    });
  });

  test.describe('Job Posting Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('faculty should create job posting successfully', async ({ page }) => {
      await page.goto('/jobs/create');
      
      // Fill job posting form
      await page.fill('input[name="title"]', 'Research Assistant Position');
      await page.fill('textarea[name="description"]', 'Looking for a research assistant to help with data analysis.');
      await page.fill('textarea[name="requirements"]', 'Strong analytical skills, Python experience preferred');
      await page.fill('input[name="compensation"]', '$15/hour');
      await page.selectOption('select[name="jobType"]', 'research_assistant');
      await page.selectOption('select[name="department"]', 'Computer Science');
      await page.fill('input[name="duration"]', '4 months');
      await page.fill('input[name="applicationDeadline"]', '2024-12-31');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to job listing
      await expect(page.locator('text=Job posted successfully')).toBeVisible();
      await expect(page.locator('text=Research Assistant Position')).toBeVisible();
    });

    test('should validate required fields in job posting', async ({ page }) => {
      await page.goto('/jobs/create');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Title is required')).toBeVisible();
      await expect(page.locator('text=Description is required')).toBeVisible();
    });
  });

  test.describe('Job Search and Application Flow', () => {
    test.use({ storageState: 'playwright/.auth/student.json' });

    test('student should search and filter jobs', async ({ page }) => {
      await page.goto('/jobs');
      
      // Wait for jobs to load
      await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
      
      // Search for jobs
      await page.fill('input[placeholder="Search jobs..."]', 'research');
      await page.press('input[placeholder="Search jobs..."]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Apply filters
      await page.selectOption('select[name="department"]', 'Computer Science');
      await page.selectOption('select[name="jobType"]', 'research_assistant');
      
      // Should show filtered results
      await expect(page.locator('[data-testid="job-card"]')).toBeVisible();
    });

    test('complete student application journey', async ({ page }) => {
      // Start from dashboard
      await page.goto('/dashboard');
      await expect(page.locator('text=Student Dashboard')).toBeVisible();
      
      // Navigate to jobs
      await page.click('text=Jobs');
      await page.waitForURL('/jobs');
      
      // Wait for jobs to load
      await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
      
      // Click on first available job
      await page.click('[data-testid="job-card"]:first-child');
      
      // Should see job details
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if apply button is available (not already applied)
      const applyButton = page.locator('button:has-text("Apply")');
      const alreadyApplied = page.locator('text=Already Applied');
      
      if (await applyButton.isVisible()) {
        // Click apply button
        await applyButton.click();
        
        // Fill application form
        await page.fill('textarea[name="coverLetter"]', 'I am very interested in this position and believe I would be a great fit. I have relevant experience and am eager to contribute to this role.');
        
        // Upload resume (mock file upload)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'resume.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 Mock PDF content for testing')
        });
        
        // Submit application
        await page.click('button[type="submit"]');
        
        // Should show success message or redirect
        await expect(page.locator('text=Application submitted')).toBeVisible({ timeout: 10000 });
        
        // Verify application appears in student's applications
        await page.goto('/applications');
        await expect(page.locator('text=My Applications')).toBeVisible();
      } else if (await alreadyApplied.isVisible()) {
        // Student has already applied to this job
        await expect(alreadyApplied).toBeVisible();
      }
    });

    test('should handle application errors gracefully', async ({ page }) => {
      await page.goto('/jobs');
      await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
      
      // Click on first job
      await page.click('[data-testid="job-card"]:first-child');
      
      const applyButton = page.locator('button:has-text("Apply")');
      if (await applyButton.isVisible()) {
        await applyButton.click();
        
        // Try to submit without required fields
        await page.click('button[type="submit"]');
        
        // Should show validation errors
        await expect(page.locator('text=required')).toBeVisible();
      }
    });
  });

  test.describe('Application Management Flow', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('faculty should view and manage applications', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click on a job posting with applications
      await page.click('[data-testid="job-with-applications"]:first-child');
      
      // Should see applications list
      await expect(page.locator('text=Applications')).toBeVisible();
      await expect(page.locator('[data-testid="application-row"]')).toBeVisible();
      
      // Click on an application to view details
      await page.click('[data-testid="application-row"]:first-child');
      
      // Should see application details
      await expect(page.locator('text=Cover Letter')).toBeVisible();
      await expect(page.locator('text=Resume')).toBeVisible();
      
      // Update application status
      await page.selectOption('select[name="status"]', 'reviewed');
      await page.click('button:has-text("Update Status")');
      
      // Should show success message
      await expect(page.locator('text=Status updated successfully')).toBeVisible();
    });
  });

  test.describe('Notification System', () => {
    test.use({ storageState: 'playwright/.auth/student.json' });

    test('should display notifications', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Click notification bell
      await page.click('[data-testid="notification-bell"]');
      
      // Should show notifications dropdown
      await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();
      
      // Should show notification items
      await expect(page.locator('[data-testid="notification-item"]')).toBeVisible();
    });

    test('should mark notifications as read', async ({ page }) => {
      await page.goto('/notifications');
      
      // Click on unread notification
      await page.click('[data-testid="unread-notification"]:first-child');
      
      // Should mark as read
      await expect(page.locator('[data-testid="unread-notification"]')).toHaveCount(0);
    });
  });

  test.describe('Profile Management', () => {
    test.use({ storageState: 'playwright/.auth/student.json' });

    test('should update profile information', async ({ page }) => {
      await page.goto('/profile/edit');
      
      // Update profile fields
      await page.fill('input[name="fullName"]', 'Updated Student Name');
      await page.selectOption('select[name="department"]', 'Mathematics');
      await page.selectOption('select[name="yearOfStudy"]', '3');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();
      
      // Verify changes are saved
      await page.reload();
      await expect(page.locator('input[name="fullName"]')).toHaveValue('Updated Student Name');
    });
  });

  test.describe('Admin Functions', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('admin should access user management', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see admin dashboard
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      
      // Click on user management
      await page.click('text=User Management');
      
      // Should see users list
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      
      // Should be able to deactivate user
      await page.click('[data-testid="deactivate-user"]:first-child');
      await page.click('button:has-text("Confirm")');
      
      // Should show success message
      await expect(page.locator('text=User deactivated successfully')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Should show mobile navigation
      await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
      
      // Click mobile menu
      await page.click('[data-testid="mobile-nav-toggle"]');
      
      // Should show mobile menu
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      
      // Navigate to jobs page
      await page.click('text=Jobs');
      await page.waitForURL('/jobs');
      
      // Should display jobs in mobile layout
      await expect(page.locator('[data-testid="job-card"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/jobs');
      
      // Should show error message
      await expect(page.locator('text=Unable to load jobs')).toBeVisible();
      
      // Should show retry button
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should handle 404 pages', async ({ page }) => {
      await page.goto('/nonexistent-page');
      
      // Should show 404 page
      await expect(page.locator('text=Page Not Found')).toBeVisible();
      await expect(page.locator('text=Go Home')).toBeVisible();
    });
  });
});