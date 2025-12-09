"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext } from "@/lib/appContext/app-context"
import { getProjectById, updateProject, deleteProject as deleteProjectAPI } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Settings, Trash2, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as "draft" | "active" | "building" | "deployed" | "error"
  })

  // Load project if not in context
  useEffect(() => {
    if (!projectId) return
    if (!currentProject || currentProject.id !== projectId) {
      setIsLoading(true)
      getProjectById(projectId)
        .then((project) => {
          const normalizedProject = {
            ...project,
            schema: Array.isArray(project.schema)
              ? project.schema
              : (project.schema?.tables || [])
          }
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: normalizedProject })
        })
        .catch(() => router.push('/projects'))
        .finally(() => setIsLoading(false))
    }
  }, [projectId, currentProject, dispatch, router])

  // Update form when project loads
  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || "",
        status: currentProject.status || "draft"
      })
    }
  }, [currentProject])

  const handleSave = async () => {
    if (!currentProject) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      await updateProject(currentProject.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status
      })
      
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          id: currentProject.id,
          name: formData.name,
          description: formData.description,
          status: formData.status
        }
      })
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('Failed to update project settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentProject) return
    
    setIsDeleting(true)
    
    try {
      await deleteProjectAPI(currentProject.id)
      dispatch({ type: 'DELETE_PROJECT', payload: currentProject.id })
      router.push('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
      setIsDeleting(false)
    }
  }

  if (isLoading || !currentProject) {
    return (
      <EnterpriseDashboardLayout
        title="Project Settings"
        description="Configure project settings"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Settings" },
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </EnterpriseDashboardLayout>
    )
  }

  return (
    <EnterpriseDashboardLayout
      title="Project Settings"
      description="Configure your project settings"
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: currentProject.name, href: `/projects/${projectId}` },
        { label: "Settings" },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        {saveSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Update your project information and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
              />
              <p className="text-xs text-gray-500">
                This name will be displayed throughout the application
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project"
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Provide a brief description of your project
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Current status of the project
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Read-only information about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Project ID</Label>
                <p className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded mt-1">
                  {currentProject.id}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded mt-1">
                  {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Last Updated</Label>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded mt-1">
                  {new Date(currentProject.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Database Type</Label>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded mt-1">
                  {currentProject.database?.type?.toUpperCase() || 'POSTGRESQL'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will affect your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Delete Project</h4>
                <p className="text-sm text-gray-600">
                  Once you delete a project, there is no going back. This will permanently delete all project data including schema, code, and architecture.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="ml-4 flex-shrink-0">
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      <strong className="block mt-2 text-gray-900">{currentProject.name}</strong>
                      and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, delete project'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnterpriseDashboardLayout>
  )
}
