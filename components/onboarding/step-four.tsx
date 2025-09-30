"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, ArrowLeft, Network, Lightbulb, Download, Upload, Palette, Eye, BarChart, Zap, Shield, Save, CheckCircle } from "lucide-react"
import { ReactFlowProvider } from '@xyflow/react'

import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { SystemArchitecture, DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'
import { generateArchitectureFromData } from '@/lib/utils/architecture'

interface StepFourProps {
  data: {
    projectName?: string
    description?: string
    schemas?: any[]
    analysis?: any
    endpoints?: any[]
  }
  onComplete: () => void
  onBack: () => void
}

export function StepFour({ data, onComplete, onBack }: StepFourProps) {
  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [activeTab, setActiveTab] = useState("architecture")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Generate architecture from Step 2 and Step 3 data
  useEffect(() => {
    const generateArchitecture = async () => {
      setIsGenerating(true)
      
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      try {
        const schemaData: DatabaseSchemaToArchitecture = {
          schemas: data.schemas || [],
          analysis: data.analysis || {}
        }
        
        const apiData: ApiEndpointsToArchitecture = {
          endpoints: data.endpoints || [],
          groups: [...new Set((data.endpoints || []).map((group: any) => group.group))]
        }
        
        const generatedArchitecture = generateArchitectureFromData(
          schemaData,
          apiData,
          data.projectName || 'Project'
        )
        
        setArchitecture(generatedArchitecture)
      } catch (error) {
        console.error('Error generating architecture:', error)
        // Fallback empty architecture
        setArchitecture({
          id: `arch-${Date.now()}`,
          name: `${data.projectName || 'Project'} Architecture`,
          description: 'Generated system architecture',
          nodes: [],
          edges: [],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0'
          }
        })
      } finally {
        setIsGenerating(false)
      }
    }
    
    generateArchitecture()
  }, [data])

  const handleArchitectureChange = (updatedArchitecture: SystemArchitecture) => {
    setArchitecture(updatedArchitecture)
    setHasUnsavedChanges(true)
  }

  const handleSaveArchitecture = () => {
    // Here you would typically save to your backend/database
    console.log('Saving architecture:', architecture)
    setHasUnsavedChanges(false)
    // You could integrate with your app context here
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

  if (isGenerating) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Network className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Generating Your System Architecture</h2>
            <p className="text-muted-foreground">
              Analyzing your database schema and API endpoints to create an intelligent system architecture...
            </p>
          </div>
          <div className="flex justify-center space-x-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Database Analysis
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              API Mapping
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Architecture Generation
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!architecture) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Error Generating Architecture</h2>
          <p className="text-muted-foreground">
            There was an issue generating your system architecture. Please try again.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-6 space-y-4">
      {/* Header */}
      <div className="text-left space-y-2">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Interactive System Architecture</h1>
        <p className="text-sm text-muted-foreground">
          Your complete system architecture generated from your database schema and API endpoints. 
          Click and drag components, add new ones, and customize your architecture.
        </p>
      </div>

      {/* Stats and Insights */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <Card className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{insights.componentsCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Components</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{insights.connectionsCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Connections</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <div className={`text-xl sm:text-2xl font-bold ${
              insights.complexity === 'Simple' ? 'text-green-600' : 
              insights.complexity === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {insights.complexity}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Complexity</div>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{insights.externalServices}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">External Services</div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="architecture" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Architecture Editor
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2 hidden lg:flex">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="h-[600px]">
              <ReactFlowProvider>
                <SystemArchitectureEditor
                  architecture={architecture}
                  onArchitectureChange={handleArchitectureChange}
                  onSave={handleSaveArchitecture}
                />
              </ReactFlowProvider>
            </div>
            {hasUnsavedChanges && (
              <div className="p-3 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2 text-sm text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                You have unsaved changes
                <Button variant="outline" size="sm" onClick={handleSaveArchitecture} className="ml-auto">
                  <Save className="w-3 h-3 mr-1" />
                  Save Changes
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Architecture Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Complexity Level</span>
                  <Badge variant={
                    insights?.complexity === 'Simple' ? 'secondary' : 
                    insights?.complexity === 'Moderate' ? 'default' : 'destructive'
                  }>
                    {insights?.complexity}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Has Authentication</span>
                  <div className="flex items-center gap-1">
                    {insights?.hasAuth ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">{insights?.hasAuth ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Has Caching</span>
                  <div className="flex items-center gap-1">
                    {insights?.hasCache ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">{insights?.hasCache ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Load Balancing</span>
                  <div className="flex items-center gap-1">
                    {insights?.hasLoadBalancer ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm">{insights?.hasLoadBalancer ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Insights
              </h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Scalability Score</span>
                    <span className="font-semibold">
                      {insights && insights.hasCache && insights.hasLoadBalancer ? '95%' : 
                       insights && (insights.hasCache || insights.hasLoadBalancer) ? '75%' : '60%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: insights && insights.hasCache && insights.hasLoadBalancer ? '95%' : 
                               insights && (insights.hasCache || insights.hasLoadBalancer) ? '75%' : '60%'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Security Score</span>
                    <span className="font-semibold">{insights?.hasAuth ? '90%' : '40%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${insights?.hasAuth ? 'bg-green-600' : 'bg-yellow-500'}`}
                      style={{ width: insights?.hasAuth ? '90%' : '40%' }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  Based on your current architecture components and connections.
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Architecture Recommendations
              </h3>
              <div className="space-y-3">
                {!insights?.hasCache && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Add Caching Layer</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Consider adding Redis or Memcached to improve response times and reduce database load.
                      </p>
                    </div>
                  </div>
                )}
                
                {!insights?.hasLoadBalancer && (insights?.componentsCount || 0) > 3 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Network className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Load Balancer Recommended</h4>
                      <p className="text-sm text-green-800 mt-1">
                        With multiple services, a load balancer can distribute traffic and improve reliability.
                      </p>
                    </div>
                  </div>
                )}
                
                {!insights?.hasAuth && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Authentication Service</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Add a dedicated authentication service to secure your API endpoints.
                      </p>
                    </div>
                  </div>
                )}

                {(insights?.externalServices || 0) === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Upload className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">Consider External Services</h4>
                      <p className="text-sm text-purple-800 mt-1">
                        File storage (S3), email services (SendGrid), or payment processing (Stripe) can enhance functionality.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => onComplete(architecture)} size="lg" className="px-8">
          Continue to Tool Selection
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}