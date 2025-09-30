"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Zap, Globe, Shield, Users, FileText, Play, Code, Copy, ChevronDown, ChevronRight, Search, Upload, Heart, MessageCircle, Hash, Bell } from "lucide-react"

interface StepThreeProps {
  data: any
  onComplete: () => void
  onBack: () => void
}

export function StepThree({ data, onComplete, onBack }: StepThreeProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Authentication']))
  const [testData, setTestData] = useState<any>({})
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    }
    return colors[method] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  const getGroupIcon = (groupName: string) => {
    const icons: Record<string, any> = {
      Authentication: Shield,
      Users: Users,
      Posts: FileText,
      Categories: Globe,
      Comments: MessageCircle,
      Tags: Hash,
      Media: Upload,
      Social: Heart,
      Notifications: Bell,
      Search: Search,
    }
    const Icon = icons[groupName] || Globe
    return <Icon className="h-4 w-4 text-primary" />
  }

  const totalEndpoints = data.endpoints.reduce((acc: number, group: any) => acc + group.endpoints.length, 0)

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const selectEndpoint = (group: any, endpoint: any) => {
    setSelectedEndpoint({ ...endpoint, group: group.group })
    setTestData({})
    setResponse(null)
  }

  const simulateApiCall = async () => {
    setLoading(true)
    setResponse(null)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock response based on endpoint
    const mockResponse = generateMockResponse(selectedEndpoint)
    setResponse(mockResponse)
    setLoading(false)
  }

  const generateMockResponse = (endpoint: any) => {
    const { method, path } = endpoint
    
    if (method === 'GET') {
      if (path.includes('/users')) {
        return {
          status: 200,
          data: {
            id: 'user-123',
            email: 'john@example.com',
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe',
            created_at: '2024-01-15T10:30:00Z'
          }
        }
      }
      if (path.includes('/posts')) {
        return {
          status: 200,
          data: [
            {
              id: 'post-456',
              title: 'Getting Started with React',
              content: 'React is a powerful library...',
              author: 'John Doe',
              created_at: '2024-01-15T14:30:00Z'
            }
          ],
          meta: { page: 1, limit: 20, total: 1 }
        }
      }
    }
    
    if (method === 'POST') {
      return {
        status: 201,
        data: {
          id: 'new-resource-789',
          message: 'Resource created successfully',
          created_at: new Date().toISOString()
        }
      }
    }
    
    if (method === 'PUT') {
      return {
        status: 200,
        data: {
          message: 'Resource updated successfully',
          updated_at: new Date().toISOString()
        }
      }
    }
    
    if (method === 'DELETE') {
      return {
        status: 204,
        message: 'Resource deleted successfully'
      }
    }
    
    return {
      status: 200,
      data: { message: 'Success' }
    }
  }

  const filteredEndpoints = data.endpoints.map((group: any) => ({
    ...group,
    endpoints: group.endpoints.filter((endpoint: any) => 
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.group.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((group: any) => group.endpoints.length > 0)

  // Auto-select default endpoint on component mount
  useEffect(() => {
    if (!selectedEndpoint && data.endpoints.length > 0) {
      // Find the login endpoint as default (most common first interaction)
      const authGroup = data.endpoints.find((group: any) => group.group === 'Authentication')
      if (authGroup && authGroup.endpoints.length > 0) {
        const loginEndpoint = authGroup.endpoints.find((ep: any) => ep.path === '/auth/login') || authGroup.endpoints[0]
        selectEndpoint(authGroup, loginEndpoint)
      } else {
        // Fallback to first available endpoint
        const firstGroup = data.endpoints[0]
        if (firstGroup && firstGroup.endpoints.length > 0) {
          selectEndpoint(firstGroup, firstGroup.endpoints[0])
        }
      }
    }
  }, [data.endpoints, selectedEndpoint])

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-6 space-y-4">
      {/* Header */}
      <div className="text-left space-y-2">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Interactive API Explorer</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Test and explore your {totalEndpoints} auto-generated API endpoints. Complete CRUD operations, authentication, file uploads, and custom business logic.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-foreground">{totalEndpoints}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Endpoints</div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-foreground">{data.endpoints.length}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">API Groups</div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-foreground">REST</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">API Standard</div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-foreground">JSON</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Response Format</div>
        </Card>
      </div>

      {/* Main Explorer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar - Endpoint List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEndpoints.map((group: any, groupIndex: number) => (
              <div key={groupIndex} className="border rounded-lg">
                <div 
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                  onClick={() => toggleGroup(group.group)}
                >
                  <div className="flex items-center space-x-2">
                    {expandedGroups.has(group.group) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    {getGroupIcon(group.group)}
                    <span className="font-medium text-sm">{group.group}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{group.endpoints.length}</Badge>
                </div>
                
                {expandedGroups.has(group.group) && (
                  <div className="border-t">
                    {group.endpoints.map((endpoint: any, endpointIndex: number) => (
                      <div
                        key={endpointIndex}
                        className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                          selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => selectEndpoint(group, endpoint)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className={`text-xs font-mono ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-xs font-mono">{endpoint.path}</code>
                          </div>
                          <div className="text-xs text-muted-foreground">{endpoint.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - API Tester */}
        <div className="lg:col-span-8">
          {selectedEndpoint ? (
            <Card className="p-4 h-full">
              <div className="space-y-4">
                {/* Endpoint Header */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className={`font-mono ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method}
                    </Badge>
                    <code className="text-base font-mono font-semibold">{selectedEndpoint.path}</code>
                  </div>
                  <p className="text-muted-foreground">{selectedEndpoint.description}</p>
                  <Badge variant="outline">{selectedEndpoint.group}</Badge>
                </div>

                {/* Request Configuration */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Test This Endpoint</h3>
                  
                  {/* URL Parameters */}
                  {selectedEndpoint.params && (
                    <div className="space-y-2">
                      <h4 className="font-medium">URL Parameters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(selectedEndpoint.params).map(([key, type]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-sm font-medium">{key}</label>
                            <Input 
                              placeholder={`${type as string}`}
                              onChange={(e) => setTestData({...testData, [key]: e.target.value})}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {selectedEndpoint.body && selectedEndpoint.method !== 'GET' && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Request Body</h4>
                      {selectedEndpoint.body === 'multipart/form-data' ? (
                        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">File upload endpoint</p>
                          <p className="text-xs text-muted-foreground">Drag and drop files or click to browse</p>
                        </div>
                      ) : (
                        <Textarea 
                          placeholder={JSON.stringify(selectedEndpoint.body, null, 2)}
                          className="font-mono text-sm"
                          rows={8}
                          onChange={(e) => setTestData({...testData, body: e.target.value})}
                        />
                      )}
                    </div>
                  )}

                  {/* Test Button */}
                  <Button 
                    onClick={simulateApiCall} 
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test API Call
                      </>
                    )}
                  </Button>
                </div>

                {/* Response */}
                {response && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Response</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={response.status < 300 ? 'default' : 'destructive'}>
                          {response.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                      <code>{JSON.stringify(response, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center h-full flex items-center justify-center">
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Select an API Endpoint</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose an endpoint from the left sidebar to test it with our interactive API explorer.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-left">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">✓ CRUD Operations</h4>
                    <p className="text-muted-foreground">Complete Create, Read, Update, Delete for all tables</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600">✓ Authentication</h4>
                    <p className="text-muted-foreground">Login, register, logout, password reset</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-600">✓ File Uploads</h4>
                    <p className="text-muted-foreground">Avatar, post images, general media</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-600">✓ Business Logic</h4>
                    <p className="text-muted-foreground">Social features, notifications, search</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onComplete} size="lg" className="px-8">
          Deploy Backend
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
