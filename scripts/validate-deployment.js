#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deployment validation script
 * Runs comprehensive checks before and after deployment
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://university-job-bank.vercel.app';
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🚀 Starting deployment validation...\n');

// Pre-deployment checks
console.log('📋 Running pre-deployment checks...');

// Check environment variables
console.log('🔍 Checking environment variables...');
const missingEnvVars = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}
console.log('✅ All required environment variables are set');

// Check TypeScript compilation
console.log('🔍 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Run unit tests
console.log('🔍 Running unit tests...');
try {
  execSync('npm run test:ci', { stdio: 'inherit' });
  console.log('✅ Unit tests passed');
} catch (error) {
  console.error('❌ Unit tests failed');
  process.exit(1);
}

// Check build
console.log('🔍 Testing production build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Production build successful');
} catch (error) {
  console.error('❌ Production build failed');
  process.exit(1);
}

// Lint check
console.log('🔍 Running linter...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting passed');
} catch (error) {
  console.error('❌ Linting failed');
  process.exit(1);
}

// Check for security vulnerabilities
console.log('🔍 Checking for security vulnerabilities...');
try {
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  console.log('✅ No high-severity vulnerabilities found');
} catch (error) {
  console.warn('⚠️  Security vulnerabilities detected, please review');
}

// Check bundle size
console.log('🔍 Analyzing bundle size...');
const buildDir = path.join(process.cwd(), '.next');
if (fs.existsSync(buildDir)) {
  try {
    const stats = execSync('du -sh .next', { encoding: 'utf8' });
    console.log('📦 Build size:', stats.trim());
    
    // Check if build size is reasonable (under 50MB)
    const sizeMatch = stats.match(/(\d+(?:\.\d+)?)(M|G)/);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2];
      
      if (unit === 'G' || (unit === 'M' && size > 50)) {
        console.warn('⚠️  Build size is quite large, consider optimization');
      } else {
        console.log('✅ Build size is reasonable');
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not analyze build size');
  }
}

console.log('\n✅ Pre-deployment validation completed successfully!');

// If SKIP_E2E is set, skip end-to-end tests
if (process.env.SKIP_E2E === 'true') {
  console.log('⏭️  Skipping end-to-end tests (SKIP_E2E=true)');
  process.exit(0);
}

// Post-deployment checks (if production URL is accessible)
console.log('\n📋 Running post-deployment checks...');

// Health check
console.log('🔍 Checking production health...');
try {
  const response = execSync(`curl -f -s ${PRODUCTION_URL}/api/health`, { encoding: 'utf8' });
  const healthData = JSON.parse(response);
  
  if (healthData.status === 'healthy') {
    console.log('✅ Production health check passed');
  } else {
    console.error('❌ Production health check failed:', healthData);
    process.exit(1);
  }
} catch (error) {
  console.warn('⚠️  Could not perform health check (site may not be deployed yet)');
}

// Run end-to-end tests against production
console.log('🔍 Running end-to-end tests...');
try {
  process.env.PLAYWRIGHT_TEST_BASE_URL = PRODUCTION_URL;
  execSync('npx playwright test --project=chromium', { stdio: 'inherit' });
  console.log('✅ End-to-end tests passed');
} catch (error) {
  console.error('❌ End-to-end tests failed');
  process.exit(1);
}

console.log('\n🎉 Deployment validation completed successfully!');
console.log(`🌐 Production site: ${PRODUCTION_URL}`);