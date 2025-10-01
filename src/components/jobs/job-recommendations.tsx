'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, ExternalLink, Clock, MapPin, DollarSign } from 'lucide-react'
import { useJobRecommendations } from '@/hooks/use-saved-searches'
import { useAuth } from '@/contexts/auth-context'
import { JobRecommendation } from '@/types/database'

interface JobRecommendationsProps {
  onApply?: (jobId: string) => void
  onViewJob?: (jobId: string) => void
  limit?: number
}

export function JobRecommendations({ 
  onApply, 
  onViewJob, 
  limit = 5 
}: JobRecommendationsProps) {
  const { user, profile } = useAuth()
  const { recommendations, isLoading, error } = useJobRecommendations(user?.id || null, limit)

  if (!user || profile?.role !== 'student') return null

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show anything if there are no recommendations
  }

  const formatJobType = (jobType: string) => {
    return jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800'
    if (score >= 0.6) return 'bg-blue-100 text-blue-800'
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => {
            const job = recommendation.job_posting
            if (!job) return null

            return (
              <div
                key={recommendation.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{job.department}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatJobType(job.job_type)}
                      </Badge>
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs ${getScoreColor(recommendation.recommendation_score)}`}
                  >
                    {Math.round(recommendation.recommendation_score * 100)}% match
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {job.compensation && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{job.compensation}</span>
                      </div>
                    )}
                    {job.application_deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Due {new Date(job.application_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewJob?.(job.id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {onApply && (
                      <Button
                        size="sm"
                        onClick={() => onApply(job.id)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>

                {recommendation.recommendation_reason && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                    <strong>Why recommended:</strong> {recommendation.recommendation_reason}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}