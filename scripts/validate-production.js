#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all required environment variables and configurations are set
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironmentVariables() {
  log('🔍 Validating environment variables...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missingVars.forEach(varName => {
      log(`   - ${varName}`, 'red');
    });
    return false;
  }
  
  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    log('❌ Invalid Supabase URL format', 'red');
    return false;
  }
  
  // Validate key formats
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (anonKey.length < 100 || serviceKey.length < 100) {
    log('❌ Supabase keys appear to be invalid (too short)', 'red');
    return false;
  }
  
  log('✅ All environment variables are valid', 'green');
  return true;
}

function validateConfigFiles() {
  log('📁 Validating configuration files...', 'blue');
  
  const requiredFiles = [
    'next.config.js',
    'vercel.json',
    'package.json',
    'supabase/config.toml'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(filePath => {
    if (!fs.existsSync(path.join(process.cwd(), filePath))) {
      missingFiles.push(filePath);
    }
  });
  
  if (missingFiles.length > 0) {
    log('❌ Missing required configuration files:', 'red');
    missingFiles.forEach(filePath => {
      log(`   - ${filePath}`, 'red');
    });
    return false;
  }
  
  log('✅ All configuration files present', 'green');
  return true;
}

function validatePackageJson() {
  log('📦 Validating package.json...', 'blue');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'test'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      log('❌ Missing required scripts in package.json:', 'red');
      missingScripts.forEach(script => {
        log(`   - ${script}`, 'red');
      });
      return false;
    }
    
    // Check Node.js version requirement
    if (!packageJson.engines || !packageJson.engines.node) {
      log('⚠️  Warning: No Node.js version specified in engines', 'yellow');
    }
    
    log('✅ package.json is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function validateVercelConfig() {
  log('🌐 Validating Vercel configuration...', 'blue');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // Check framework
    if (vercelConfig.framework !== 'nextjs') {
      log('❌ Vercel framework should be set to "nextjs"', 'red');
      return false;
    }
    
    // Check build command
    if (vercelConfig.buildCommand !== 'npm run build') {
      log('❌ Vercel build command should be "npm run build"', 'red');
      return false;
    }
    
    log('✅ Vercel configuration is valid', 'green');
    return true;
  } catch (error) {
    log(`❌ Error reading vercel.json: ${error.message}`, 'red');
    return false;
  }
}

async function validateSupabaseConnection() {
  log('🗄️  Validating Supabase connection...', 'blue');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log('❌ Supabase credentials not available', 'red');
      return false;
    }
    
    // Simple fetch to test connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      log(`❌ Supabase connection failed: ${response.status} ${response.statusText}`, 'red');
      return false;
    }
    
    log('✅ Supabase connection successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Supabase connection error: ${error.message}`, 'red');
    return false;
  }
}

function validateSecurityHeaders() {
  log('🔒 Validating security configuration...', 'blue');
  
  try {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    // Check for security headers
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security'
    ];
    
    const missingHeaders = securityHeaders.filter(header => !nextConfig.includes(header));
    
    if (missingHeaders.length > 0) {
      log('⚠️  Warning: Missing security headers:', 'yellow');
      missingHeaders.forEach(header => {
        log(`   - ${header}`, 'yellow');
      });
    } else {
      log('✅ Security headers configured', 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error validating security configuration: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 University Job Bank - Production Validation', 'blue');
  log('================================================', 'blue');
  
  const validations = [
    validateEnvironmentVariables(),
    validateConfigFiles(),
    validatePackageJson(),
    validateVercelConfig(),
    validateSecurityHeaders()
  ];
  
  // Async validations
  const asyncValidations = [
    validateSupabaseConnection()
  ];
  
  const asyncResults = await Promise.all(asyncValidations);
  const allResults = [...validations, ...asyncResults];
  
  const passed = allResults.filter(result => result === true).length;
  const total = allResults.length;
  
  log('\n📊 Validation Summary:', 'blue');
  log(`   Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All validations passed! Ready for production deployment.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some validations failed. Please fix the issues before deploying.', 'red');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    log(`💥 Validation script error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  validateEnvironmentVariables,
  validateConfigFiles,
  validatePackageJson,
  validateVercelConfig,
  validateSupabaseConnection,
  validateSecurityHeaders
};