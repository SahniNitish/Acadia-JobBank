'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Search } from 'lucide-react'
import { useSearchHistory, usePopularSearchTerms } from '@/hooks/use-saved-searches'
import { useAuth } from '@/contexts/auth-context'

interface SearchSuggestionsProps {
  onSelectSuggestion: (query: string) => void
  currentQuery?: string
}

export function SearchSuggestions({ onSelectSuggestion, currentQuery = '' }: SearchSuggestionsProps) {
  const { user } = useAuth()
  const { searchHistory } = useSearchHistory(user?.id || null, 5)
  const { popularTerms } = usePopularSearchTerms(8)
  
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])

  // Filter suggestions based on current query
  useEffect(() => {
    if (!currentQuery.trim()) {
      setFilteredSuggestions([])
      return
    }

    const query = currentQuery.toLowerCase()
    const suggestions = new Set<string>()

    // Add matching terms from search history
    searchHistory.forEach(record => {
      const words = record.search_query.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 2 && word.startsWith(query) && word !== query) {
          suggestions.add(word)
        }
      })
    })

    // Add matching popular terms
    popularTerms.forEach(term => {
      if (term.startsWith(query) && term !== query) {
        suggestions.add(term)
      }
    })

    setFilteredSuggestions(Array.from(suggestions).slice(0, 5))
  }, [currentQuery, searchHistory, popularTerms])

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Live Suggestions (shown when typing) */}
      {filteredSuggestions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Suggestions
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="text-xs"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !currentQuery && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchHistory.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectSuggestion(record.search_query)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{record.search_query}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.results_count} results • {new Date(record.searched_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSuggestion(record.search_query)
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Search Terms */}
      {popularTerms.length > 0 && !currentQuery && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => onSelectSuggestion(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}