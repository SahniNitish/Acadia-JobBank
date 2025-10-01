/**
 * Client-side caching utilities for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private storage: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 100

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.storage.size >= this.maxSize) {
      const oldestKey = this.storage.keys().next().value
      this.storage.delete(oldestKey)
    }

    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.storage.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }

  // Get cache statistics
  getStats(): {
    size: number
    maxSize: number
    keys: string[]
  } {
    return {
      size: this.storage.size,
      maxSize: this.maxSize,
      keys: Array.from(this.storage.keys()),
    }
  }

  // Clean expired entries
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.storage.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Global cache instance
const globalCache = new Cache()

// Cache key generators
export const cacheKeys = {
  jobs: (filters?: Record<string, any>) => 
    `jobs:${filters ? JSON.stringify(filters) : 'all'}`,
  job: (id: string) => `job:${id}`,
  applications: (userId: string) => `applications:${userId}`,
  application: (id: string) => `application:${id}`,
  profile: (userId: string) => `profile:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  search: (query: string, filters?: Record<string, any>) =>
    `search:${query}:${filters ? JSON.stringify(filters) : ''}`,
}

// Cached API wrapper
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // Try to get from cache first
  const cached = globalCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Store in cache
  globalCache.set(key, data, ttlMs)
  
  return data
}

// React hook for cached data
import { useState, useEffect, useCallback } from 'react'

export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await cachedFetch(key, fetchFn, ttlMs)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [key, fetchFn, ttlMs])

  // Refresh data function
  const refresh = useCallback(async () => {
    globalCache.delete(key)
    await fetchData()
  }, [key, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    data,
    loading,
    error,
    refresh,
  }
}

// Optimistic updates
export function useOptimisticUpdate<T>(
  cacheKey: string,
  updateFn: (currentData: T | null, optimisticData: Partial<T>) => T
) {
  const applyOptimisticUpdate = useCallback((optimisticData: Partial<T>) => {
    const currentData = globalCache.get<T>(cacheKey)
    const updatedData = updateFn(currentData, optimisticData)
    globalCache.set(cacheKey, updatedData)
    return updatedData
  }, [cacheKey, updateFn])

  const revertOptimisticUpdate = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  return {
    applyOptimisticUpdate,
    revertOptimisticUpdate,
  }
}

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate all job-related caches
  invalidateJobs: () => {
    const keys = globalCache.getStats().keys
    keys.forEach(key => {
      if (key.startsWith('jobs:') || key.startsWith('search:')) {
        globalCache.delete(key)
      }
    })
  },

  // Invalidate user-specific caches
  invalidateUser: (userId: string) => {
    globalCache.delete(cacheKeys.profile(userId))
    globalCache.delete(cacheKeys.applications(userId))
    globalCache.delete(cacheKeys.notifications(userId))
  },

  // Invalidate application-related caches
  invalidateApplications: (userId?: string) => {
    const keys = globalCache.getStats().keys
    keys.forEach(key => {
      if (key.startsWith('applications:') || key.startsWith('application:')) {
        if (!userId || key.includes(userId)) {
          globalCache.delete(key)
        }
      }
    })
  },

  // Clear all caches
  clearAll: () => {
    globalCache.clear()
  },
}

// Background cache cleanup
if (typeof window !== 'undefined') {
  // Clean up expired entries every 5 minutes
  setInterval(() => {
    globalCache.cleanup()
  }, 5 * 60 * 1000)
}

export { globalCache }