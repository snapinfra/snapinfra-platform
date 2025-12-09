"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, Code2, Download, Eye, BarChart, Zap, Shield, Save, CheckCircle, Activity, AlertTriangle, Cloud, GitBranch, Clock, Globe, ChevronRight, TrendingUp, Layers, FileCode, Package, Database, Share2, Map, Loader2 } from "lucide-react"
import { ReactFlowProvider } from '@xyflow/react'
import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { SystemArchitecture } from '@/lib/types/architecture'
import { useOnboardingData } from "@/lib/appContext/app-context"
import ERDDiagramViewer from "../erd/ERDDiagramViewer"
import DataFlowDiagram from "../dataflow/DataFlowDiagram"

interface LLDStepProps {
  data: {
    projectName?: string
    description?: string
    schemas?: any[]
    analysis?: any
    endpoints?: any[]
    diagrams?: {
      lld?: SystemArchitecture | null
      dataflow?: SystemArchitecture | null
      erd?: SystemArchitecture | null
      apiMap?: SystemArchitecture | null
    }
    architecture?: any
  }
  onComplete: () => void
  onBack: () => void
}

interface DiagramData {
  lld: SystemArchitecture | null
  dataflow: SystemArchitecture | null
  erd: SystemArchitecture | null
  apiMap: SystemArchitecture | null
}

export function LLDStep({ data, onComplete, onBack }: LLDStepProps) {
  console.log(data, 'lld step data')
  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(data.architecture || null)
  const [diagrams, setDiagrams] = useState<DiagramData>({
    lld: null,
    dataflow: null,
    erd: null,
    apiMap: null
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentGenerating, setCurrentGenerating] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const { updateData } = useOnboardingData();

  const lldCanvasRef = useRef<HTMLDivElement>(null)
  const dataflowCanvasRef = useRef<HTMLDivElement>(null)
  const erdCanvasRef = useRef<HTMLDivElement>(null)
  const apiMapCanvasRef = useRef<HTMLDivElement>(null)

  // Load pre-generated diagrams from Step One
  useEffect(() => {
    if (data.diagrams) {
      console.log('Loading pre-generated diagrams from Step One:', data.diagrams)

      // Convert any ERD data to proper format if needed
      let erdData = data.diagrams.erd
      if (erdData && (erdData as any).tables) {
        erdData = convertERDToArchitecture(erdData as any)
      }

      // Convert any API Map data to proper format if needed
      let apiMapData = data.diagrams.apiMap
      if (apiMapData && (apiMapData as any).groups) {
        apiMapData = convertAPIMapToArchitecture(apiMapData as any)
      }

      setDiagrams({
        lld: data.diagrams.lld || null,
        dataflow: data.diagrams.dataflow || null,
        erd: erdData || null,
        apiMap: apiMapData || null
      })
    }
  }, [data.diagrams])


  const handleContinue = async () => {
    if (!architecture) return

    try {
      // Clean the architecture data before saving
      const cleanArchitecture = {
        id: architecture.id,
        name: architecture.name,
        description: architecture.description,
        nodes: architecture.nodes?.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })) || [],
        edges: architecture.edges?.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label
        })) || [],
        metadata: architecture.metadata
      }

      // Save to context directly
      await updateData({
        architecture: cleanArchitecture
      })

      // Call onComplete with absolutely no arguments
      onComplete()
    } catch (error) {
      console.error('Error saving architecture:', error)
      alert('Failed to save architecture. Please try again.')
    }
  }


  const handleGenerateAllDiagrams = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Generate LLD
      setCurrentGenerating('Low-Level Design')
      await generateDiagram('lld', '/api/generate-lld')
      setGenerationProgress(25)

      // Generate Data Flow
      setCurrentGenerating('Data Flow Diagram')
      await generateDiagram('dataflow', '/api/generate-dataflow')
      setGenerationProgress(50)

      // Generate ERD
      setCurrentGenerating('Entity Relationship Diagram')
      await generateDiagram('erd', '/api/generate-erd')
      setGenerationProgress(75)

      // Generate API Map
      setCurrentGenerating('API Architecture Map')
      await generateDiagram('apiMap', '/api/generate-api-map')
      setGenerationProgress(100)

    } catch (error: any) {
      console.error('❌ Diagram generation error:', error)
      alert(`Failed to generate diagrams: ${error.message}`)
    } finally {
      setIsGenerating(false)
      setCurrentGenerating('')
      setTimeout(() => setGenerationProgress(0), 1000)
    }
  }

  const generateDiagram = async (key: keyof DiagramData, endpoint: string) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schemas: data.schemas,
        endpoints: data.endpoints,
        projectName: data.projectName || 'Application',
        description: data.description,
        analysis: data.analysis
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || `Failed to generate ${key}`)
    }

    console.log(`✅ ${key} Generated:`, result)

    // Extract the diagram data based on the key
    let diagramData = null

    if (key === 'lld') {
      diagramData = result.lld
    } else if (key === 'dataflow') {
      // Note: API returns "dataFlow" with capital F
      diagramData = result.dataFlow || result.dataflow || result.diagram || result.architecture
    } else if (key === 'erd') {
      const erdData = result.erd || result.diagram || result.architecture
      // Convert ERD format to SystemArchitecture format
      if (erdData && erdData.tables) {
        diagramData = convertERDToArchitecture(erdData)
      } else {
        diagramData = erdData
      }
    } else if (key === 'apiMap') {
      const apiMapData = result.apiMap || result.diagram || result.architecture
      // Convert API Map format to SystemArchitecture format
      if (apiMapData && apiMapData.groups) {
        diagramData = convertAPIMapToArchitecture(apiMapData)
      } else {
        diagramData = apiMapData
      }
    }

    // Fallback: check all possible keys
    if (!diagramData) {
      diagramData = result.lld || result.diagram || result.architecture || result.data
    }

    console.log(`📊 ${key} diagram data:`, diagramData)

    // Update the specific diagram
    setDiagrams(prev => ({
      ...prev,
      [key]: diagramData
    }))
  }

  // Convert ERD format (tables/relationships) to SystemArchitecture format (nodes/edges)
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

  // Convert API Map format (groups/flows) to SystemArchitecture format (nodes/edges)
  const convertAPIMapToArchitecture = (apiMapData: any): SystemArchitecture => {
    const nodes: any[] = []

    // Convert groups to nodes with detailed endpoint information
    apiMapData.groups?.forEach((group: any) => {
      // Format endpoint list for display
      const endpointList = group.endpoints?.map((ep: any, idx: number) =>
        `${idx + 1}. ${ep.method} ${ep.path}${ep.requiresAuth ? ' 🔒' : ''}`
      ).join('\n') || ''

      // Create a detailed description
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

  const handleSaveDiagram = (key: keyof DiagramData) => {
    console.log(`Saving ${key}:`, diagrams[key])
    setHasUnsavedChanges(false)
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
      const projectName = data.projectName?.replace(/\s+/g, '-').toLowerCase() || 'diagram'
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

    const hasControllers = diagrams.lld.nodes.some(n => n.data.name?.includes('Controller'))
    const hasServices = diagrams.lld.nodes.some(n => n.data.name?.includes('Service'))
    const hasRepositories = diagrams.lld.nodes.some(n => n.data.name?.includes('Repository'))
    const hasMiddleware = diagrams.lld.nodes.some(n => n.data.metadata?.layer?.includes('Middleware'))

    return {
      componentsCount: diagrams.lld.nodes.length,
      connectionsCount: diagrams.lld.edges.length,
      methodsCount: totalMethods,
      layerDistribution,
      hasControllers,
      hasServices,
      hasRepositories,
      hasMiddleware,
      avgMethodsPerComponent: totalMethods / diagrams.lld.nodes.length
    }
  }

  const insights = getLLDInsights()

  // Loading state
  if (isGenerating) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
        <div className="text-center space-y-4 max-w-[900px] mx-auto">
          <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Code2 className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1d1d1f]">Generating Architecture Diagrams</h2>
          <p className="text-sm text-[#605A57]">
            {currentGenerating || 'Creating detailed component architecture...'}
          </p>
          <div className="w-full max-w-md mx-auto mt-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-[#605A57] mt-2">{generationProgress}% complete</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state - Only show if LLD is missing
  if (!diagrams.lld) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
        <div className="text-center space-y-4 max-w-[900px] mx-auto animate-pulse">
          <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>

          <h2 className="text-2xl font-semibold text-[#1d1d1f]">
            Loading Diagram…
          </h2>

          <p className="text-sm text-[#605A57]">
            Please wait while we generate the architecture diagram.
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-[900px] mx-auto mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-700 text-xs font-medium mb-2">
          <Code2 className="w-3 h-3" />
          Architecture Diagrams
        </div>
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Comprehensive System Design
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm text-[#605A57]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <span>{insights?.componentsCount || 0} components</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <span>4 diagram types</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <span>{Object.keys(insights?.layerDistribution || {}).length} layers</span>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent"></div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="group relative bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-lg p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileCode className="w-8 h-8 text-blue-600" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Components</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.componentsCount || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Implementation Ready</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-lg p-4 transition-all duration-300 hover:border-purple-200 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Methods</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.methodsCount || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Activity className="w-2.5 h-2.5" />
              <span>{insights?.avgMethodsPerComponent.toFixed(1)} avg per component</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-green-50 border border-green-100 rounded-lg p-4 transition-all duration-300 hover:border-green-200 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitBranch className="w-8 h-8 text-green-600" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Connections</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.connectionsCount || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Shield className="w-2.5 h-2.5" />
              <span>Data flows mapped</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-orange-50 border border-orange-100 rounded-lg p-4 transition-all duration-300 hover:border-orange-200 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="w-8 h-8 text-orange-600" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Layers</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{Object.keys(insights?.layerDistribution || {}).length}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Cloud className="w-2.5 h-2.5" />
              <span>Organized structure</span>
            </div>
          </div>
        </div>
      </div>

      {/* LLD Canvas */}
      <div className="space-y-6">
        <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#fafafa] to-white border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded-md">
                <Code2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Low-Level Design (LLD)</h3>
                <p className="text-xs text-[#605A57]">Controllers, Services, Repositories & Data Flow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-blue-600/5">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-3 hover:bg-blue-600/5"
                onClick={() => handleExportPNG(lldCanvasRef, 'lld')}
                disabled={isExporting === 'lld'}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {isExporting === 'lld' ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
          <div ref={lldCanvasRef} className="h-[600px]">
            <ReactFlowProvider>
              <SystemArchitectureEditor
                type={"lld"}
                architecture={diagrams.lld!}
                onArchitectureChange={(updated) => handleDiagramChange('lld', updated)}
                onSave={() => handleSaveDiagram('lld')}
              />
            </ReactFlowProvider>
          </div>
        </div>

        {/* Data Flow Diagram */}
        {diagrams.dataflow && diagrams.dataflow.nodes && diagrams.dataflow.nodes.length > 0 && (
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#fafafa] to-white border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/10 rounded-md">
                  <Share2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">Data Flow Diagram</h3>
                  <p className="text-xs text-[#605A57]">Information flow between system components</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-purple-600/5">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-3 hover:bg-purple-600/5"
                  onClick={() => handleExportPNG(dataflowCanvasRef, 'dataflow')}
                  disabled={isExporting === 'dataflow'}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isExporting === 'dataflow' ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
            <div ref={dataflowCanvasRef} className="h-[600px]">
              {/* <ReactFlowProvider>
                <SystemArchitectureEditor
                  type={"dataflow"}
                  architecture={diagrams.dataflow}
                  onArchitectureChange={(updated) => handleDiagramChange('dataflow', updated)}
                  onSave={() => handleSaveDiagram('dataflow')}
                />
              </ReactFlowProvider> */}

              <DataFlowDiagram dataFlow={diagrams.dataflow} />

            </div>
          </div>
        )}

        {/* ERD Diagram */}
        {diagrams.erd && diagrams.erd.nodes && diagrams.erd.nodes.length > 0 && (
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#fafafa] to-white border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/10 rounded-md">
                  <Database className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">Entity Relationship Diagram (ERD)</h3>
                  <p className="text-xs text-[#605A57]">Database schema and relationships</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-green-600/5">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-3 hover:bg-green-600/5"
                  onClick={() => handleExportPNG(erdCanvasRef, 'erd')}
                  disabled={isExporting === 'erd'}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isExporting === 'erd' ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
            <div ref={erdCanvasRef} className="h-[600px]">
              {/* <ReactFlowProvider>
                <SystemArchitectureEditor
                  type={"erd"}
                  architecture={diagrams.erd}
                  onArchitectureChange={(updated) => handleDiagramChange('erd', updated)}
                  onSave={() => handleSaveDiagram('erd')}
                />


              </ReactFlowProvider> */}
              <ERDDiagramViewer
                erd={data.diagrams.erd}
                readonly={false}
                onSave={async (updatedERD) => {
                  // Update onboardingData structure
                  const newOnboardingData = {
                    ...data,
                    diagrams: {
                      ...data.diagrams,
                      erd: updatedERD
                    }
                  };

                  // Persist to localStorage (browser)
                  try {
                    window.localStorage.setItem('onboardingData', JSON.stringify(newOnboardingData));
                  } catch (err) {
                    console.warn('Failed to write onboardingData to localStorage', err);
                  }

                  // Update onboarding context/state if updateData is available
                  if (typeof updateData === 'function') {
                    await updateData(newOnboardingData);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* API Map Diagram */}
        {diagrams.apiMap && diagrams.apiMap.nodes && diagrams.apiMap.nodes.length > 0 && (
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#fafafa] to-white border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600/10 rounded-md">
                  <Map className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1d1d1f]">API Architecture Map</h3>
                  <p className="text-xs text-[#605A57]">API endpoints and service integration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-orange-600/5">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs px-3 hover:bg-orange-600/5"
                  onClick={() => handleExportPNG(apiMapCanvasRef, 'api-map')}
                  disabled={isExporting === 'api-map'}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isExporting === 'api-map' ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
            <div ref={apiMapCanvasRef} className="h-[600px]">
              <ReactFlowProvider>
                <SystemArchitectureEditor
                  type={"apiMap"}
                  architecture={diagrams.apiMap}
                  onArchitectureChange={(updated) => handleDiagramChange('apiMap', updated)}
                  onSave={() => handleSaveDiagram('apiMap')}
                />
              </ReactFlowProvider>
            </div>
          </div>
        )}

        {/* Bottom Row - Insights & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-blue-900">Quick Actions</h3>
            </div>
            <div className="space-y-2.5">
              <Button
                onClick={() => console.log('Add component')}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Add Component</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                onClick={handleGenerateAllDiagrams}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Regenerate All</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                onClick={() => {
                  const allDiagrams = JSON.stringify(diagrams, null, 2)
                  navigator.clipboard.writeText(allDiagrams)
                  alert('All diagrams copied to clipboard!')
                }}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Share All Diagrams</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Design Quality Score */}
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Design Quality</h3>
              <Badge variant="default" className="bg-blue-600 text-xs h-6 px-2.5">Live</Badge>
            </div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {insights && insights.hasControllers && insights.hasServices && insights.hasRepositories ? '92' :
                  insights && ((insights.hasControllers && insights.hasServices) || (insights.hasServices && insights.hasRepositories)) ? '78' :
                    insights && (insights.hasControllers || insights.hasServices || insights.hasRepositories) ? '65' : '50'}
              </div>
              <div className="text-xs text-[#605A57]">Out of 100</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Code Structure</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {insights && insights.hasControllers && insights.hasServices ? '95%' : '70%'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: insights && insights.hasControllers && insights.hasServices ? '95%' : '70%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Modularity</span>
                  <span className="font-semibold text-[#1d1d1f]">{insights?.hasRepositories ? '88%' : '65%'}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: insights?.hasRepositories ? '88%' : '65%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Testability</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {insights && insights.hasMiddleware ? '90%' : '72%'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: insights && insights.hasMiddleware ? '90%' : '72%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Layer Distribution */}
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Layer Distribution</h3>
            <div className="space-y-2.5">
              {Object.entries(insights?.layerDistribution || {}).map(([layer, count]: [string, any]) => (
                <div key={layer} className="flex items-center justify-between p-2.5 hover:bg-blue-50 rounded-md transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-[#605A57]">{layer}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Design Patterns */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-semibold text-purple-900">Design Patterns</h3>
            </div>
            <div className="space-y-2">
              {insights?.hasRepositories && (
                <div className="flex items-center gap-2 text-xs text-purple-800">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>Repository Pattern</span>
                </div>
              )}
              {insights?.hasServices && (
                <div className="flex items-center gap-2 text-xs text-purple-800">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>Service Layer</span>
                </div>
              )}
              {insights?.hasControllers && (
                <div className="flex items-center gap-2 text-xs text-purple-800">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>MVC Pattern</span>
                </div>
              )}
              {insights?.hasMiddleware && (
                <div className="flex items-center gap-2 text-xs text-purple-800">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                  <span>Middleware Chain</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-purple-800">
                <CheckCircle className="w-3 h-3 text-purple-600" />
                <span>Dependency Injection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg shadow-lg p-4 max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Unsaved changes detected</p>
              <p className="text-xs text-yellow-700 mt-0.5">Your diagrams have been modified</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                Object.keys(diagrams).forEach((key) => {
                  handleSaveDiagram(key as keyof DiagramData)
                })
              }}
              className="h-8 bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800 font-medium text-xs flex-shrink-0"
            >
              <Save className="w-3 h-3 mr-1" />
              Save All
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[rgba(55,50,47,0.08)] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to HLD
          </button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl transition-all hover:scale-105 text-base font-semibold"
          >
            Continue to Next Step
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-24"></div>
    </div>
  )
}