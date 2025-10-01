'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/types/database'
import { User, Mail, Building, GraduationCap } from 'lucide-react'

interface ProfileCardProps {
  profile: Profile
  onViewProfile?: (profile: Profile) => void
  showActions?: boolean
  compact?: boolean
}

const getRoleLabel = (role: string): string => {
  const roleLabels: { [key: string]: string } = {
    'faculty': 'Faculty',
    'student': 'Student',
    'admin': 'Admin'
  }
  return roleLabels[role] || role
}

const getYearLabel = (year: number): string => {
  const yearLabels: { [key: number]: string } = {
    1: '1st Year',
    2: '2nd Year', 
    3: '3rd Year',
    4: '4th Year',
    5: '5th Year+'
  }
  return yearLabels[year] || `${year}th Year`
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'faculty':
      return 'default'
    case 'student':
      return 'secondary'
    case 'admin':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function ProfileCard({ profile, onViewProfile, showActions = false, compact = false }: ProfileCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className={compact ? "pb-2" : "pb-4"}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{profile.full_name}</h3>
            <div className="flex items-center space-x-2">
              <Badge variant={getRoleBadgeVariant(profile.role)}>
                {getRoleLabel(profile.role)}
              </Badge>
              {profile.department && (
                <span className="text-sm text-muted-foreground">
                  {profile.department}
                </span>
              )}
            </div>
          </div>
          {showActions && onViewProfile && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewProfile(profile)}
            >
              View
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{profile.email}</span>
          </div>
          
          {profile.department && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{profile.department}</span>
            </div>
          )}
          
          {profile.role === 'student' && profile.year_of_study && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>{getYearLabel(profile.year_of_study)}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}