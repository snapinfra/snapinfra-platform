"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, Network, Download, Eye, BarChart, Zap, Shield, Save, CheckCircle, Activity, AlertTriangle, Cloud, Code2, Clock, Globe, GitBranch, ChevronRight, TrendingUp, Layers } from "lucide-react"
import { ReactFlowProvider } from '@xyflow/react'

import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { SystemArchitecture } from '@/lib/types/architecture'
import { useDecisions, useOnboardingData } from "@/lib/appContext/app-context"
import { SystemDecisionsSummary } from "@/lib/types/system-decisions"

interface StepFourProps {
  data: {
    projectName?: string
    description?: string
    schemas?: any[]
    analysis?: any
    endpoints?: any[]
    architecture?: SystemArchitecture  // Pre-generated from step-one
    hldMetadata?: any
  }
  onComplete: () => void
  onBack: () => void
}

export function StepFour({ data, onComplete, onBack }: StepFourProps) {
  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(data.architecture || null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const architectureCanvasRef = useRef<HTMLDivElement>(null)
  const { updateData } = useOnboardingData();
  const { setDecisions, updateDecision, loadDecisions } = useDecisions()

  // If no architecture was provided, show error
  useEffect(() => {
    if (!data.architecture) {
      console.error('No architecture data found. It should have been generated in step-one.')
    }
  }, [data.architecture])


  const generateDecisions = async (architectureToUse?: SystemArchitecture) => {
    // Use passed architecture or fall back to data.architecture
    const archData = architectureToUse || data.architecture;

    // Check if decisions are already cached in localStorage
    const cachedData = loadDecisions()
    console.log('Checking for cached decisions in localStorage:', cachedData)

    // Fixed: Check if cachedData is null/undefined BEFORE accessing properties
    if (cachedData && cachedData.decisions && cachedData.selectedTools) {
      try {
        console.log('✅ Using cached decisions:', cachedData)
        setDecisions(cachedData.decisions, cachedData.selectedTools)
        return
      } catch (error) {
        console.warn('Failed to use cached decisions:', error)
        localStorage.removeItem('onboarding-decisions')
      }
    } else {
      // Clear invalid cache
      localStorage.removeItem('onboarding-decisions')
    }

    try {
      if (!archData) {
        throw new Error('Architecture data is required to generate system decisions')
      }

      // Make real HTTP request to AI-powered API endpoint
      const response = await fetch('/api/generate-system-decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          architecture: archData,
          projectData: {
            projectName: data.projectName,
            description: data.description,
            schemas: data.schemas,
            endpoints: data.endpoints,
            analysis: data.analysis,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate system decisions')
      }

      const decisionsSummary: SystemDecisionsSummary = await response.json()

      // Strict validation - no fallback to mock data
      if (!decisionsSummary.decisions || decisionsSummary.decisions.length === 0) {
        throw new Error('AI did not generate any system decisions')
      }

      // Initialize selected tools with recommendations
      const initialSelections: Record<string, string> = {}
      decisionsSummary.decisions.forEach(decision => {
        initialSelections[decision.id] = decision.selectedTool
      })

      // Save to both localStorage and context using the hook
      console.log('💾 Saving decisions to localStorage and context')
      setDecisions(decisionsSummary, initialSelections)
    } catch (error) {
      console.error('Failed to generate system decisions:', error)
      alert(
        `Failed to generate system decisions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      )
    }
  }

  const handleArchitectureChange = (updatedArchitecture: SystemArchitecture) => {
    setArchitecture(updatedArchitecture)
    setHasUnsavedChanges(true)
  }

  const handleSaveArchitecture = () => {
    console.log('Saving architecture:', architecture)
    setHasUnsavedChanges(false)
  }

  const handleContinue = async () => {
    console.log('reached in onboarding decisions')
    if (!architecture) return
    console.log('reached in onboarding decisions')
    console.log(architecture, 'this is architecture')

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

      await generateDecisions(cleanArchitecture);

      // Call onComplete with absolutely no arguments
      onComplete()
    } catch (error) {
      console.error('Error saving architecture:', error)
      alert('Failed to save architecture. Please try again.')
    }
  }

  const handleExportPNG = async () => {
    if (!architectureCanvasRef.current) {
      alert('Canvas not found. Please try again.')
      return
    }

    setIsExporting(true)

    try {
      const { toPng } = await import('html-to-image')
      await new Promise(resolve => setTimeout(resolve, 100))

      const reactFlowWrapper = architectureCanvasRef.current.querySelector('.react-flow') as HTMLElement
      const exportElement = reactFlowWrapper || architectureCanvasRef.current

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
      const projectName = architecture?.name?.replace(/\s+/g, '-').toLowerCase() || 'architecture'
      link.download = `${projectName}-diagram.png`
      link.href = dataUrl
      link.click()

      console.log('Diagram exported successfully as PNG')
    } catch (error) {
      console.error('Error exporting PNG:', error)
      alert('Failed to export diagram. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getArchitectureInsights = () => {
    if (!architecture) return null

    const insights = {
      complexity: architecture.nodes.length <= 3 ? 'Simple' :
        architecture.nodes.length <= 6 ? 'Moderate' : 'Complex',
      componentsCount: architecture.nodes.length,
      connectionsCount: architecture.edges.length,
      hasAuth: architecture.nodes.some(n => n.type === 'authentication'),
      hasCache: architecture.nodes.some(n => n.type === 'cache'),
      hasLoadBalancer: architecture.nodes.some(n => n.type === 'load-balancer'),
      externalServices: architecture.nodes.filter(n => n.type === 'external-service').length
    }

    return insights
  }

  const insights = getArchitectureInsights()

  if (!architecture) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
        <div className="text-center space-y-4 max-w-[900px] mx-auto">
          <div className="p-4 bg-red-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1d1d1f]">No Architecture Data Found</h2>
          <p className="text-sm text-[#605A57]">
            The architecture should have been generated in the previous steps. Please go back and try again.
          </p>
          <Button onClick={onBack} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-[900px] mx-auto mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#005BE3]/10 text-[#005BE3] text-xs font-medium mb-2">
          <Network className="w-3 h-3" />
          System Architecture
        </div>
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Interactive System Architecture
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm text-[#605A57]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#005BE3] animate-pulse"></div>
            <span>{insights?.componentsCount || 0} components</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#005BE3] animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <span>{insights?.connectionsCount || 0} connections</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#005BE3] animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <span>{insights?.complexity} complexity</span>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#005BE3]/20 to-transparent"></div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] rounded-lg p-4 transition-all duration-300 hover:border-[#1d1d1f]/20 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="w-8 h-8 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Components</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.componentsCount || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Active</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] rounded-lg p-4 transition-all duration-300 hover:border-[#1d1d1f]/20 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <GitBranch className="w-8 h-8 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Connections</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.connectionsCount || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Activity className="w-2.5 h-2.5" />
              <span>Optimized</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] rounded-lg p-4 transition-all duration-300 hover:border-[#1d1d1f]/20 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart className="w-8 h-8 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Complexity</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">
              {insights?.complexity || 'N/A'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Shield className="w-2.5 h-2.5" />
              <span>Analyzed</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] rounded-lg p-4 transition-all duration-300 hover:border-[#1d1d1f]/20 hover:shadow-md">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cloud className="w-8 h-8 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">External</div>
            <div className="text-2xl font-bold text-[#1d1d1f]">{insights?.externalServices || 0}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-[#605A57]">
              <Globe className="w-2.5 h-2.5" />
              <span>Integrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Architecture Canvas */}
      <div className="space-y-6">
        <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#fafafa] to-white border-b border-[rgba(55,50,47,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#005BE3]/10 rounded-md">
                <Network className="w-4 h-4 text-[#005BE3]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Architecture Canvas</h3>
                <p className="text-xs text-[#605A57]">Drag, drop, and connect components</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-[#005BE3]/5">
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-3 hover:bg-[#005BE3]/5"
                onClick={handleExportPNG}
                disabled={isExporting}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {isExporting ? 'Exporting...' : 'Export Diagram'}
              </Button>
            </div>
          </div>
          <div ref={architectureCanvasRef} className="h-[600px]">
            <ReactFlowProvider>
              <SystemArchitectureEditor
                type={"hld"}
                architecture={architecture}
                onArchitectureChange={handleArchitectureChange}
                onSave={handleSaveArchitecture}
              />
            </ReactFlowProvider>
          </div>
          {hasUnsavedChanges && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-t border-yellow-200 flex items-center gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 flex-1">
                <Clock className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                <span className="text-yellow-800 font-medium">Unsaved changes detected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveArchitecture}
                className="h-7 bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800 font-medium text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Architecture
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Row - Insights & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#e8f4ff] to-[#d4e9ff] rounded-lg p-5 border border-[#005BE3]/20">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#005BE3]" />
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Quick Actions</h3>
            </div>
            <div className="space-y-2.5">
              <Button
                onClick={() => console.log('Add component clicked')}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Add Component</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#005BE3] group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                onClick={handleSaveArchitecture}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Auto-Optimize</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#005BE3] group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                onClick={() => {
                  try {
                    // Create a clean copy without circular references
                    const cleanArchitecture = {
                      name: architecture.name,
                      description: architecture.description,
                      nodes: architecture.nodes.map(node => ({
                        id: node.id,
                        type: node.type,
                        position: node.position,
                        data: node.data
                      })),
                      edges: architecture.edges.map(edge => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: edge.label
                      }))
                    }
                    const architectureJson = JSON.stringify(cleanArchitecture, null, 2)
                    navigator.clipboard.writeText(architectureJson)
                    alert('Architecture diagram copied to clipboard!')
                  } catch (error) {
                    console.error('Error copying architecture:', error)
                    alert('Failed to copy diagram. Please try again.')
                  }
                }}
                variant="ghost"
                className="w-full justify-between px-4 py-2.5 bg-white/60 hover:bg-white hover:shadow-sm rounded-md transition-all text-[#1d1d1f] text-sm font-medium group h-auto"
              >
                <span>Share Diagram</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#005BE3] group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Architecture Score */}
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">Architecture Score</h3>
              <Badge variant="default" className="bg-[#005BE3] text-xs h-6 px-2.5">Live</Badge>
            </div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-[#005BE3] mb-1">
                {insights && insights.hasCache && insights.hasLoadBalancer && insights.hasAuth ? '95' :
                  insights && ((insights.hasCache && insights.hasAuth) || (insights.hasLoadBalancer && insights.hasAuth)) ? '82' :
                    insights && (insights.hasCache || insights.hasLoadBalancer || insights.hasAuth) ? '65' : '48'}
              </div>
              <div className="text-xs text-[#605A57]">Out of 100</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Scalability</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {insights && insights.hasCache && insights.hasLoadBalancer ? '95%' :
                      insights && (insights.hasCache || insights.hasLoadBalancer) ? '75%' : '60%'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#005BE3] to-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: insights && insights.hasCache && insights.hasLoadBalancer ? '95%' :
                        insights && (insights.hasCache || insights.hasLoadBalancer) ? '75%' : '60%'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Security</span>
                  <span className="font-semibold text-[#1d1d1f]">{insights?.hasAuth ? '90%' : '40%'}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#005BE3] to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: insights?.hasAuth ? '90%' : '40%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#605A57]">Performance</span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {insights && insights.hasCache ? '88%' : '62%'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#005BE3] to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: insights && insights.hasCache ? '88%' : '62%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Component Status */}
          <div className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Component Status</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-[#005BE3]/5 rounded-md">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#005BE3]" />
                  <span className="text-xs text-[#605A57]">Authentication</span>
                </div>
                {insights?.hasAuth ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-2.5 hover:bg-[#005BE3]/5 rounded-md transition-colors">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-[#605A57]">Caching</span>
                </div>
                {insights?.hasCache ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-2.5 hover:bg-[#005BE3]/5 rounded-md transition-colors">
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-[#605A57]">Load Balancer</span>
                </div>
                {insights?.hasLoadBalancer ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Tech Stack Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-blue-900">Generated Stack</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <span>PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <span>Node.js + Express</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <span>Redis Cache</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <span>Docker + AWS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[rgba(55,50,47,0.08)] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all hover:scale-105 text-base font-semibold"
          >
            Select Infrastructure Tools
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-24"></div>
    </div>
  )
}
