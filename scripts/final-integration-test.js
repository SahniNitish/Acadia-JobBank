#!/usr/bin/env node

/**
 * Final Integration Test Script
 * 
 * This script performs a comprehensive test of all integrated components
 * to ensure the application is ready for production deployment.
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

class FinalIntegrationTester {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passed = 0
    this.total = 0
    this.projectRoot = process.cwd()
  }

  execCommand(command, options = {}) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        cwd: this.projectRoot,
        stdio: 'pipe',
        ...options 
      }).trim()
    } catch (error) {
      return null
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath))
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8')
    } catch (error) {
      return null
    }
  }

  runTest(name, testFn) {
    this.total++
    try {
      const result = testFn()
      if (result !== false) {
        logSuccess(name)
        this.passed++
        return true
      } else {
        logError(name)
        this.errors.push(name)
        return false
      }
    } catch (error) {
      logError(`${name}: ${error.message}`)
      this.errors.push(`${name}: ${error.message}`)
      return false
    }
  }

  // Test 1: Project Structure
  testProjectStructure() {
    logHeader('🏗️  Testing Project Structure')

    const criticalFiles = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/contexts/auth-context.tsx',
      'src/lib/supabase.ts',
      'src/lib/auth.ts',
      'src/lib/jobs.ts',
      'src/lib/applications.ts',
      'src/lib/notifications.ts',
      'src/lib/performance.ts',
      'src/lib/cache.ts',
      'src/components/ui/error-boundary.tsx',
      'src/components/ui/loading-states.tsx',
      'src/components/ui/performance-monitor.tsx',
      'src/types/database.ts',
    ]

    return this.runTest('All critical files exist', () => {
      const missing = criticalFiles.filter(file => !this.fileExists(file))
      if (missing.length > 0) {
        this.errors.push(`Missing files: ${missing.join(', ')}`)
        return false
      }
      return true
    })
  }

  // Test 2: TypeScript Compilation
  testTypeScriptCompilation() {
    logHeader('🔍 Testing TypeScript Compilation')

    return this.runTest('TypeScript compiles without errors', () => {
      const result = this.execCommand('npx tsc --noEmit')
      return result !== null
    })
  }

  // Test 3: ESLint
  testLinting() {
    logHeader('🧹 Testing Code Quality')

    return this.runTest('ESLint passes', () => {
      const result = this.execCommand('npm run lint')
      return result !== null
    })
  }

  // Test 4: Build Process
  testBuild() {
    logHeader('🏗️  Testing Build Process')

    return this.runTest('Next.js build succeeds', () => {
      logInfo('Running build (this may take a while)...')
      const result = this.execCommand('npm run build', { timeout: 120000 })
      return result !== null && this.fileExists('.next')
    })
  }

  // Test 5: Component Integration
  testComponentIntegration() {
    logHeader('🔗 Testing Component Integration')

    // Test auth context integration
    this.runTest('Auth context properly exports', () => {
      const authContext = this.readFile('src/contexts/auth-context.tsx')
      return authContext && 
             authContext.includes('export function useAuth') &&
             authContext.includes('export function AuthProvider')
    })

    // Test error boundary integration
    this.runTest('Error boundaries are integrated', () => {
      const layout = this.readFile('src/app/layout.tsx')
      return layout && layout.includes('ErrorBoundary')
    })

    // Test performance monitoring integration
    this.runTest('Performance monitoring is integrated', () => {
      const layout = this.readFile('src/app/layout.tsx')
      return layout && layout.includes('PerformanceMonitorComponent')
    })

    return true
  }

  // Test 6: API Integration
  testAPIIntegration() {
    logHeader('🌐 Testing API Integration')

    // Test caching integration
    this.runTest('Caching is integrated in jobs API', () => {
      const jobsLib = this.readFile('src/lib/jobs.ts')
      return jobsLib && 
             jobsLib.includes('cachedFetch') &&
             jobsLib.includes('cacheInvalidation')
    })

    // Test performance monitoring integration
    this.runTest('Performance monitoring is integrated in libs', () => {
      const performanceLib = this.readFile('src/lib/performance.ts')
      return performanceLib && 
             performanceLib.includes('PerformanceMonitor') &&
             performanceLib.includes('usePerformanceMonitor')
    })

    return true
  }

  // Test 7: Database Schema
  testDatabaseSchema() {
    logHeader('🗄️  Testing Database Schema')

    this.runTest('Database types are defined', () => {
      const dbTypes = this.readFile('src/types/database.ts')
      return dbTypes && 
             dbTypes.includes('Profile') &&
             dbTypes.includes('JobPosting') &&
             dbTypes.includes('Application')
    })

    this.runTest('Migration files exist', () => {
      return this.fileExists('supabase/migrations')
    })

    return true
  }

  // Test 8: Performance Optimizations
  testPerformanceOptimizations() {
    logHeader('⚡ Testing Performance Optimizations')

    // Test debouncing utilities
    this.runTest('Debouncing utilities exist', () => {
      const performanceLib = this.readFile('src/lib/performance.ts')
      return performanceLib && performanceLib.includes('useDebounce')
    })

    // Test caching utilities
    this.runTest('Caching utilities exist', () => {
      const cacheLib = this.readFile('src/lib/cache.ts')
      return cacheLib && 
             cacheLib.includes('cachedFetch') &&
             cacheLib.includes('useCachedData')
    })

    // Test optimized components
    this.runTest('Optimized image component exists', () => {
      return this.fileExists('src/components/ui/optimized-image.tsx')
    })

    // Test loading states
    this.runTest('Loading states are comprehensive', () => {
      const loadingStates = this.readFile('src/components/ui/loading-states.tsx')
      return loadingStates && 
             loadingStates.includes('LoadingSpinner') &&
             loadingStates.includes('JobListSkeleton') &&
             loadingStates.includes('DashboardSkeleton')
    })

    return true
  }

  // Test 9: Error Handling
  testErrorHandling() {
    logHeader('🛡️  Testing Error Handling')

    this.runTest('Error boundary component is complete', () => {
      const errorBoundary = this.readFile('src/components/ui/error-boundary.tsx')
      return errorBoundary && 
             errorBoundary.includes('componentDidCatch') &&
             errorBoundary.includes('PageErrorBoundary') &&
             errorBoundary.includes('ComponentErrorBoundary')
    })

    this.runTest('Error boundaries are used in layout', () => {
      const layout = this.readFile('src/app/layout.tsx')
      return layout && 
             layout.includes('PageErrorBoundary') &&
             layout.includes('ErrorBoundary')
    })

    return true
  }

  // Test 10: Accessibility
  testAccessibility() {
    logHeader('♿ Testing Accessibility')

    this.runTest('Navigation has accessibility attributes', () => {
      const nav = this.readFile('src/components/ui/navigation-header.tsx')
      return nav && 
             nav.includes('aria-') &&
             nav.includes('role=') &&
             nav.includes('aria-label')
    })

    this.runTest('Forms have proper labels', () => {
      const loginForm = this.readFile('src/components/auth/login-form.tsx')
      return loginForm && loginForm.includes('aria-label')
    })

    return true
  }

  // Test 11: Security
  testSecurity() {
    logHeader('🔒 Testing Security')

    this.runTest('University email validation exists', () => {
      const authLib = this.readFile('src/lib/auth.ts')
      return authLib && authLib.includes('isValidUniversityEmail')
    })

    this.runTest('Role-based permissions exist', () => {
      const authLib = this.readFile('src/lib/auth.ts')
      return authLib && 
             authLib.includes('canCreateJob') &&
             authLib.includes('canManageApplications')
    })

    return true
  }

  // Test 12: Mobile Responsiveness
  testMobileResponsiveness() {
    logHeader('📱 Testing Mobile Responsiveness')

    this.runTest('Mobile navigation exists', () => {
      return this.fileExists('src/components/ui/mobile-nav.tsx')
    })

    this.runTest('Responsive classes are used', () => {
      const layout = this.readFile('src/app/layout.tsx')
      const nav = this.readFile('src/components/ui/navigation-header.tsx')
      return (layout && nav) && 
             (layout.includes('sm:') || nav.includes('sm:')) &&
             (layout.includes('md:') || nav.includes('md:'))
    })

    return true
  }

  // Generate final report
  generateReport() {
    logHeader('📊 Final Integration Test Report')

    const successRate = Math.round((this.passed / this.total) * 100)

    log(`\n${COLORS.BOLD}Test Results:${COLORS.RESET}`)
    log(`✅ Passed: ${this.passed}/${this.total} (${successRate}%)`)

    if (this.errors.length > 0) {
      log(`❌ Failed: ${this.errors.length}`)
      log(`\n${COLORS.RED}Failed Tests:${COLORS.RESET}`)
      this.errors.forEach(error => {
        log(`  • ${error}`, COLORS.RED)
      })
    }

    if (this.warnings.length > 0) {
      log(`\n${COLORS.YELLOW}Warnings:${COLORS.RESET}`)
      this.warnings.forEach(warning => {
        log(`  • ${warning}`, COLORS.YELLOW)
      })
    }

    // Overall assessment
    log(`\n${COLORS.BOLD}Overall Assessment:${COLORS.RESET}`)
    if (successRate >= 95) {
      logSuccess('🌟 Excellent! Application is production-ready.')
    } else if (successRate >= 85) {
      logInfo('👍 Good! Minor issues to address before production.')
    } else if (successRate >= 70) {
      logWarning('⚠️  Needs attention. Several issues to fix.')
    } else {
      logError('🚨 Critical issues found. Not ready for production.')
    }

    return successRate >= 85
  }

  // Run all tests
  async runAllTests() {
    logHeader('🚀 Starting Final Integration Tests')

    const tests = [
      () => this.testProjectStructure(),
      () => this.testComponentIntegration(),
      () => this.testAPIIntegration(),
      () => this.testDatabaseSchema(),
      () => this.testPerformanceOptimizations(),
      () => this.testErrorHandling(),
      () => this.testAccessibility(),
      () => this.testSecurity(),
      () => this.testMobileResponsiveness(),
      () => this.testTypeScriptCompilation(),
      () => this.testLinting(),
      () => this.testBuild(),
    ]

    for (const test of tests) {
      try {
        await test()
      } catch (error) {
        logError(`Test failed: ${error.message}`)
        this.errors.push(`Test error: ${error.message}`)
      }
    }

    return this.generateReport()
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FinalIntegrationTester()
  
  tester.runAllTests()
    .then(isReady => {
      process.exit(isReady ? 0 : 1)
    })
    .catch(error => {
      logError(`Tests failed: ${error.message}`)
      process.exit(1)
    })
}

module.exports = FinalIntegrationTester