'use client'

import { useState, useEffect } from 'react'
import { 
  getPlatformStats, 
  getUsers, 
  updateUserRole, 
  deactivateUser,
  getFlaggedContent,
  moderateJobPosting,
  getRecentActivity,
  exportPlatformData,
  PlatformStats,
  UserManagementData
} from '@/lib/admin'
import { Profile } from '@/types/database'

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getPlatformStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch platform stats')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  }
}

export function useUserManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async (
    page = 1, 
    limit = 20, 
    role?: Profile['role'], 
    search?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getUsers(page, limit, role, search)
      setUsers(data.users)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
      setCurrentPage(data.currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: Profile['role']) => {
    try {
      setError(null)
      const updatedUser = await updateUserRole(userId, newRole)
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ))
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deactivate = async (userId: string) => {
    try {
      setError(null)
      await deactivateUser(userId)
      // Remove user from local state or mark as deactivated
      setUsers(prev => prev.filter(user => user.id !== userId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate user'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    users,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    error,
    fetchUsers,
    updateRole,
    deactivate,
    clearError: () => setError(null)
  }
}

export function useContentModeration() {
  const [flaggedContent, setFlaggedContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlaggedContent = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getFlaggedContent()
      setFlaggedContent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flagged content')
    } finally {
      setIsLoading(false)
    }
  }

  const moderateJob = async (
    jobId: string, 
    action: 'approve' | 'reject' | 'deactivate',
    reason?: string
  ) => {
    try {
      setError(null)
      await moderateJobPosting(jobId, action, reason)
      // Refresh flagged content
      await fetchFlaggedContent()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to moderate job posting'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  useEffect(() => {
    fetchFlaggedContent()
  }, [])

  return {
    flaggedContent,
    isLoading,
    error,
    moderateJob,
    refetch: fetchFlaggedContent,
    clearError: () => setError(null)
  }
}

export function useRecentActivity() {
  const [activity, setActivity] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getRecentActivity()
      setActivity(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()
  }, [])

  return {
    activity,
    isLoading,
    error,
    refetch: fetchActivity
  }
}

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async (type: 'users' | 'jobs' | 'applications') => {
    try {
      setIsExporting(true)
      setError(null)
      const data = await exportPlatformData(type)
      
      // Convert to CSV and download
      const csv = convertToCSV(data)
      downloadCSV(csv, `${type}_export_${new Date().toISOString().split('T')[0]}.csv`)
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportData,
    isExporting,
    error,
    clearError: () => setError(null)
  }
}

// Helper functions for CSV export
function convertToCSV(data: any[]): string {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }
      // Escape commas and quotes in strings
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}