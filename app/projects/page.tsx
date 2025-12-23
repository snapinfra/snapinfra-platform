"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/appContext/app-context"
import { getProjects, deleteProject as deleteProjectAPI, isBackendAvailable } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Search, Filter, MoreVertical, Database, Calendar, Settings, Trash2, ExternalLink, LayoutGrid, List, Folder, Clock, GitBranch } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Project } from "@/lib/appContext/app-context"

export default function ProjectsPage() {
  const { state, dispatch } = useAppContext()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updated")
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Fetch projects from backend on mount - AWS is the ONLY source of truth
  useEffect(() => {
    async function fetchProjects() {
      setIsLoadingProjects(true)
      try {
        // Check what user ID we're using
        const { getCurrentUserId } = await import('@/lib/api-client')
        const userId = getCurrentUserId()
        console.log('👤 Current user ID:', userId)
        
        // Clear existing local projects and localStorage first
        state.projects.forEach(p => {
          localStorage.removeItem(`project-meta-${p.id}`)
          localStorage.removeItem(`chat-${p.id}`)
        })
        
        // Fetch projects directly from AWS backend
        const backendProjects = await getProjects()
        
        console.log(`📦 Received ${backendProjects.length} projects from AWS`)
        
        // Normalize and add each backend project to state
        backendProjects.forEach((backendProject, index) => {
          try {
            console.log(`➡️ Project ${index + 1}:`, backendProject.name, '(ID:', backendProject.id, ')')
            
            // Normalize schema format: AWS returns { tables: [...] }, but app expects array
            const normalizedProject = {
              ...backendProject,
              schema: Array.isArray(backendProject.schema)
                ? backendProject.schema
                : (backendProject.schema?.tables || [])
            }
            
            dispatch({ 
              type: 'ADD_PROJECT', 
              payload: normalizedProject
            })
          } catch (err) {
            console.error(`❌ Failed to add project ${index + 1}:`, err)
            console.error('Project data:', backendProject)
          }
        })
        
        console.log(`✅ Successfully loaded ${backendProjects.length} projects from AWS backend`)
      } catch (error: any) {
        console.error('❌ Failed to fetch projects from AWS backend:', error?.message || error)
        // Show user-friendly error message
        if (error?.statusCode === 401) {
          console.error('Please sign in to view your projects')
        }
      } finally {
        setIsLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  const filteredProjects = state.projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "name") return a.name.localeCompare(b.name)
      return 0
    })

  const handleNewProject = () => {
    router.push("/onboarding?new=true")
  }

  const handleDeleteProject = async (projectId: string) => {
    console.log('🗑️ Attempting to delete project:', projectId)
    
    try {
      // Project ID from AWS is the actual backend ID - use it directly
      await deleteProjectAPI(projectId)
      console.log('✅ Project deleted from AWS backend successfully')
      
      // Delete from local state after successful backend deletion
      dispatch({ type: 'DELETE_PROJECT', payload: projectId })
    } catch (error: any) {
      console.error('❌ Failed to delete project from AWS backend:')
      console.error('Error details:', error)
      console.error('Status code:', error?.statusCode)
      console.error('Message:', error?.message)
      
      // If project not found in backend (404), it was created locally - delete locally only
      if (error?.statusCode === 404 || error?.message?.includes('not found')) {
        console.log('⚠️  Project not found in AWS (likely local-only), deleting from local state')
        dispatch({ type: 'DELETE_PROJECT', payload: projectId })
      } else {
        // Show error to user for other errors
        alert(`Failed to delete project: ${error?.message || 'Unknown error'}\n\nCheck console for details.`)
      }
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <EnterpriseDashboardLayout
      title="Projects"
      description="Manage and organize your backend projects"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects" },
      ]}
      actions={
        <Button onClick={handleNewProject} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === "all" ? "All Status" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("draft")}>Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("archived")}>Archived</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Clock className="w-4 h-4" />
                  {sortBy === "updated" ? "Updated" : sortBy === "created" ? "Created" : "Name"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("updated")}>Recently Updated</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created")}>Recently Created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex border border-gray-200 rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-9 px-3 rounded-none ${viewMode === "list" ? "bg-gray-100" : ""}`}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-9 px-3 rounded-none ${viewMode === "grid" ? "bg-gray-100" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects List/Grid */}
        {isLoadingProjects ? (
          viewMode === "list" ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3 mb-3" />
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== "all" ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={handleNewProject} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0">
                      <Folder className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors mb-1">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        <span>{Array.isArray(project.schema) ? project.schema.length : (project.schema?.tables?.length || 0)} tables</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard?project=${project.id}`) }}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/settings?project=${project.id}`) }}>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-all cursor-pointer group border-gray-200">
                <CardContent className="p-4" onClick={() => router.push(`/projects/${project.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0">
                        <Folder className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}`) }}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}/settings`) }}>

                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">{project.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>{Array.isArray(project.schema) ? project.schema.length : (project.schema?.tables?.length || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EnterpriseDashboardLayout>
  )
}