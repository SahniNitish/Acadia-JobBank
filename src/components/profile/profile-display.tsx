'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Profile } from '@/types/database'
import { User, Mail, Building, GraduationCap, Calendar } from 'lucide-react'

interface ProfileDisplayProps {
  profile: Profile
  onEdit?: () => void
  showEditButton?: boolean
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

const getRoleLabel = (role: string): string => {
  const roleLabels: { [key: string]: string } = {
    'faculty': 'Faculty Member',
    'student': 'Student',
    'admin': 'Administrator'
  }
  return roleLabels[role] || role
}

export function ProfileDisplay({ profile, onEdit, showEditButton = false }: ProfileDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{profile.full_name}</CardTitle>
          <CardDescription className="text-lg">
            {getRoleLabel(profile.role)}
          </CardDescription>
        </div>
        {showEditButton && onEdit && (
          <Button variant="outline" onClick={onEdit}>
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">{getRoleLabel(profile.role)}</p>
            </div>
          </div>

          {profile.department && (
            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{profile.department}</p>
              </div>
            </div>
          )}

          {profile.role === 'student' && profile.year_of_study && (
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Year of Study</p>
                <p className="text-sm text-muted-foreground">{getYearLabel(profile.year_of_study)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}