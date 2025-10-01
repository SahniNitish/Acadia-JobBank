'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Profile } from '@/types/database'
import { getProfileCompletionPercentage, isProfileComplete } from '@/lib/profile'

interface ProfileCompletionBadgeProps {
  profile: Profile
  showProgress?: boolean
}

export function ProfileCompletionBadge({ profile, showProgress = false }: ProfileCompletionBadgeProps) {
  const completionPercentage = getProfileCompletionPercentage(profile)
  const isComplete = isProfileComplete(profile)

  const getBadgeVariant = () => {
    if (isComplete) return 'default'
    if (completionPercentage >= 75) return 'secondary'
    return 'destructive'
  }

  const getBadgeText = () => {
    if (isComplete) return 'Complete'
    if (completionPercentage >= 75) return 'Almost Complete'
    return 'Incomplete'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Badge variant={getBadgeVariant()}>
          {getBadgeText()}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {completionPercentage}%
        </span>
      </div>
      {showProgress && (
        <Progress value={completionPercentage} className="w-full" />
      )}
    </div>
  )
}