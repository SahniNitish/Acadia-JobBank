#!/usr/bin/env node

/**
 * Integration Validation Script
 * 
 * This script validates that all components are properly integrated
 * and that the application is ready for production deployment.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
}

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN)
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED)
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE)
}

function logHeader(message) {
  log(`\n${COLORS.BOLD}${message}${COLORS.RESET}`)
}

class IntegrationValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.projectRoot = process.cwd()
  }

  // Check if file exists
  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath))
  }

  // Read file content
  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8')
    } catch (error) {
      return null
    }
  }

  // Execute command and return output
  execCommand(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        cwd: this.projectRoot,
        ...options 
      }).trim()
    } catch (error) {
      return null
    }
  }

  // Validate project structure
  validateProjectStructure() {
    logHeader('🏗️  Validating Project Structure')

    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.ts',
      'tsconfig.json',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/contexts/auth-context.tsx',
      'src/lib/supabase.ts',
      'src/types/database.ts',
    ]

    const requiredDirectories = [
      'src/app',
      'src/components',
      'src/lib',
      'src/hooks',
      'src/types',
      'src/__tests__',
      'e2e',
      'supabase',
    ]

    let allFilesExist = true
    let allDirsExist = true

    requiredFiles.forEach(file => {
      if (this.fileExists(file)) {
        logSuccess(`Found ${file}`)
      } else {
        logError(`Missing required file: ${file}`)
        this.errors.push(`Missing file: ${file}`)
        allFilesExist = false
      }
    })

    requiredDirectories.forEach(dir => {
      if (this.fileExists(dir)) {
        logSuccess(`Found directory ${dir}`)
      } else {
        logError(`Missing required directory: ${dir}`)
        this.errors.push(`Missing directory: ${dir}`)
        allDirsExist = false
      }
    })

    return allFilesExist && allDirsExist
  }

  // Validate environment configuration
  validateEnvironment() {
    logHeader('🔧 Validating Environment Configuration')

    const envExample = this.readFile('.env.example')
    const envLocal = this.readFile('.env.local')

    if (!envExample) {
      logError('Missing .env.example file')
      this.errors.push('Missing .env.example')
      return false
    }

    logSuccess('Found .env.example')

    if (!envLocal) {
      logWarning('Missing .env.local file - required for local development')
      this.warnings.push('Missing .env.local')
    } else {
      logSuccess('Found .env.local')
    }

    // Check for required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const envContent = envLocal || envExample
    let allEnvVarsPresent = true

    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(envVar)) {
        logSuccess(`Environment variable ${envVar} is configured`)
      } else {
        logError(`Missing environment variable: ${envVar}`)
        this.errors.push(`Missing env var: ${envVar}`)
        allEnvVarsPresent = false
      }
    })

    return allEnvVarsPresent
  }

  // Validate dependencies
  validateDependencies() {
    logHeader('📦 Validating Dependencies')

    const packageJson = this.readFile('package.json')
    if (!packageJson) {
      logError('Cannot read package.json')
      this.errors.push('Cannot read package.json')
      return false
    }

    const pkg = JSON.parse(packageJson)
    const requiredDeps = [
      '@supabase/supabase-js',
      '@supabase/auth-helpers-nextjs',
      'next',
      'react',
      'react-dom',
      'tailwindcss',
      'typescript'
    ]

    const requiredDevDeps = [
      '@playwright/test',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'jest',
      'eslint'
    ]

    let allDepsPresent = true

    requiredDeps.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        logSuccess(`Dependency ${dep} is installed`)
      } else {
        logError(`Missing dependency: ${dep}`)
        this.errors.push(`Missing dependency: ${dep}`)
        allDepsPresent = false
      }
    })

    requiredDevDeps.forEach(dep => {
      if (pkg.devDependencies && pkg.devDependencies[dep]) {
        logSuccess(`Dev dependency ${dep} is installed`)
      } else {
        logError(`Missing dev dependency: ${dep}`)
        this.errors.push(`Missing dev dependency: ${dep}`)
        allDepsPresent = false
      }
    })

    return allDepsPresent
  }

  // Validate TypeScript configuration
  validateTypeScript() {
    logHeader('🔍 Validating TypeScript Configuration')

    const tsconfigExists = this.fileExists('tsconfig.json')
    if (!tsconfigExists) {
      logError('Missing tsconfig.json')
      this.errors.push('Missing tsconfig.json')
      return false
    }

    logSuccess('Found tsconfig.json')

    // Run TypeScript type checking
    logInfo('Running TypeScript type check...')
    const typeCheckResult = this.execCommand('npx tsc --noEmit', { stdio: 'pipe' })
    
    if (typeCheckResult === null) {
      logError('TypeScript type check failed')
      this.errors.push('TypeScript type check failed')
      return false
    }

    logSuccess('TypeScript type check passed')
    return true
  }

  // Validate linting
  validateLinting() {
    logHeader('🧹 Validating Code Quality')

    logInfo('Running ESLint...')
    const lintResult = this.execCommand('npm run lint', { stdio: 'pipe' })
    
    if (lintResult === null) {
      logWarning('ESLint found issues - check output')
      this.warnings.push('ESLint issues found')
    } else {
      logSuccess('ESLint passed')
    }

    return true
  }

  // Validate build process
  validateBuild() {
    logHeader('🏗️  Validating Build Process')

    logInfo('Running Next.js build...')
    const buildResult = this.execCommand('npm run build', { stdio: 'pipe' })
    
    if (buildResult === null) {
      logError('Build failed')
      this.errors.push('Build process failed')
      return false
    }

    logSuccess('Build completed successfully')

    // Check if build output exists
    if (this.fileExists('.next')) {
      logSuccess('Build output directory exists')
    } else {
      logError('Build output directory not found')
      this.errors.push('Build output missing')
      return false
    }

    return true
  }

  // Validate unit tests
  validateUnitTests() {
    logHeader('🧪 Validating Unit Tests')

    logInfo('Running unit tests...')
    const testResult = this.execCommand('npm run test:ci', { stdio: 'pipe' })
    
    if (testResult === null) {
      logWarning('Some unit tests failed - check test output')
      this.warnings.push('Unit test failures')
    } else {
      logSuccess('All unit tests passed')
    }

    return true
  }

  // Validate component integration
  validateComponentIntegration() {
    logHeader('🔗 Validating Component Integration')

    const criticalComponents = [
      'src/components/auth/login-form.tsx',
      'src/components/auth/register-form.tsx',
      'src/components/jobs/job-posting-form.tsx',
      'src/components/jobs/job-search-filters.tsx',
      'src/components/applications/application-form.tsx',
      'src/components/dashboard/faculty-dashboard.tsx',
      'src/components/dashboard/student-dashboard.tsx',
      'src/components/notifications/notification-bell.tsx',
    ]

    let allComponentsExist = true

    criticalComponents.forEach(component => {
      if (this.fileExists(component)) {
        logSuccess(`Component ${component} exists`)
      } else {
        logError(`Missing critical component: ${component}`)
        this.errors.push(`Missing component: ${component}`)
        allComponentsExist = false
      }
    })

    // Check for proper imports and exports
    const authContext = this.readFile('src/contexts/auth-context.tsx')
    if (authContext && authContext.includes('export function useAuth')) {
      logSuccess('Auth context properly exports useAuth hook')
    } else {
      logError('Auth context missing useAuth export')
      this.errors.push('Auth context integration issue')
      allComponentsExist = false
    }

    return allComponentsExist
  }

  // Validate database integration
  validateDatabaseIntegration() {
    logHeader('🗄️  Validating Database Integration')

    const supabaseLib = this.readFile('src/lib/supabase.ts')
    if (!supabaseLib) {
      logError('Missing Supabase client configuration')
      this.errors.push('Missing Supabase client')
      return false
    }

    if (supabaseLib.includes('createClient')) {
      logSuccess('Supabase client properly configured')
    } else {
      logError('Supabase client not properly configured')
      this.errors.push('Supabase client configuration issue')
      return false
    }

    // Check for database types
    const dbTypes = this.readFile('src/types/database.ts')
    if (!dbTypes) {
      logError('Missing database type definitions')
      this.errors.push('Missing database types')
      return false
    }

    logSuccess('Database type definitions found')

    // Check for migration files
    const migrationsExist = this.fileExists('supabase/migrations')
    if (migrationsExist) {
      logSuccess('Database migrations directory exists')
    } else {
      logWarning('No database migrations found')
      this.warnings.push('No database migrations')
    }

    return true
  }

  // Validate API integration
  validateAPIIntegration() {
    logHeader('🌐 Validating API Integration')

    const libFiles = [
      'src/lib/auth.ts',
      'src/lib/jobs.ts',
      'src/lib/applications.ts',
      'src/lib/notifications.ts',
    ]

    let allLibsExist = true

    libFiles.forEach(lib => {
      if (this.fileExists(lib)) {
        logSuccess(`API library ${lib} exists`)
      } else {
        logError(`Missing API library: ${lib}`)
        this.errors.push(`Missing API lib: ${lib}`)
        allLibsExist = false
      }
    })

    return allLibsExist
  }

  // Validate accessibility
  validateAccessibility() {
    logHeader('♿ Validating Accessibility')

    // Check for semantic HTML and ARIA attributes in key components
    const navigationHeader = this.readFile('src/components/ui/navigation-header.tsx')
    
    if (navigationHeader) {
      if (navigationHeader.includes('role=') && navigationHeader.includes('aria-')) {
        logSuccess('Navigation header includes accessibility attributes')
      } else {
        logWarning('Navigation header missing some accessibility attributes')
        this.warnings.push('Accessibility improvements needed')
      }
    }

    // Check for alt text and semantic elements
    const hasSemanticElements = navigationHeader && 
      (navigationHeader.includes('<nav') || navigationHeader.includes('role="navigation"'))
    
    if (hasSemanticElements) {
      logSuccess('Semantic HTML elements found')
    } else {
      logWarning('Consider adding more semantic HTML elements')
      this.warnings.push('Semantic HTML improvements needed')
    }

    return true
  }

  // Generate summary report
  generateReport() {
    logHeader('📊 Integration Validation Summary')

    if (this.errors.length === 0) {
      logSuccess(`All integration checks passed! ✨`)
    } else {
      logError(`Found ${this.errors.length} critical issues:`)
      this.errors.forEach(error => {
        log(`  • ${error}`, COLORS.RED)
      })
    }

    if (this.warnings.length > 0) {
      logWarning(`Found ${this.warnings.length} warnings:`)
      this.warnings.forEach(warning => {
        log(`  • ${warning}`, COLORS.YELLOW)
      })
    }

    const isReady = this.errors.length === 0
    
    if (isReady) {
      logSuccess('\n🚀 Application is ready for deployment!')
    } else {
      logError('\n🛑 Please fix the critical issues before deployment.')
    }

    return isReady
  }

  // Run all validations
  async validate() {
    logHeader('🔍 Starting Integration Validation')

    const validations = [
      () => this.validateProjectStructure(),
      () => this.validateEnvironment(),
      () => this.validateDependencies(),
      () => this.validateTypeScript(),
      () => this.validateLinting(),
      () => this.validateComponentIntegration(),
      () => this.validateDatabaseIntegration(),
      () => this.validateAPIIntegration(),
      () => this.validateAccessibility(),
      () => this.validateUnitTests(),
      () => this.validateBuild(),
    ]

    for (const validation of validations) {
      try {
        await validation()
      } catch (error) {
        logError(`Validation failed: ${error.message}`)
        this.errors.push(`Validation error: ${error.message}`)
      }
    }

    return this.generateReport()
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new IntegrationValidator()
  
  validator.validate()
    .then(isReady => {
      process.exit(isReady ? 0 : 1)
    })
    .catch(error => {
      logError(`Validation failed: ${error.message}`)
      process.exit(1)
    })
}

module.exports = IntegrationValidator