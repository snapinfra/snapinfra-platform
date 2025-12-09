"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext, useOnboardingData } from "@/lib/appContext/app-context"
import { getProjectById } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Network,
  Settings,
  Download,
  Container,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  Code2,
  Share2,
  Database,
  Map,
  FileCode,
  Loader2
} from "lucide-react"
import { ReactFlowProvider } from '@xyflow/react'
import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { SystemArchitecture } from '@/lib/types/architecture'
import ERDDiagramViewer from "@/components/erd/ERDDiagramViewer"
import DataFlowDiagram from "@/components/dataflow/DataFlowDiagram"

interface DiagramData {
  lld: SystemArchitecture | null
  dataflow: SystemArchitecture | null
  erd: SystemArchitecture | null
  apiMap: SystemArchitecture | null
}

export default function ArchitecturePage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { updateData } = useOnboardingData()

  const [diagrams, setDiagrams] = useState<DiagramData>({
    lld: null,
    dataflow: null,
    erd: null,
    apiMap: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  // Refs for export functionality
  const lldCanvasRef = useRef<HTMLDivElement>(null)
  const dataflowCanvasRef = useRef<HTMLDivElement>(null)
  const erdCanvasRef = useRef<HTMLDivElement>(null)
  const apiMapCanvasRef = useRef<HTMLDivElement>(null)

  // Load project if not in context
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    if (!state.currentProject || state.currentProject.id !== projectId) {
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
          setLoadError(null)
        })
        .catch((error) => {
          console.error('Error loading project:', error)
          setLoadError('Failed to load project')
          setIsLoading(false)
          router.push('/projects')
        })
    } else {
      setIsLoading(false)
    }
  }, [projectId, state.currentProject?.id, dispatch, router])

  // Load diagrams from project
  useEffect(() => {
    if (state.currentProject?.diagrams) {
      console.log('Loading diagrams from project:', state.currentProject.diagrams)

      // Convert ERD data if needed
      let erdData = state.currentProject.diagrams.erd
      if (erdData && (erdData as any).tables) {
        erdData = convertERDToArchitecture(erdData as any)
      }

      // Convert API Map data if needed
      let apiMapData = state.currentProject.diagrams.apiMap
      if (apiMapData && (apiMapData as any).groups) {
        apiMapData = convertAPIMapToArchitecture(apiMapData as any)
      }

      setDiagrams({
        lld: state.currentProject.diagrams.lld || null,
        dataflow: state.currentProject.diagrams.dataflow || null,
        erd: erdData || null,
        apiMap: apiMapData || null
      })
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [state.currentProject?.diagrams])

  // Convert ERD format to SystemArchitecture format
  const convertERDToArchitecture = (erdData: any): SystemArchitecture => {
    const nodes = erdData.tables?.map((table: any) => ({
      id: table.id,
      type: 'database',
      position: table.position || { x: 0, y: 0 },
      data: {
        name: table.name,
        description: `${table.fields?.length || 0} fields`,
        color: table.color || '#EF4444',
        metadata: {
          fields: table.fields,
          indexes: table.indexes,
          constraints: table.constraints
        }
      }
    })) || []

    const edges = erdData.relationships?.map((rel: any) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      type: 'smoothstep',
      label: rel.label || `${rel.sourceField} → ${rel.targetField}`,
      data: {
        type: rel.type,
        sourceField: rel.sourceField,
        targetField: rel.targetField
      }
    })) || []

    return {
      id: erdData.id || 'erd-converted',
      name: erdData.name || 'Entity Relationship Diagram',
      description: `${nodes.length} tables, ${edges.length} relationships`,
      nodes,
      edges,
      metadata: erdData.metadata || {}
    }
  }

  // Convert API Map format to SystemArchitecture format
  const convertAPIMapToArchitecture = (apiMapData: any): SystemArchitecture => {
    const nodes: any[] = []

    apiMapData.groups?.forEach((group: any) => {
      const endpointList = group.endpoints?.map((ep: any, idx: number) =>
        `${idx + 1}. ${ep.method} ${ep.path}${ep.requiresAuth ? ' 🔒' : ''}`
      ).join('\n') || ''

      const description = group.endpointPaths
        ? `${group.endpoints?.length || 0} endpoints:\n\n${endpointList}`
        : `${group.endpoints?.length || 0} endpoints`

      nodes.push({
        id: group.id,
        type: 'api-service',
        position: group.position || { x: 0, y: 0 },
        data: {
          name: group.name,
          description: description,
          color: group.color || '#8B5CF6',
          metadata: {
            endpoints: group.endpoints,
            endpointPaths: group.endpointPaths,
            formattedEndpoints: group.formattedEndpoints,
            totalEndpoints: group.endpoints?.length || 0,
            authEndpoints: group.endpoints?.filter((e: any) => e.requiresAuth).length || 0,
            publicEndpoints: group.endpoints?.filter((e: any) => !e.requiresAuth).length || 0
          }
        }
      })
    })

    const edges = apiMapData.flows?.map((flow: any, index: number) => ({
      id: flow.id || `flow-${index}`,
      source: flow.source,
      target: flow.target,
      type: 'smoothstep',
      label: flow.label || flow.method || 'API Call',
      data: {
        method: flow.method
      }
    })) || []

    return {
      id: apiMapData.id || 'api-map-converted',
      name: apiMapData.name || 'API Architecture Map',
      description: `${nodes.length} endpoint groups, ${edges.length} flows`,
      nodes,
      edges,
      metadata: {
        ...apiMapData.metadata,
        totalGroups: nodes.length,
        totalFlows: edges.length
      }
    }
  }

  const handleDiagramChange = (key: keyof DiagramData, updatedDiagram: SystemArchitecture) => {
    setDiagrams(prev => ({
      ...prev,
      [key]: updatedDiagram
    }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!state.currentProject) return

    try {
      // Update project with new diagrams
      const updatedProject = {
        ...state.currentProject,
        diagrams: diagrams
      }

      dispatch({
        type: 'SET_CURRENT_PROJECT',
        payload: updatedProject
      })

      // Update context if available
      if (updateData) {
        await updateData({ diagrams })
      }

      setHasUnsavedChanges(false)
      console.log('Diagrams saved successfully')
    } catch (error) {
      console.error('Error saving diagrams:', error)
      alert('Failed to save diagrams. Please try again.')
    }
  }

  const handleExportPNG = async (canvasRef: React.RefObject<HTMLDivElement>, diagramName: string) => {
    if (!canvasRef.current) {
      alert('Canvas not found. Please try again.')
      return
    }

    setIsExporting(diagramName)

    try {
      const { toPng } = await import('html-to-image')
      await new Promise(resolve => setTimeout(resolve, 100))

      const reactFlowWrapper = canvasRef.current.querySelector('.react-flow') as HTMLElement
      const exportElement = reactFlowWrapper || canvasRef.current

      const dataUrl = await toPng(exportElement, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          if (node.classList) {
            return !node.classList.contains('react-flow__controls') &&
              !node.classList.contains('react-flow__attribution')
          }
          return true
        }
      })

      const link = document.createElement('a')
      const projectName = state.currentProject?.name?.replace(/\s+/g, '-').toLowerCase() || 'diagram'
      link.download = `${projectName}-${diagramName}.png`
      link.href = dataUrl
      link.click()

      console.log(`${diagramName} diagram exported successfully as PNG`)
    } catch (error) {
      console.error('Error exporting PNG:', error)
      alert('Failed to export diagram. Please try again.')
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportJSON = () => {
    if (!diagrams) return

    const dataStr = JSON.stringify(diagrams, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    const projectName = state.currentProject?.name?.replace(/\s+/g, '-').toLowerCase() || 'diagrams'
    link.download = `${projectName}-all-diagrams.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Calculate insights from LLD
  const getLLDInsights = () => {
    if (!diagrams.lld) return null

    const layerDistribution = diagrams.lld.nodes.reduce((acc: any, node) => {
      const layer = node.data.metadata?.layer || 'Other'
      acc[layer] = (acc[layer] || 0) + 1
      return acc
    }, {})

    const totalMethods = diagrams.lld.nodes.reduce((sum, node) => {
      return sum + (node.data.metadata?.methods?.length || 0)
    }, 0)

    return {
      componentsCount: diagrams.lld.nodes.length,
      connectionsCount: diagrams.lld.edges.length,
      methodsCount: totalMethods,
      layerDistribution,
      avgMethodsPerComponent: diagrams.lld.nodes.length > 0 ? totalMethods / diagrams.lld.nodes.length : 0
    }
  }

  const insights = getLLDInsights()

  // Show error state
  if (loadError) {
    return (
      <EnterpriseDashboardLayout
        title="System Architecture"
        description="Visualize and manage your system components"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/projects" },
          { label: "Architecture" },
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadError}. Please try again or return to projects.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/projects')}>
            Return to Projects
          </Button>
        </div>
      </EnterpriseDashboardLayout>
    )
  }

  // Show loading state
  if (!state.currentProject || isLoading) {
    return (
      <EnterpriseDashboardLayout
        title="System Architecture"
        description="Visualize and manage your system components"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/projects" },
          { label: state.currentProject?.name || "Project", href: projectId ? `/projects/${projectId}` : "#" },
          { label: "Architecture" },
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1d1d1f]">Loading Architecture</h2>
            <p className="text-sm text-[#605A57]">
              {!state.currentProject ? 'Loading project...' : 'Loading diagrams...'}
            </p>
          </div>
        </div>
      </EnterpriseDashboardLayout>
    )
  }

  // Check if any diagrams exist
  const hasAnyDiagram = diagrams.lld || diagrams.dataflow || diagrams.erd || diagrams.apiMap

  if (!hasAnyDiagram) {
    return (
      <EnterpriseDashboardLayout
        title="System Architecture"
        description={`Architecture for ${state.currentProject.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/projects" },
          { label: state.currentProject.name, href: `/projects/${projectId}` },
          { label: "Architecture" },
        ]}
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No architecture diagrams available. Please complete the onboarding process to generate diagrams.
          </AlertDescription>
        </Alert>
      </EnterpriseDashboardLayout>
    )
  }

  return (
    <EnterpriseDashboardLayout
      title="System Architecture"
      description={`Architecture for ${state.currentProject.name}`}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/projects" },
        { label: state.currentProject.name, href: `/projects/${projectId}` },
        { label: "Architecture" },
      ]}
      actions={
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" className="gap-2" onClick={handleExportJSON}>
            <Download className="w-4 h-4" />
            Export All
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
        {/* Overview Stats */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Components</p>
                    <p className="text-2xl font-bold text-gray-900">{insights.componentsCount}</p>
                  </div>
                  <FileCode className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Methods</p>
                    <p className="text-2xl font-bold text-purple-600">{insights.methodsCount}</p>
                  </div>
                  <Container className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Connections</p>
                    <p className="text-2xl font-bold text-green-600">{insights.connectionsCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Layers</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Object.keys(insights.layerDistribution).length}
                    </p>
                  </div>
                  <Network className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Low-Level Design (LLD) */}
        {diagrams.lld && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 rounded-md">
                    <Code2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Low-Level Design (LLD)</CardTitle>
                    <CardDescription>
                      Controllers, Services, Repositories & Data Flow
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-3">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => handleExportPNG(lldCanvasRef, 'lld')}
                    disabled={isExporting === 'lld'}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isExporting === 'lld' ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={lldCanvasRef} className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                <ReactFlowProvider>
                  <SystemArchitectureEditor
                    type="lld"
                    architecture={diagrams.lld}
                    onArchitectureChange={(updated) => handleDiagramChange('lld', updated)}
                    onSave={handleSave}
                  />
                </ReactFlowProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Flow Diagram */}
        {diagrams.dataflow && diagrams.dataflow.nodes && diagrams.dataflow.nodes.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/10 rounded-md">
                    <Share2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Data Flow Diagram</CardTitle>
                    <CardDescription>
                      Information flow between system components
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-3">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => handleExportPNG(dataflowCanvasRef, 'dataflow')}
                    disabled={isExporting === 'dataflow'}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isExporting === 'dataflow' ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={dataflowCanvasRef} className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                <DataFlowDiagram dataFlow={diagrams.dataflow} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Relationship Diagram (ERD) */}
        {diagrams.erd && diagrams.erd.nodes && diagrams.erd.nodes.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/10 rounded-md">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Entity Relationship Diagram (ERD)</CardTitle>
                    <CardDescription>
                      Database schema and relationships
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-3">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => handleExportPNG(erdCanvasRef, 'erd')}
                    disabled={isExporting === 'erd'}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isExporting === 'erd' ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={erdCanvasRef} className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                <ERDDiagramViewer
                  erd={state.currentProject.diagrams?.erd}
                  readonly={false}
                  onSave={async (updatedERD) => {
                    const newDiagrams = {
                      ...diagrams,
                      erd: updatedERD
                    }
                    setDiagrams(newDiagrams)
                    setHasUnsavedChanges(true)

                    // Update localStorage
                    try {
                      const projectData = {
                        ...state.currentProject,
                        diagrams: newDiagrams
                      }
                      window.localStorage.setItem('onboardingData', JSON.stringify(projectData))
                    } catch (err) {
                      console.warn('Failed to write to localStorage', err)
                    }

                    // Update context
                    if (updateData) {
                      await updateData({ diagrams: newDiagrams })
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Architecture Map */}
        {diagrams.apiMap && diagrams.apiMap.nodes && diagrams.apiMap.nodes.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/10 rounded-md">
                    <Map className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>API Architecture Map</CardTitle>
                    <CardDescription>
                      API endpoints and service integration
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs px-3">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => handleExportPNG(apiMapCanvasRef, 'api-map')}
                    disabled={isExporting === 'api-map'}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isExporting === 'api-map' ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={apiMapCanvasRef} className="h-[600px] border rounded-lg overflow-hidden bg-gray-50">
                <ReactFlowProvider>
                  <SystemArchitectureEditor
                    type="apiMap"
                    architecture={diagrams.apiMap}
                    onArchitectureChange={(updated) => handleDiagramChange('apiMap', updated)}
                    onSave={handleSave}
                  />
                </ReactFlowProvider>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EnterpriseDashboardLayout>
  )
}