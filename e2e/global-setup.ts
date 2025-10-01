import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up test environment...');
  
  // Create test users if they don't exist
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Check if we can access the application
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Application is accessible');
    
    // You could add test user creation logic here
    // For now, we assume test users exist in the database
    
  } catch (error) {
    console.error('❌ Failed to access application:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Test environment setup complete');
}

export default globalSetup;