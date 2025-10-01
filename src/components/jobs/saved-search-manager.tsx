'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Search, 
  Bell, 
  BellOff, 
  Edit, 
  Trash2, 
  Play,
  Clock,
  Star
} from 'lucide-react'
import { SavedSearch } from '@/types/database'
import { JobSearchFilters } from './job-search-filters'
import { useSavedSearches } from '@/hooks/use-saved-searches'
import { useAuth } from '@/contexts/auth-context'

interface SavedSearchManagerProps {
  currentFilters: JobSearchFilters
  onLoadSearch: (filters: JobSearchFilters) => void
  onSaveSearch?: () => void
}

export function SavedSearchManager({
  currentFilters,
  onLoadSearch,
  onSaveSearch
}: SavedSearchManagerProps) {
  const { user } = useAuth()
  const { savedSearches, createSearch, updateSearch, deleteSearch, isLoading } = useSavedSearches(user?.id || null)
  
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    is_alert_enabled: false,
    alert_frequency: 'daily' as const
  })

  const handleSaveCurrentSearch = async () => {
    if (!user) return

    try {
      await createSearch({
        name: saveFormData.name,
        search_criteria: {
          search: currentFilters.search,
          department: currentFilters.department,
          job_type: currentFilters.jobType || undefined,
          deadline_from: currentFilters.deadlineFrom,
          deadline_to: currentFilters.deadlineTo,
          sort_by: currentFilters.sortBy,
          sort_order: currentFilters.sortOrder
        },
        is_alert_enabled: saveFormData.is_alert_enabled,
        alert_frequency: saveFormData.alert_frequency
      })

      setShowSaveForm(false)
      setSaveFormData({ name: '', is_alert_enabled: false, alert_frequency: 'daily' })
      onSaveSearch?.()
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }

  const handleUpdateSearch = async () => {
    if (!editingSearch) return

    try {
      await updateSearch(editingSearch.id, {
        name: saveFormData.name,
        is_alert_enabled: saveFormData.is_alert_enabled,
        alert_frequency: saveFormData.alert_frequency
      })

      setEditingSearch(null)
      setSaveFormData({ name: '', is_alert_enabled: false, alert_frequency: 'daily' })
    } catch (error) {
      console.error('Failed to update search:', error)
    }
  }

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return

    try {
      await deleteSearch(searchId)
    } catch (error) {
      console.error('Failed to delete search:', error)
    }
  }

  const handleLoadSearch = (savedSearch: SavedSearch) => {
    const criteria = savedSearch.search_criteria
    onLoadSearch({
      search: criteria.search || '',
      department: criteria.department || '',
      jobType: criteria.job_type || '',
      deadlineFrom: criteria.deadline_from || '',
      deadlineTo: criteria.deadline_to || '',
      sortBy: (criteria.sort_by as any) || 'created_at',
      sortOrder: (criteria.sort_order as any) || 'desc'
    })
  }

  const startEditing = (savedSearch: SavedSearch) => {
    setEditingSearch(savedSearch)
    setSaveFormData({
      name: savedSearch.name,
      is_alert_enabled: savedSearch.is_alert_enabled,
      alert_frequency: savedSearch.alert_frequency as 'daily'
    })
  }

  const hasActiveFilters = currentFilters.search || 
    currentFilters.department || 
    currentFilters.jobType || 
    currentFilters.deadlineFrom || 
    currentFilters.deadlineTo

  return (
    <div className="space-y-4">
      {/* Save Current Search */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Current Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showSaveForm ? (
              <Button 
                onClick={() => setShowSaveForm(true)}
                className="w-full"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save This Search
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="searchName">Search Name</Label>
                  <Input
                    id="searchName"
                    placeholder="e.g., Computer Science Research Jobs"
                    value={saveFormData.name}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAlerts"
                    checked={saveFormData.is_alert_enabled}
                    onCheckedChange={(checked) => 
                      setSaveFormData(prev => ({ ...prev, is_alert_enabled: checked }))
                    }
                  />
                  <Label htmlFor="enableAlerts">Enable job alerts</Label>
                </div>

                {saveFormData.is_alert_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="alertFrequency">Alert Frequency</Label>
                    <Select 
                      value={saveFormData.alert_frequency}
                      onValueChange={(value: any) => 
                        setSaveFormData(prev => ({ ...prev, alert_frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveCurrentSearch}
                    disabled={!saveFormData.name.trim() || isLoading}
                    className="flex-1"
                  >
                    Save Search
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Searches List */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Searches ({savedSearches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedSearches.map((savedSearch) => (
                <div
                  key={savedSearch.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{savedSearch.name}</h4>
                      {savedSearch.is_alert_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          {savedSearch.alert_frequency}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {savedSearch.search_criteria.search && (
                        <span>&ldquo;{savedSearch.search_criteria.search}&rdquo;</span>
                      )}
                      {savedSearch.search_criteria.department && (
                        <span className="ml-2">• {savedSearch.search_criteria.department}</span>
                      )}
                      {savedSearch.search_criteria.job_type && (
                        <span className="ml-2">• {savedSearch.search_criteria.job_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLoadSearch(savedSearch)}
                      title="Load this search"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(savedSearch)}
                      title="Edit search"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSearch(savedSearch.id)}
                      title="Delete search"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Search Modal */}
      {editingSearch && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit Saved Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editSearchName">Search Name</Label>
                <Input
                  id="editSearchName"
                  value={saveFormData.name}
                  onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editEnableAlerts"
                  checked={saveFormData.is_alert_enabled}
                  onCheckedChange={(checked) => 
                    setSaveFormData(prev => ({ ...prev, is_alert_enabled: checked }))
                  }
                />
                <Label htmlFor="editEnableAlerts">Enable job alerts</Label>
              </div>

              {saveFormData.is_alert_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="editAlertFrequency">Alert Frequency</Label>
                  <Select 
                    value={saveFormData.alert_frequency}
                    onValueChange={(value: any) => 
                      setSaveFormData(prev => ({ ...prev, alert_frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdateSearch}
                  disabled={!saveFormData.name.trim() || isLoading}
                  className="flex-1"
                >
                  Update Search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingSearch(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}