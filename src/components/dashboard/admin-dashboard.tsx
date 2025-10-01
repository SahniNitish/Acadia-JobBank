'use client'

import { useState } from 'react'
import { usePlatformStats, useUserManagement, useContentModeration, useRecentActivity, useDataExport } from '@/hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Download,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { Profile } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface AdminDashboardProps {
  className?: string
}

export function AdminDashboard({ className }: AdminDashboardProps) {
  const { stats, isLoading: statsLoading, error: statsError } = usePlatformStats()
  const { users, fetchUsers, updateRole, deactivate, isLoading: usersLoading } = useUserManagement()
  const { flaggedContent, moderateJob, isLoading: moderationLoading } = useContentModeration()
  const { activity, isLoading: activityLoading } = useRecentActivity()
  const { exportData, isExporting } = useDataExport()
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'content' | 'activity'>('overview')

  // Fetch users when users tab is selected
  const handleTabChange = (tab: typeof selectedTab) => {
    setSelectedTab(tab)
    if (tab === 'users' && users.length === 0) {
      fetchUsers()
    }
  }

  const handleExport = async (type: 'users' | 'jobs' | 'applications') => {
    try {
      await exportData(type)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleUserRoleUpdate = async (userId: string, newRole: Profile['role']) => {
    try {
      await updateRole(userId, newRole)
    } catch (error) {
      console.error('Role update failed:', error)
    }
  }

  const handleUserDeactivate = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await deactivate(userId)
      } catch (error) {
        console.error('User deactivation failed:', error)
      }
    }
  }

  const handleJobModeration = async (jobId: string, action: 'approve' | 'reject' | 'deactivate') => {
    try {
      await moderateJob(jobId, action)
    } catch (error) {
      console.error('Job moderation failed:', error)
    }
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Error loading admin dashboard: {statsError}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'content', label: 'Content Moderation', icon: Shield },
          { id: 'activity', label: 'Recent Activity', icon: Activity }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id as typeof selectedTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              selectedTab === id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Platform Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalFaculty} faculty • {stats.totalStudents} students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobPostings}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeJobPostings} currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingApplications} pending review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalApplications > 0 
                    ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.acceptedApplications} accepted applications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export platform data for reporting and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleExport('users')} 
                  disabled={isExporting}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
                <Button 
                  onClick={() => handleExport('jobs')} 
                  disabled={isExporting}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Jobs
                </Button>
                <Button 
                  onClick={() => handleExport('applications')} 
                  disabled={isExporting}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management Tab */}
      {selectedTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.department} • Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          user.role === 'admin' ? 'default' :
                          user.role === 'faculty' ? 'secondary' : 'outline'
                        }>
                          {user.role}
                        </Badge>
                        <select
                          value={user.role}
                          onChange={(e) => handleUserRoleUpdate(user.id, e.target.value as Profile['role'])}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          onClick={() => handleUserDeactivate(user.id)}
                          variant="outline"
                          size="sm"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Moderation Tab */}
      {selectedTab === 'content' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>
                Review and moderate job postings and applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moderationLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : flaggedContent ? (
                <div className="space-y-6">
                  {/* Recent Job Postings */}
                  <div>
                    <h3 className="font-medium mb-4">Recent Job Postings</h3>
                    <div className="space-y-4">
                      {flaggedContent.suspiciousJobs?.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Posted by: {job.profiles?.full_name} • {job.department}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              onClick={() => handleJobModeration(job.id, 'approve')}
                              variant="outline"
                              size="sm"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleJobModeration(job.id, 'deactivate')}
                              variant="outline"
                              size="sm"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No content flagged for moderation</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Tab */}
      {selectedTab === 'activity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform activity and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : activity ? (
                <div className="space-y-6">
                  {/* Recent Users */}
                  <div>
                    <h3 className="font-medium mb-4">New User Registrations</h3>
                    <div className="space-y-2">
                      {activity.recentUsers?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{user.full_name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({user.role})</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Jobs */}
                  <div>
                    <h3 className="font-medium mb-4">New Job Postings</h3>
                    <div className="space-y-2">
                      {activity.recentJobs?.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{job.title}</span>
                            <span className="text-sm text-muted-foreground ml-2">by {job.profiles?.full_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Applications */}
                  <div>
                    <h3 className="font-medium mb-4">New Applications</h3>
                    <div className="space-y-2">
                      {activity.recentApplications?.map((app: any) => (
                        <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{app.applicant?.full_name}</span>
                            <span className="text-sm text-muted-foreground ml-2">applied for {app.job_posting?.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}