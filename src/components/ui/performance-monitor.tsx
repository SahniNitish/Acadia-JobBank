'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PerformanceMonitor } from '@/lib/performance'
import { Activity, Clock, Zap, AlertTriangle } from 'lucide-react'

interface PerformanceMetrics {
  [key: string]: {
    average: number
    count: number
  }
}

export function PerformanceMonitorComponent() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)
  const [webVitals, setWebVitals] = useState<{
    fcp?: number
    lcp?: number
    cls?: number
    fid?: number
  }>({})

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const monitor = PerformanceMonitor.getInstance()
    
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics())
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    
    // Initial update
    updateMetrics()

    // Measure Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        setWebVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }))
      }

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as any
            if (lastEntry) {
              setWebVitals(prev => ({ ...prev, lcp: lastEntry.startTime }))
            }
          })
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value
              }
            }
            setWebVitals(prev => ({ ...prev, cls: clsValue }))
          })
          clsObserver.observe({ entryTypes: ['layout-shift'] })

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              setWebVitals(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }))
            }
          })
          fidObserver.observe({ entryTypes: ['first-input'] })
        } catch (error) {
          console.warn('Performance Observer not fully supported:', error)
        }
      }
    }

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800'
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance Monitor
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <CardDescription className="text-xs">
            Development mode only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Web Vitals */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Core Web Vitals
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {webVitals.fcp && (
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(getPerformanceStatus(webVitals.fcp, { good: 1800, poor: 3000 }))}
                  >
                    {webVitals.fcp.toFixed(0)}ms
                  </Badge>
                </div>
              )}
              {webVitals.lcp && (
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(getPerformanceStatus(webVitals.lcp, { good: 2500, poor: 4000 }))}
                  >
                    {webVitals.lcp.toFixed(0)}ms
                  </Badge>
                </div>
              )}
              {webVitals.cls !== undefined && (
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(getPerformanceStatus(webVitals.cls, { good: 0.1, poor: 0.25 }))}
                  >
                    {webVitals.cls.toFixed(3)}
                  </Badge>
                </div>
              )}
              {webVitals.fid && (
                <div className="flex justify-between">
                  <span>FID:</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(getPerformanceStatus(webVitals.fid, { good: 100, poor: 300 }))}
                  >
                    {webVitals.fid.toFixed(0)}ms
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Custom Metrics */}
          {Object.keys(metrics).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Custom Metrics
              </h4>
              <div className="space-y-1">
                {Object.entries(metrics).map(([label, data]) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <span className="truncate">{label}:</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {data.average.toFixed(1)}ms
                      </Badge>
                      <span className="text-gray-500">({data.count})</span>
                      {data.average > 100 && (
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                PerformanceMonitor.getInstance().reset()
                setMetrics({})
              }}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                console.log('Performance Metrics:', {
                  webVitals,
                  customMetrics: metrics
                })
              }}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Log to Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}