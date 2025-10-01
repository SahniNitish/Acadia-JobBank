'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Profile } from '@/types/database'

const departments = [
  'Biology',
  'Chemistry',
  'Computer Science',
  'Economics',
  'English',
  'History',
  'Mathematics',
  'Physics',
  'Psychology',
  'Business Administration',
  'Education',
  'Engineering',
  'Environmental Science',
  'Geology',
  'Kinesiology',
  'Music',
  'Philosophy',
  'Political Science',
  'Sociology',
  'Theatre Arts'
]

const yearOptions = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
  { value: 5, label: '5th Year+' }
]

interface ProfileFormData {
  fullName: string
  role: 'faculty' | 'student' | 'admin' | ''
  department: string
  yearOfStudy?: number
}

interface ProfileFormProps {
  initialData?: Partial<Profile>
  onSubmit: (data: ProfileFormData) => Promise<void>
  isLoading?: boolean
  error?: string
  title?: string
  description?: string
  submitButtonText?: string
  showRoleSelection?: boolean
}

export function ProfileForm({
  initialData,
  onSubmit,
  isLoading = false,
  error,
  title = "Profile Information",
  description = "Update your profile details",
  submitButtonText = "Save Changes",
  showRoleSelection = false
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: initialData?.full_name || '',
    role: initialData?.role || '',
    department: initialData?.department || '',
    yearOfStudy: initialData?.year_of_study || undefined
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updateFormData = (field: keyof ProfileFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {showRoleSelection && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string) => updateFormData('role', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={formData.department} 
              onValueChange={(value: string) => updateFormData('department', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="yearOfStudy">Year of Study</Label>
              <Select 
                value={formData.yearOfStudy?.toString() || ''} 
                onValueChange={(value: string) => updateFormData('yearOfStudy', parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitButtonText}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}