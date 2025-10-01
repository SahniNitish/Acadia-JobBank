#!/usr/bin/env node

/**
 * User Flow Validation Script
 * 
 * This script validates that all user flows are properly integrated
 * by checking component dependencies and data flow.
 */

const fs = require('fs')
const path = require('path')

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

class UserFlowValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.projectRoot = process.cwd()
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8')
    } catch (error) {
      return null
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath))
  }

  // Validate authentication flow
  validateAuthFlow() {
    logHeader('🔐 Validating Authentication Flow')

    const authContext = this.readFile('src/contexts/auth-context.tsx')
    const authLib = this.readFile('src/lib/auth.ts')
    const loginForm = this.readFile('src/components/auth/login-form.tsx')
    const registerForm = this.readFile('src/components/auth/register-form.tsx')

    let flowValid = true

    // Check auth context
    if (authContext) {
      if (authContext.includes('useAuth') && authContext.includes('AuthProvider')) {
        logSuccess('Auth context properly exports useAuth and AuthProvider')
      } else {
        logError('Auth context missing required exports')
        this.errors.push('Auth context integration issue')
        flowValid = false
      }

      if (authContext.includes('signOut') && authContext.includes('refreshProfile')) {
        logSuccess('Auth context includes required methods')
      } else {
        logWarning('Auth context missing some methods')
        this.warnings.push('Auth context methods incomplete')
      }
    } else {
      logError('Auth context file not found')
      this.errors.push('Missing auth context')
      flowValid = false
    }

    // Check auth library
    if (authLib) {
      const requiredFunctions = ['signUp', 'signIn', 'signOut', 'getUserProfile']
      const missingFunctions = requiredFunctions.filter(fn => !authLib.includes(fn))
      
      if (missingFunctions.length === 0) {
        logSuccess('Auth library includes all required functions')
      } else {
        logError(`Auth library missing functions: ${missingFunctions.join(', ')}`)
        this.errors.push('Auth library incomplete')
        flowValid = false
      }

      if (authLib.includes('isValidUniversityEmail')) {
        logSuccess('University email validation implemented')
      } else {
        logError('University email validation missing')
        this.errors.push('Email validation missing')
        flowValid = false
      }
    } else {
      logError('Auth library file not found')
      this.errors.push('Missing auth library')
      flowValid = false
    }

    // Check auth forms
    if (loginForm && registerForm) {
      logSuccess('Auth forms exist')
      
      if (loginForm.includes('useAuth') && registerForm.includes('useAuth')) {
        logSuccess('Auth forms use auth context')
      } else {
        logWarning('Auth forms may not be properly integrated with auth context')
        this.warnings.push('Auth forms integration unclear')
      }
    } else {
      logError('Auth forms missing')
      this.errors.push('Missing auth forms')
      flowValid = false
    }

    return flowValid
  }

  // Validate job management flow
  validateJobFlow() {
    logHeader('💼 Validating Job Management Flow')

    const jobsLib = this.readFile('src/lib/jobs.ts')
    const jobForm = this.readFile('src/components/jobs/job-posting-form.tsx')
    const jobList = this.readFile('src/components/jobs/job-listing-grid.tsx')
    const jobDetail = this.readFile('src/components/jobs/job-detail-view.tsx')
    const jobFilters = this.readFile('src/components/jobs/job-search-filters.tsx')

    let flowValid = true

    // Check jobs library
    if (jobsLib) {
      const requiredFunctions = ['createJobPosting', 'getJobPostings', 'searchJobs', 'updateJobPosting']
      const missingFunctions = requiredFunctions.filter(fn => !jobsLib.includes(fn))
      
      if (missingFunctions.length === 0) {
        logSuccess('Jobs library includes all required functions')
      } else {
        logError(`Jobs library missing functions: ${missingFunctions.join(', ')}`)
        this.errors.push('Jobs library incomplete')
        flowValid = false
      }
    } else {
      logError('Jobs library file not found')
      this.errors.push('Missing jobs library')
      flowValid = false
    }

    // Check job components
    const jobComponents = [
      { name: 'Job posting form', file: jobForm },
      { name: 'Job listing grid', file: jobList },
      { name: 'Job detail view', file: jobDetail },
      { name: 'Job search filters', file: jobFilters }
    ]

    jobComponents.forEach(({ name, file }) => {
      if (file) {
        logSuccess(`${name} component exists`)
      } else {
        logError(`${name} component missing`)
        this.errors.push(`Missing ${name.toLowerCase()}`)
        flowValid = false
      }
    })

    return flowValid
  }

  // Validate application flow
  validateApplicationFlow() {
    logHeader('📝 Validating Application Flow')

    const applicationsLib = this.readFile('src/lib/applications.ts')
    const applicationForm = this.readFile('src/components/applications/application-form.tsx')
    const applicationList = this.readFile('src/components/applications/application-list.tsx')
    const applicationDetail = this.readFile('src/components/applications/application-detail-view.tsx')

    let flowValid = true

    // Check applications library
    if (applicationsLib) {
      const requiredFunctions = ['submitApplication', 'getApplications', 'updateApplicationStatus']
      const missingFunctions = requiredFunctions.filter(fn => !applicationsLib.includes(fn))
      
      if (missingFunctions.length === 0) {
        logSuccess('Applications library includes all required functions')
      } else {
        logError(`Applications library missing functions: ${missingFunctions.join(', ')}`)
        this.errors.push('Applications library incomplete')
        flowValid = false
      }
    } else {
      logError('Applications library file not found')
      this.errors.push('Missing applications library')
      flowValid = false
    }

    // Check application components
    const appComponents = [
      { name: 'Application form', file: applicationForm },
      { name: 'Application list', file: applicationList },
      { name: 'Application detail view', file: applicationDetail }
    ]

    appComponents.forEach(({ name, file }) => {
      if (file) {
        logSuccess(`${name} component exists`)
      } else {
        logError(`${name} component missing`)
        this.errors.push(`Missing ${name.toLowerCase()}`)
        flowValid = false
      }
    })

    return flowValid
  }

  // Validate dashboard integration
  validateDashboardFlow() {
    logHeader('📊 Validating Dashboard Integration')

    const dashboardPage = this.readFile('src/app/dashboard/page.tsx')
    const facultyDashboard = this.readFile('src/components/dashboard/faculty-dashboard.tsx')
    const studentDashboard = this.readFile('src/components/dashboard/student-dashboard.tsx')
    const adminDashboard = this.readFile('src/components/dashboard/admin-dashboard.tsx')

    let flowValid = true

    // Check dashboard page
    if (dashboardPage) {
      if (dashboardPage.includes('useAuth')) {
        logSuccess('Dashboard page uses auth context')
      } else {
        logError('Dashboard page not integrated with auth')
        this.errors.push('Dashboard auth integration missing')
        flowValid = false
      }

      const dashboardTypes = ['FacultyDashboard', 'StudentDashboard', 'AdminDashboard']
      const missingDashboards = dashboardTypes.filter(type => !dashboardPage.includes(type))
      
      if (missingDashboards.length === 0) {
        logSuccess('Dashboard page includes all role-specific dashboards')
      } else {
        logError(`Dashboard page missing: ${missingDashboards.join(', ')}`)
        this.errors.push('Dashboard components not integrated')
        flowValid = false
      }
    } else {
      logError('Dashboard page file not found')
      this.errors.push('Missing dashboard page')
      flowValid = false
    }

    // Check individual dashboard components
    const dashboards = [
      { name: 'Faculty dashboard', file: facultyDashboard },
      { name: 'Student dashboard', file: studentDashboard },
      { name: 'Admin dashboard', file: adminDashboard }
    ]

    dashboards.forEach(({ name, file }) => {
      if (file) {
        logSuccess(`${name} component exists`)
      } else {
        logError(`${name} component missing`)
        this.errors.push(`Missing ${name}`)
        flowValid = false
      }
    })

    return flowValid
  }

  // Validate notification system
  validateNotificationFlow() {
    logHeader('🔔 Validating Notification System')

    const notificationsLib = this.readFile('src/lib/notifications.ts')
    const notificationBell = this.readFile('src/components/notifications/notification-bell.tsx')
    const notificationList = this.readFile('src/components/notifications/notification-list.tsx')

    let flowValid = true

    // Check notifications library
    if (notificationsLib) {
      const requiredFunctions = ['createNotification', 'getNotifications', 'markAsRead']
      const missingFunctions = requiredFunctions.filter(fn => !notificationsLib.includes(fn))
      
      if (missingFunctions.length === 0) {
        logSuccess('Notifications library includes all required functions')
      } else {
        logError(`Notifications library missing functions: ${missingFunctions.join(', ')}`)
        this.errors.push('Notifications library incomplete')
        flowValid = false
      }
    } else {
      logError('Notifications library file not found')
      this.errors.push('Missing notifications library')
      flowValid = false
    }

    // Check notification components
    const notificationComponents = [
      { name: 'Notification bell', file: notificationBell },
      { name: 'Notification list', file: notificationList }
    ]

    notificationComponents.forEach(({ name, file }) => {
      if (file) {
        logSuccess(`${name} component exists`)
      } else {
        logError(`${name} component missing`)
        this.errors.push(`Missing ${name.toLowerCase()}`)
        flowValid = false
      }
    })

    return flowValid
  }

  // Validate navigation and routing
  validateNavigationFlow() {
    logHeader('🧭 Validating Navigation and Routing')

    const layout = this.readFile('src/app/layout.tsx')
    const navigationHeader = this.readFile('src/components/ui/navigation-header.tsx')
    const mobileNav = this.readFile('src/components/ui/mobile-nav.tsx')

    let flowValid = true

    // Check layout
    if (layout) {
      if (layout.includes('AuthProvider') && layout.includes('NavigationHeader')) {
        logSuccess('Layout properly integrates auth and navigation')
      } else {
        logError('Layout missing auth or navigation integration')
        this.errors.push('Layout integration incomplete')
        flowValid = false
      }

      if (layout.includes('ErrorBoundary')) {
        logSuccess('Layout includes error boundaries')
      } else {
        logWarning('Layout missing error boundaries')
        this.warnings.push('Error boundaries not integrated')
      }
    } else {
      logError('Layout file not found')
      this.errors.push('Missing layout')
      flowValid = false
    }

    // Check navigation components
    if (navigationHeader) {
      if (navigationHeader.includes('useAuth')) {
        logSuccess('Navigation header uses auth context')
      } else {
        logError('Navigation header not integrated with auth')
        this.errors.push('Navigation auth integration missing')
        flowValid = false
      }
    } else {
      logError('Navigation header missing')
      this.errors.push('Missing navigation header')
      flowValid = false
    }

    if (mobileNav) {
      logSuccess('Mobile navigation component exists')
    } else {
      logWarning('Mobile navigation component missing')
      this.warnings.push('Mobile navigation missing')
    }

    return flowValid
  }

  // Validate error handling
  validateErrorHandling() {
    logHeader('🚨 Validating Error Handling')

    const errorBoundary = this.readFile('src/components/ui/error-boundary.tsx')
    const loadingStates = this.readFile('src/components/ui/loading-states.tsx')

    let flowValid = true

    if (errorBoundary) {
      if (errorBoundary.includes('ErrorBoundary') && errorBoundary.includes('componentDidCatch')) {
        logSuccess('Error boundary component properly implemented')
      } else {
        logError('Error boundary component incomplete')
        this.errors.push('Error boundary implementation issue')
        flowValid = false
      }
    } else {
      logError('Error boundary component missing')
      this.errors.push('Missing error boundary')
      flowValid = false
    }

    if (loadingStates) {
      const loadingComponents = ['LoadingSpinner', 'LoadingState', 'PageLoadingState']
      const missingComponents = loadingComponents.filter(comp => !loadingStates.includes(comp))
      
      if (missingComponents.length === 0) {
        logSuccess('All loading state components exist')
      } else {
        logWarning(`Missing loading components: ${missingComponents.join(', ')}`)
        this.warnings.push('Some loading states missing')
      }
    } else {
      logWarning('Loading states component missing')
      this.warnings.push('Loading states missing')
    }

    return flowValid
  }

  // Generate summary report
  generateReport() {
    logHeader('📊 User Flow Validation Summary')

    if (this.errors.length === 0) {
      logSuccess(`All user flows are properly integrated! ✨`)
    } else {
      logError(`Found ${this.errors.length} critical integration issues:`)
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
      logSuccess('\n🚀 All user flows are ready!')
    } else {
      logError('\n🛑 Please fix the integration issues.')
    }

    return isReady
  }

  // Run all validations
  async validate() {
    logHeader('🔍 Starting User Flow Validation')

    const validations = [
      () => this.validateAuthFlow(),
      () => this.validateJobFlow(),
      () => this.validateApplicationFlow(),
      () => this.validateDashboardFlow(),
      () => this.validateNotificationFlow(),
      () => this.validateNavigationFlow(),
      () => this.validateErrorHandling(),
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
  const validator = new UserFlowValidator()
  
  validator.validate()
    .then(isReady => {
      process.exit(isReady ? 0 : 1)
    })
    .catch(error => {
      logError(`Validation failed: ${error.message}`)
      process.exit(1)
    })
}

module.exports = UserFlowValidator