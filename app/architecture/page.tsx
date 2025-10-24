"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/lib/app-context"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Network,
  Settings,
  Download,
  Edit3,
  Container,
  CheckCircle,
  Info,
  AlertCircle,
  Save
} from "lucide-react"
import { ReactFlowProvider } from '@xyflow/react'
import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { SystemArchitecture } from '@/lib/types/architecture'
import { generateArchitectureFromData } from '@/lib/utils/architecture'

export default function ArchitecturePage() {
  const { state, dispatch } = useAppContext()
  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState('production')

  // Load or generate architecture from current project
  useEffect(() => {
    const loadArchitecture = async () => {
      setIsLoading(true)
      
      try {
        if (state.currentProject) {
          // Check if architecture already exists
          if (state.currentProject.architecture && 
              state.currentProject.architecture.nodes && 
              state.currentProject.architecture.nodes.length > 0) {
            setArchitecture(state.currentProject.architecture)
          } else {
            // Generate architecture from project data
            const schemaData = {
              schemas: state.currentProject.schema || [],
              analysis: state.currentProject.analysis || {}
            }
            
            const apiData = {
              endpoints: state.currentProject.endpoints?.reduce((acc: any[], endpoint) => {
                const group = endpoint.group || 'General'
                const existingGroup = acc.find((g: any) => g.group === group)
                if (existingGroup) {
                  existingGroup.endpoints.push(endpoint)
                } else {
                  acc.push({
                    group,
                    endpoints: [endpoint]
                  })
                }
                return acc
              }, []) || [],
              groups: [...new Set((state.currentProject.endpoints || []).map(e => e.group || 'General'))]
            }
            
            const generatedArchitecture = generateArchitectureFromData(
              schemaData,
              apiData,
              state.currentProject.name || 'Project'
            )
            
            setArchitecture(generatedArchitecture)
            
            // Save to project
            dispatch({
              type: 'UPDATE_ARCHITECTURE',
              payload: generatedArchitecture
            })
          }
        }
      } catch (error) {
        console.error('Error loading architecture:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadArchitecture()
  }, [state.currentProject?.id])

  const handleArchitectureChange = (updatedArchitecture: SystemArchitecture) => {
    setArchitecture(updatedArchitecture)
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    if (architecture) {
      dispatch({
        type: 'UPDATE_ARCHITECTURE',
        payload: architecture
      })
      setHasUnsavedChanges(false)
    }
  }

  const handleExport = async () => {
    if (!architecture) return
    
    const dataStr = JSON.stringify(architecture, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${architecture.name.replace(/\s+/g, '-').toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!state.currentProject) {
    return (
      <EnterpriseDashboardLayout
        title="System Architecture"
        description="Visualize and manage your system components"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Architecture" },
        ]}
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please create or select a project to view its architecture.
          </AlertDescription>
        </Alert>
      </EnterpriseDashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <EnterpriseDashboardLayout
        title="System Architecture"
        description="Visualize and manage your system components"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Architecture" },
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading architecture...</p>
          </div>
        </div>
      </EnterpriseDashboardLayout>
    )
  }

  return (
    <EnterpriseDashboardLayout
      title="System Architecture"
      description={`Architecture for ${state.currentProject.name}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Architecture" },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          {hasUnsavedChanges && (
            <Button className="gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Components</p>
                  <p className="text-2xl font-bold text-gray-900">{architecture?.nodes.length || 0}</p>
                </div>
                <Container className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connections</p>
                  <p className="text-2xl font-bold text-green-600">
                    {architecture?.edges.length || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Complexity</p>
                  <p className="text-xl font-bold text-blue-600">
                    {architecture && architecture.nodes.length <= 3 ? 'Simple' :
                     architecture && architecture.nodes.length <= 6 ? 'Moderate' : 'Complex'}
                  </p>
                </div>
                <Network className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {architecture?.metadata?.updatedAt 
                      ? new Date(architecture.metadata.updatedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Architecture Diagram */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Architecture Diagram</CardTitle>
                <CardDescription>
                  Interactive view of your system components and their relationships
                </CardDescription>
              </div>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {architecture ? (
              <div className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                <ReactFlowProvider>
                  <SystemArchitectureEditor
                    architecture={architecture}
                    onArchitectureChange={handleArchitectureChange}
                    onSave={handleSave}
                  />
                </ReactFlowProvider>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No architecture diagram available. Please complete the onboarding process to generate one.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Architecture Info */}
        {architecture && (
          <Card>
            <CardHeader>
              <CardTitle>Architecture Details</CardTitle>
              <CardDescription>
                {architecture.description || 'System architecture overview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version:</span>
                        <span className="font-medium">{architecture.metadata?.version || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">
                          {architecture.metadata?.createdAt 
                            ? new Date(architecture.metadata.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      {architecture.metadata?.tags && architecture.metadata.tags.length > 0 && (
                        <div>
                          <span className="text-gray-600 block mb-1">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {architecture.metadata.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Component Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Services:</span>
                        <span className="font-medium">
                          {architecture.nodes.filter(n => n.type === 'api-service').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Databases:</span>
                        <span className="font-medium">
                          {architecture.nodes.filter(n => n.type === 'database').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">External Services:</span>
                        <span className="font-medium">
                          {architecture.nodes.filter(n => n.type === 'external-service').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EnterpriseDashboardLayout>
  )
}