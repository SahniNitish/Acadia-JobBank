'use client'

import { useState, useEffect } from 'react'
import {
  getUserSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getUserSearchHistory,
  getPopularSearchTerms,
  getUserJobRecommendations,
  CreateSavedSearchData,
  UpdateSavedSearchData
} from '@/lib/saved-searches'
import { SavedSearch, SearchHistory, JobRecommendation } from '@/types/database'

export function useSavedSearches(userId: string | null) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSavedSearches = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      const searches = await getUserSavedSearches(userId)
      setSavedSearches(searches)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved searches')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedSearches()
  }, [userId])

  const createSearch = async (data: CreateSavedSearchData) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const newSearch = await createSavedSearch(userId, data)
      setSavedSearches(prev => [newSearch, ...prev])
      return newSearch
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create saved search'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateSearch = async (id: string, data: UpdateSavedSearchData) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      const updatedSearch = await updateSavedSearch(id, userId, data)
      setSavedSearches(prev => 
        prev.map(search => search.id === id ? updatedSearch : search)
      )
      return updatedSearch
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update saved search'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteSearch = async (id: string) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)
      await deleteSavedSearch(id, userId)
      setSavedSearches(prev => prev.filter(search => search.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete saved search'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    savedSearches,
    isLoading,
    error,
    createSearch,
    updateSearch,
    deleteSearch,
    refetch: fetchSavedSearches
  }
}

export function useSearchHistory(userId: string | null, limit = 10) {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSearchHistory = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      const history = await getUserSearchHistory(userId, limit)
      setSearchHistory(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch search history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSearchHistory()
  }, [userId, limit])

  return {
    searchHistory,
    isLoading,
    error,
    refetch: fetchSearchHistory
  }
}

export function usePopularSearchTerms(limit = 10) {
  const [popularTerms, setPopularTerms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPopularTerms = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const terms = await getPopularSearchTerms(limit)
      setPopularTerms(terms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch popular search terms')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPopularTerms()
  }, [limit])

  return {
    popularTerms,
    isLoading,
    error,
    refetch: fetchPopularTerms
  }
}

export function useJobRecommendations(userId: string | null, limit = 10) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      const recs = await getUserJobRecommendations(userId, limit)
      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [userId, limit])

  return {
    recommendations,
    isLoading,
    error,
    refetch: fetchRecommendations
  }
}