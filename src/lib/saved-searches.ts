import { supabase } from './supabase'
import { SavedSearch, SearchHistory, JobRecommendation } from '@/types/database'
import { JobPostingFilters } from './jobs'

export interface CreateSavedSearchData {
  name: string
  search_criteria: SavedSearch['search_criteria']
  is_alert_enabled?: boolean
  alert_frequency?: SavedSearch['alert_frequency']
}

export interface UpdateSavedSearchData {
  name?: string
  search_criteria?: SavedSearch['search_criteria']
  is_alert_enabled?: boolean
  alert_frequency?: SavedSearch['alert_frequency']
}

/**
 * Create a new saved search
 */
export async function createSavedSearch(userId: string, data: CreateSavedSearchData) {
  const { data: savedSearch, error } = await supabase
    .from('saved_searches')
    .insert([{
      user_id: userId,
      name: data.name,
      search_criteria: data.search_criteria,
      is_alert_enabled: data.is_alert_enabled || false,
      alert_frequency: data.alert_frequency || 'daily'
    }])
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create saved search: ${error.message}`)
  }

  return savedSearch
}

/**
 * Get all saved searches for a user
 */
export async function getUserSavedSearches(userId: string) {
  const { data: savedSearches, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch saved searches: ${error.message}`)
  }

  return savedSearches || []
}

/**
 * Get a specific saved search by ID
 */
export async function getSavedSearch(id: string, userId: string) {
  const { data: savedSearch, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch saved search: ${error.message}`)
  }

  return savedSearch
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(id: string, userId: string, data: UpdateSavedSearchData) {
  const { data: savedSearch, error } = await supabase
    .from('saved_searches')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update saved search: ${error.message}`)
  }

  return savedSearch
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(id: string, userId: string) {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete saved search: ${error.message}`)
  }
}

/**
 * Record a search in search history
 */
export async function recordSearchHistory(
  userId: string,
  searchQuery: string,
  searchFilters: any,
  resultsCount: number
) {
  const { error } = await supabase
    .from('search_history')
    .insert([{
      user_id: userId,
      search_query: searchQuery,
      search_filters: searchFilters,
      results_count: resultsCount
    }])

  if (error) {
    console.error('Failed to record search history:', error)
    // Don't throw here as this is not critical functionality
  }
}

/**
 * Get search history for a user
 */
export async function getUserSearchHistory(userId: string, limit = 10) {
  const { data: searchHistory, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('searched_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch search history: ${error.message}`)
  }

  return searchHistory || []
}

/**
 * Get popular search terms (for suggestions)
 */
export async function getPopularSearchTerms(limit = 10) {
  const { data: searchHistory, error } = await supabase
    .from('search_history')
    .select('search_query')
    .order('searched_at', { ascending: false })
    .limit(100) // Get recent searches

  if (error) {
    console.error('Failed to fetch popular search terms:', error)
    return []
  }

  // Count frequency of search terms
  const termCounts = new Map<string, number>()
  
  searchHistory?.forEach(record => {
    const terms = record.search_query.toLowerCase().split(/\s+/)
    terms.forEach(term => {
      if (term.length > 2) { // Only count meaningful terms
        termCounts.set(term, (termCounts.get(term) || 0) + 1)
      }
    })
  })

  // Sort by frequency and return top terms
  return Array.from(termCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term)
}

/**
 * Convert saved search criteria to job posting filters
 */
export function savedSearchToFilters(savedSearch: SavedSearch): JobPostingFilters {
  const criteria = savedSearch.search_criteria
  
  return {
    search: criteria.search,
    department: criteria.department,
    job_type: criteria.job_type,
    deadline_from: criteria.deadline_from,
    deadline_to: criteria.deadline_to,
    sort_by: criteria.sort_by as any,
    sort_order: criteria.sort_order as any,
    is_active: true // Always filter for active jobs in alerts
  }
}

/**
 * Get saved searches that have alerts enabled
 */
export async function getAlertEnabledSearches() {
  const { data: savedSearches, error } = await supabase
    .from('saved_searches')
    .select(`
      *,
      profiles!saved_searches_user_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('is_alert_enabled', true)

  if (error) {
    throw new Error(`Failed to fetch alert-enabled searches: ${error.message}`)
  }

  return savedSearches || []
}

/**
 * Update last alert sent timestamp
 */
export async function updateLastAlertSent(savedSearchId: string) {
  const { error } = await supabase
    .from('saved_searches')
    .update({ 
      last_alert_sent: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', savedSearchId)

  if (error) {
    throw new Error(`Failed to update last alert sent: ${error.message}`)
  }
}

/**
 * Create job recommendations for a user
 */
export async function createJobRecommendations(
  userId: string,
  recommendations: Array<{
    job_id: string
    recommendation_score: number
    recommendation_reason?: string
  }>
) {
  if (recommendations.length === 0) return []

  const { data: jobRecommendations, error } = await supabase
    .from('job_recommendations')
    .upsert(
      recommendations.map(rec => ({
        user_id: userId,
        job_id: rec.job_id,
        recommendation_score: rec.recommendation_score,
        recommendation_reason: rec.recommendation_reason
      })),
      { onConflict: 'user_id,job_id' }
    )
    .select('*')

  if (error) {
    throw new Error(`Failed to create job recommendations: ${error.message}`)
  }

  return jobRecommendations || []
}

/**
 * Get job recommendations for a user
 */
export async function getUserJobRecommendations(userId: string, limit = 10) {
  const { data: recommendations, error } = await supabase
    .from('job_recommendations')
    .select(`
      *,
      job_postings!job_recommendations_job_id_fkey (
        *,
        profiles!job_postings_posted_by_fkey (
          id,
          full_name,
          department
        )
      )
    `)
    .eq('user_id', userId)
    .order('recommendation_score', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch job recommendations: ${error.message}`)
  }

  return recommendations || []
}