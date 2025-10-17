"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/app-context"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Server, 
  Database, 
  Cloud, 
  Shield, 
  Zap, 
  Globe, 
  Container,
  Network,
  Settings,
  Download,
  Eye,
  Edit3,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"

const architectureComponents = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'gateway',
    icon: Globe,
    status: 'active',
    description: 'Centralized entry point for all client requests',
    connections: ['load-balancer', 'auth-service'],
    position: { x: 100, y: 100 }
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    type: 'infrastructure',
    icon: Network,
    status: 'active',
    description: 'Distributes incoming requests across multiple instances',
    connections: ['app-servers'],
    position: { x: 300, y: 100 }
  },
  {
    id: 'auth-service',
    name: 'Authentication Service',
    type: 'service',
    icon: Shield,
    status: 'active',
    description: 'Handles user authentication and authorization',
    connections: ['user-db', 'redis-cache'],
    position: { x: 100, y: 250 }
  },
  {
    id: 'app-servers',
    name: 'Application Servers',
    type: 'compute',
    icon: Server,
    status: 'active',
    description: 'Main application logic and business rules',
    connections: ['primary-db', 'redis-cache'],
    position: { x: 500, y: 150 }
  },
  {
    id: 'primary-db',
    name: 'Primary Database',
    type: 'database',
    icon: Database,
    status: 'active',
    description: 'PostgreSQL main database',
    connections: [],
    position: { x: 700, y: 250 }
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    type: 'cache',
    icon: Zap,
    status: 'active',
    description: 'In-memory cache for improved performance',
    connections: [],
    position: { x: 300, y: 350 }
  }
]

export default function ArchitecturePage() {
  const { state } = useAppContext()
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [viewMode, setViewMode] = useState('diagram')
  const [selectedEnvironment, setSelectedEnvironment] = useState('production')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gateway': return Globe
      case 'infrastructure': return Network
      case 'service': return Shield
      case 'compute': return Server
      case 'database': return Database
      case 'cache': return Zap
      default: return Container
    }
  }

  return (
    <EnterpriseDashboardLayout
      title="System Architecture"
      description="Visualize and manage your system components"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Architecture" },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Architecture
          </Button>
        </div>
      }
    >
      <div className="space-y-8">

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Components</p>
                  <p className="text-2xl font-bold text-gray-900">{architectureComponents.length}</p>
                </div>
                <Container className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-green-600">
                    {architectureComponents.filter(c => c.status === 'active').length}
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
                  <p className="text-sm font-medium text-gray-600">Health Score</p>
                  <p className="text-2xl font-bold text-green-600">98%</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">2 hours ago</p>
                </div>
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
          <TabsList>
            <TabsTrigger value="diagram" className="gap-2">
              <Eye className="w-4 h-4" />
              Architecture Diagram
            </TabsTrigger>
            <TabsTrigger value="components" className="gap-2">
              <Container className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="gap-2">
              <Network className="w-4 h-4" />
              Dependencies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="space-y-6">
            {/* Architecture Diagram */}
            <Card>
              <CardHeader>
                <CardTitle>System Architecture Diagram</CardTitle>
                <CardDescription>
                  Interactive view of your system components and their relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[500px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Container className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Architecture Diagram</h3>
                      <p className="text-gray-500 mb-6 max-w-md">
                        This would contain an interactive diagram showing your system components, 
                        their connections, and real-time status indicators.
                      </p>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          The diagram would be built using a library like React Flow or D3.js to create 
                          interactive nodes representing each component with drag-and-drop capabilities.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-6">
            {/* Components List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {architectureComponents.map((component) => {
                const IconComponent = component.icon
                return (
                  <Card key={component.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{component.name}</CardTitle>
                            <Badge className={`mt-1 text-xs ${getStatusColor(component.status)}`}>
                              {component.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{component.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium capitalize">{component.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Connections:</span>
                          <span className="font-medium">{component.connections.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-6">
            {/* Dependencies View */}
            <Card>
              <CardHeader>
                <CardTitle>Component Dependencies</CardTitle>
                <CardDescription>
                  View and manage dependencies between system components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {architectureComponents.map((component) => (
                    <div key={component.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <component.icon className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{component.name}</span>
                          <Badge className={`text-xs ${getStatusColor(component.status)}`}>
                            {component.status}
                          </Badge>
                        </div>
                      </div>
                      {component.connections.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Depends on:</p>
                          <div className="flex flex-wrap gap-2">
                            {component.connections.map((connectionId) => {
                              const connectedComponent = architectureComponents.find(c => c.id === connectionId)
                              return connectedComponent ? (
                                <div key={connectionId} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full text-sm">
                                  <connectedComponent.icon className="w-3 h-3" />
                                  {connectedComponent.name}
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                </div>
                              ) : (
                                <span key={connectionId} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                                  {connectionId} (missing)
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No dependencies</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common architecture management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Plus className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Add Component</div>
                  <div className="text-sm text-gray-500">Add new service or infrastructure</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Configure Scaling</div>
                  <div className="text-sm text-gray-500">Set up auto-scaling rules</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Security Review</div>
                  <div className="text-sm text-gray-500">Analyze security configuration</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnterpriseDashboardLayout>
  )
}