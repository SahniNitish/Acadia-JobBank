import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as faculty', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login');
  
  // Fill in faculty credentials
  await page.fill('input[name="email"]', 'faculty@acadiau.ca');
  await page.fill('input[name="password"]', 'testpassword123');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('authenticate as student', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login');
  
  // Fill in student credentials
  await page.fill('input[name="email"]', 'student@acadiau.ca');
  await page.fill('input[name="password"]', 'testpassword123');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/student.json' });
});