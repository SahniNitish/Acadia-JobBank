#!/usr/bin/env node

/**
 * Performance Optimization Script
 * 
 * This script analyzes and optimizes the application for better performance.
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

class PerformanceOptimizer {
  constructor() {
    this.issues = []
    this.optimizations = []
    this.projectRoot = process.cwd()
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8')
    } catch (error) {
      return null
    }
  }

  writeFile(filePath, content) {
    try {
      fs.writeFileSync(path.join(this.projectRoot, filePath), content)
      return true
    } catch (error) {
      return false
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.projectRoot, filePath))
  }

  execCommand(command) {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        cwd: this.projectRoot,
        stdio: 'pipe'
      }).trim()
    } catch (error) {
      return null
    }
  }

  // Analyze bundle size
  analyzeBundleSize() {
    logHeader('📦 Analyzing Bundle Size')

    const nextConfig = this.readFile('next.config.js')
    if (!nextConfig) {
      logError('next.config.js not found')
      return
    }

    // Check if bundle analyzer is configured
    if (!nextConfig.includes('@next/bundle-analyzer')) {
      logWarning('Bundle analyzer not configured')
      this.issues.push('Bundle analyzer not configured')
      
      // Suggest adding bundle analyzer
      const optimizedConfig = `const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

${nextConfig}

module.exports = withBundleAnalyzer(nextConfig)`

      logInfo('Suggested optimization: Add bundle analyzer')
      this.optimizations.push({
        type: 'bundle-analyzer',
        description: 'Add bundle analyzer configuration',
        file: 'next.config.js',
        content: optimizedConfig
      })
    } else {
      logSuccess('Bundle analyzer is configured')
    }

    // Check for large dependencies
    const packageJson = this.readFile('package.json')
    if (packageJson) {
      const pkg = JSON.parse(packageJson)
      const largeDeps = [
        'lodash', 'moment', 'jquery', 'bootstrap'
      ]
      
      const foundLargeDeps = largeDeps.filter(dep => 
        (pkg.dependencies && pkg.dependencies[dep]) ||
        (pkg.devDependencies && pkg.devDependencies[dep])
      )

      if (foundLargeDeps.length > 0) {
        logWarning(`Large dependencies found: ${foundLargeDeps.join(', ')}`)
        this.issues.push(`Large dependencies: ${foundLargeDeps.join(', ')}`)
      } else {
        logSuccess('No large dependencies detected')
      }
    }
  }

  // Check for image optimization
  checkImageOptimization() {
    logHeader('🖼️  Checking Image Optimization')

    // Check if Next.js Image component is used
    const components = [
      'src/components/**/*.tsx',
      'src/app/**/*.tsx'
    ]

    let hasUnoptimizedImages = false
    let hasOptimizedImages = false

    // This is a simplified check - in a real scenario you'd use a proper file walker
    const checkDirectory = (dir) => {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) return

      const files = fs.readdirSync(path.join(this.projectRoot, dir), { recursive: true })
      
      files.forEach(file => {
        if (typeof file === 'string' && file.endsWith('.tsx')) {
          const content = this.readFile(path.join(dir, file))
          if (content) {
            if (content.includes('<img ') && !content.includes('next/image')) {
              hasUnoptimizedImages = true
            }
            if (content.includes('next/image')) {
              hasOptimizedImages = true
            }
          }
        }
      })
    }

    checkDirectory('src/components')
    checkDirectory('src/app')

    if (hasUnoptimizedImages) {
      logWarning('Unoptimized <img> tags found')
      this.issues.push('Unoptimized images detected')
    }

    if (hasOptimizedImages) {
      logSuccess('Next.js Image component is being used')
    }

    // Check if optimized image component exists
    if (this.fileExists('src/components/ui/optimized-image.tsx')) {
      logSuccess('Custom optimized image component exists')
    } else {
      logInfo('Consider creating a custom optimized image component')
    }
  }

  // Check for performance hooks and utilities
  checkPerformanceUtils() {
    logHeader('⚡ Checking Performance Utilities')

    const performanceLib = this.readFile('src/lib/performance.ts')
    if (performanceLib) {
      const utils = [
        'useDebounce',
        'useThrottle',
        'useIntersectionObserver',
        'useVirtualScrolling',
        'PerformanceMonitor'
      ]

      const missingUtils = utils.filter(util => !performanceLib.includes(util))
      
      if (missingUtils.length === 0) {
        logSuccess('All performance utilities are implemented')
      } else {
        logWarning(`Missing performance utilities: ${missingUtils.join(', ')}`)
        this.issues.push(`Missing performance utils: ${missingUtils.join(', ')}`)
      }
    } else {
      logError('Performance utilities library not found')
      this.issues.push('Missing performance utilities')
    }

    // Check for caching implementation
    const cacheLib = this.readFile('src/lib/cache.ts')
    if (cacheLib) {
      logSuccess('Caching utilities are implemented')
    } else {
      logWarning('Caching utilities not found')
      this.issues.push('Missing caching utilities')
    }
  }

  // Check for lazy loading
  checkLazyLoading() {
    logHeader('🔄 Checking Lazy Loading')

    // Check for React.lazy usage
    const hasLazyComponents = this.execCommand('grep -r "React.lazy" src/ || true')
    if (hasLazyComponents) {
      logSuccess('Lazy loading is implemented')
    } else {
      logWarning('No lazy loading detected')
      this.issues.push('No lazy loading implementation')
    }

    // Check for dynamic imports
    const hasDynamicImports = this.execCommand('grep -r "import(" src/ || true')
    if (hasDynamicImports) {
      logSuccess('Dynamic imports are used')
    } else {
      logWarning('No dynamic imports detected')
      this.issues.push('No dynamic imports')
    }
  }

  // Check for memoization
  checkMemoization() {
    logHeader('🧠 Checking Memoization')

    const memoHooks = ['useMemo', 'useCallback', 'React.memo']
    let foundMemoization = false

    memoHooks.forEach(hook => {
      const usage = this.execCommand(`grep -r "${hook}" src/ || true`)
      if (usage) {
        logSuccess(`${hook} is being used`)
        foundMemoization = true
      }
    })

    if (!foundMemoization) {
      logWarning('No memoization detected')
      this.issues.push('Missing memoization')
    }
  }

  // Check database query optimization
  checkDatabaseOptimization() {
    logHeader('🗄️  Checking Database Optimization')

    const libFiles = ['src/lib/jobs.ts', 'src/lib/applications.ts', 'src/lib/auth.ts']
    
    libFiles.forEach(file => {
      const content = this.readFile(file)
      if (content) {
        // Check for select optimization
        if (content.includes('.select(\'*\')')) {
          logWarning(`${file}: Using select('*') - consider selecting specific fields`)
          this.issues.push(`${file}: Unoptimized select queries`)
        }

        // Check for caching
        if (content.includes('cachedFetch')) {
          logSuccess(`${file}: Uses caching`)
        } else {
          logWarning(`${file}: No caching detected`)
          this.issues.push(`${file}: Missing caching`)
        }

        // Check for pagination
        if (content.includes('.range(')) {
          logSuccess(`${file}: Uses pagination`)
        } else if (content.includes('limit')) {
          logSuccess(`${file}: Uses query limits`)
        } else {
          logWarning(`${file}: No pagination or limits detected`)
          this.issues.push(`${file}: Missing pagination`)
        }
      }
    })
  }

  // Check for error boundaries
  checkErrorBoundaries() {
    logHeader('🛡️  Checking Error Boundaries')

    const errorBoundary = this.readFile('src/components/ui/error-boundary.tsx')
    if (errorBoundary) {
      logSuccess('Error boundary component exists')
      
      // Check if it's used in layout
      const layout = this.readFile('src/app/layout.tsx')
      if (layout && layout.includes('ErrorBoundary')) {
        logSuccess('Error boundaries are integrated in layout')
      } else {
        logWarning('Error boundaries not integrated in layout')
        this.issues.push('Error boundaries not integrated')
      }
    } else {
      logError('Error boundary component not found')
      this.issues.push('Missing error boundaries')
    }
  }

  // Check for loading states
  checkLoadingStates() {
    logHeader('⏳ Checking Loading States')

    const loadingStates = this.readFile('src/components/ui/loading-states.tsx')
    if (loadingStates) {
      logSuccess('Loading states component exists')
      
      const components = ['LoadingSpinner', 'LoadingState', 'PageLoadingState', 'JobListSkeleton']
      const missingComponents = components.filter(comp => !loadingStates.includes(comp))
      
      if (missingComponents.length === 0) {
        logSuccess('All loading state components are implemented')
      } else {
        logWarning(`Missing loading components: ${missingComponents.join(', ')}`)
        this.issues.push(`Missing loading states: ${missingComponents.join(', ')}`)
      }
    } else {
      logError('Loading states component not found')
      this.issues.push('Missing loading states')
    }
  }

  // Generate optimization recommendations
  generateRecommendations() {
    logHeader('💡 Performance Optimization Recommendations')

    const recommendations = [
      {
        category: 'Bundle Optimization',
        items: [
          'Enable bundle analyzer to identify large dependencies',
          'Use dynamic imports for large components',
          'Implement code splitting at route level',
          'Remove unused dependencies'
        ]
      },
      {
        category: 'Image Optimization',
        items: [
          'Use Next.js Image component for all images',
          'Implement lazy loading for images',
          'Use appropriate image formats (WebP, AVIF)',
          'Optimize image sizes for different viewports'
        ]
      },
      {
        category: 'Caching Strategy',
        items: [
          'Implement client-side caching for API responses',
          'Use React Query or SWR for server state management',
          'Cache static assets with appropriate headers',
          'Implement service worker for offline caching'
        ]
      },
      {
        category: 'Database Optimization',
        items: [
          'Use specific field selection instead of SELECT *',
          'Implement proper indexing on frequently queried fields',
          'Use pagination for large datasets',
          'Cache frequently accessed data'
        ]
      },
      {
        category: 'User Experience',
        items: [
          'Implement skeleton loading states',
          'Use optimistic updates for better perceived performance',
          'Add error boundaries for graceful error handling',
          'Implement proper loading indicators'
        ]
      }
    ]

    recommendations.forEach(({ category, items }) => {
      log(`\n${COLORS.BOLD}${category}:${COLORS.RESET}`)
      items.forEach(item => {
        log(`  • ${item}`)
      })
    })
  }

  // Apply automatic optimizations
  applyOptimizations() {
    logHeader('🔧 Applying Automatic Optimizations')

    this.optimizations.forEach(optimization => {
      logInfo(`Applying: ${optimization.description}`)
      
      if (optimization.file && optimization.content) {
        if (this.writeFile(optimization.file, optimization.content)) {
          logSuccess(`Updated ${optimization.file}`)
        } else {
          logError(`Failed to update ${optimization.file}`)
        }
      }
    })
  }

  // Generate performance report
  generateReport() {
    logHeader('📊 Performance Optimization Report')

    if (this.issues.length === 0) {
      logSuccess('No performance issues detected! 🚀')
    } else {
      logWarning(`Found ${this.issues.length} performance issues:`)
      this.issues.forEach(issue => {
        log(`  • ${issue}`, COLORS.YELLOW)
      })
    }

    if (this.optimizations.length > 0) {
      logInfo(`${this.optimizations.length} optimizations available`)
    }

    // Performance score (simplified)
    const totalChecks = 8
    const passedChecks = totalChecks - this.issues.length
    const score = Math.round((passedChecks / totalChecks) * 100)

    log(`\n${COLORS.BOLD}Performance Score: ${score}/100${COLORS.RESET}`)
    
    if (score >= 90) {
      logSuccess('Excellent performance! 🌟')
    } else if (score >= 70) {
      logInfo('Good performance, room for improvement 👍')
    } else {
      logWarning('Performance needs attention 🔧')
    }

    return score
  }

  // Run all optimizations
  async optimize() {
    logHeader('🚀 Starting Performance Optimization')

    const checks = [
      () => this.analyzeBundleSize(),
      () => this.checkImageOptimization(),
      () => this.checkPerformanceUtils(),
      () => this.checkLazyLoading(),
      () => this.checkMemoization(),
      () => this.checkDatabaseOptimization(),
      () => this.checkErrorBoundaries(),
      () => this.checkLoadingStates(),
    ]

    for (const check of checks) {
      try {
        await check()
      } catch (error) {
        logError(`Check failed: ${error.message}`)
        this.issues.push(`Check error: ${error.message}`)
      }
    }

    this.generateRecommendations()
    
    // Ask user if they want to apply optimizations
    if (this.optimizations.length > 0) {
      logInfo('\nAutomatic optimizations are available.')
      // In a real implementation, you might prompt the user here
      // this.applyOptimizations()
    }

    return this.generateReport()
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer()
  
  optimizer.optimize()
    .then(score => {
      process.exit(score >= 70 ? 0 : 1)
    })
    .catch(error => {
      logError(`Optimization failed: ${error.message}`)
      process.exit(1)
    })
}

module.exports = PerformanceOptimizer