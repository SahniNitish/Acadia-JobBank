import { test, expect } from '@playwright/test';

test.describe('Production Deployment Tests', () => {
  const productionUrl = process.env.PRODUCTION_URL || 'https://university-job-bank.vercel.app';

  test.describe('Production Environment Health', () => {
    test('should have healthy production deployment', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Should load without errors
      await expect(page).toHaveTitle(/University Job Bank/);
      
      // Should not show development indicators
      await expect(page.locator('text=localhost')).not.toBeVisible();
      await expect(page.locator('text=development')).not.toBeVisible();
    });

    test('should have working health check endpoint', async ({ request }) => {
      const response = await request.get(`${productionUrl}/api/health`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
    });

    test('should serve static assets correctly', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Check that CSS is loaded
      const styles = await page.locator('link[rel="stylesheet"]').count();
      expect(styles).toBeGreaterThan(0);
      
      // Check that favicon is loaded
      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toHaveAttribute('href');
    });

    test('should have proper security headers', async ({ request }) => {
      const response = await request.get(productionUrl);
      
      // Check for security headers
      expect(response.headers()['x-frame-options']).toBeDefined();
      expect(response.headers()['x-content-type-options']).toBe('nosniff');
      expect(response.headers()['strict-transport-security']).toBeDefined();
    });
  });

  test.describe('Database Connectivity', () => {
    test('should connect to production database', async ({ page }) => {
      await page.goto(`${productionUrl}/auth/login`);
      
      // Try to login (this tests database connectivity)
      await page.fill('input[name="email"]', 'test@acadiau.ca');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should get authentication error (not connection error)
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should handle database queries efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${productionUrl}/jobs`);
      
      // Wait for jobs to load
      await page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (10 seconds)
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('File Storage Integration', () => {
    test('should handle file uploads in production', async ({ page }) => {
      // This would require authentication, so we'll test the upload endpoint availability
      const response = await page.request.get(`${productionUrl}/api/upload`);
      
      // Should return method not allowed (not server error)
      expect([405, 401]).toContain(response.status());
    });
  });

  test.describe('Email Service Integration', () => {
    test('should have email service configured', async ({ request }) => {
      // Test that email functions are deployed
      const response = await request.get(`${productionUrl}/.netlify/functions/send-email-notification`);
      
      // Should not return 404 (function exists)
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('Performance Tests', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Measure First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });
        });
      });
      
      // FCP should be under 2.5 seconds
      expect(fcp).toBeLessThan(2500);
    });

    test('should handle concurrent users', async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);

      const pages = await Promise.all(contexts.map(context => context.newPage()));

      // Simulate 5 concurrent users loading the site
      const startTime = Date.now();
      
      await Promise.all(pages.map(page => page.goto(productionUrl)));
      
      const loadTime = Date.now() - startTime;
      
      // Should handle concurrent load within reasonable time
      expect(loadTime).toBeLessThan(15000);

      // Clean up
      await Promise.all(contexts.map(context => context.close()));
    });
  });

  test.describe('SEO and Accessibility', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Check meta tags
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content');
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content');
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content');
    });

    test('should be accessible', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Check for accessibility landmarks
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Check for proper heading structure
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Error Handling in Production', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      const response = await page.goto(`${productionUrl}/nonexistent-page`);
      
      expect(response?.status()).toBe(404);
      
      // Should show custom 404 page
      await expect(page.locator('text=Page Not Found')).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Intercept API calls and make them fail
      await page.route('**/api/**', route => route.abort());
      
      // Navigate to a page that requires API calls
      await page.goto(`${productionUrl}/jobs`);
      
      // Should show error state, not crash
      await expect(page.locator('text=Unable to load')).toBeVisible();
    });
  });

  test.describe('Monitoring and Logging', () => {
    test('should log errors properly', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(productionUrl);
      
      // Should not have console errors on normal page load
      expect(consoleErrors.length).toBe(0);
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      await page.goto(productionUrl);
      
      // Inject a JavaScript error
      await page.evaluate(() => {
        throw new Error('Test error');
      });
      
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });
});