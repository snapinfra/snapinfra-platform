"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext } from "@/lib/app-context"
import { getProjectById } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Cloud, 
  Server, 
  Globe, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Rocket,
  Database,
  Shield,
  Monitor,
  Zap,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Edit3
} from "lucide-react"

const cloudProviders = [
  { 
    id: 'aws', 
    name: 'Amazon Web Services', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'] 
  },
  { 
    id: 'vercel', 
    name: 'Vercel', 
    logo: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
    regions: ['global'] 
  },
  { 
    id: 'railway', 
    name: 'Railway', 
    logo: 'https://railway.app/brand/logo-light.png',
    regions: ['us-west1', 'us-east1', 'eu-west1'] 
  },
  { 
    id: 'render', 
    name: 'Render', 
    logo: 'https://www.vectorlogo.zone/logos/rendercom/rendercom-ar21.svg',
    regions: ['oregon', 'ohio', 'frankfurt', 'singapore'] 
  },
  { 
    id: 'gcp', 
    name: 'Google Cloud', 
    logo: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-ar21.svg',
    regions: ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1'] 
  },
  { 
    id: 'azure', 
    name: 'Microsoft Azure', 
    logo: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-ar21.svg',
    regions: ['eastus', 'westus2', 'westeurope', 'southeastasia'] 
  },
  { 
    id: 'digitalocean', 
    name: 'DigitalOcean', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/DigitalOcean_logo.svg',
    regions: ['nyc1', 'sfo3', 'lon1', 'sgp1'] 
  },
  { 
    id: 'heroku', 
    name: 'Heroku', 
    logo: 'https://www.vectorlogo.zone/logos/heroku/heroku-ar21.svg',
    regions: ['us', 'eu'] 
  }
]

export default function DeploymentsPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [selectedProvider, setSelectedProvider] = useState('aws')
  const [deploymentProgress, setDeploymentProgress] = useState(45)
  const [deployments, setDeployments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load project and deployments
  useEffect(() => {
    if (!projectId) return
    
    async function loadData() {
      try {
        setLoading(true)
        
        // Load project if not in context
        if (!state.currentProject || state.currentProject.id !== projectId) {
          const project = await getProjectById(projectId)
          const normalizedProject = {
            ...project,
            schema: Array.isArray(project.schema)
              ? project.schema
              : (project.schema?.tables || [])
          }
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: normalizedProject })
        }
        
        // Fetch deployments from AWS (if you have a deployments API)
        // For now, check if project has been deployed
        const project = state.currentProject || await getProjectById(projectId)
        
        if (project.status === 'deployed' && project.deploymentUrl) {
          // Project has been deployed, show it
          setDeployments([{
            id: `deploy-${projectId}`,
            name: 'Production',
            environment: 'production',
            status: 'active',
            provider: 'vercel', // You might want to store this in the project
            region: 'global',
            url: project.deploymentUrl,
            lastDeploy: project.lastDeployedAt ? new Date(project.lastDeployedAt).toLocaleDateString() : 'Recently',
            version: 'v1.0.0',
            health: 99.9,
            requests: 'N/A',
            responseTime: 'N/A'
          }])
        } else {
          setDeployments([])
        }
      } catch (error) {
        console.error('Failed to load deployment data:', error)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [projectId, state.currentProject, dispatch, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'deploying': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProviderLogo = (provider: string) => {
    const p = cloudProviders.find(cp => cp.id === provider)
    return p?.logo || 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg'
  }

  return (
    <EnterpriseDashboardLayout
      title="Deployments"
      description="Manage your application deployments across cloud providers"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/projects" },
        { label: state.currentProject?.name || "Project", href: `/projects/${projectId}` },
        { label: "Deployments" },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
          <Button className="gap-2">
            <Rocket className="w-4 h-4" />
            New Deployment
          </Button>
        </div>
      }
    >
      <div className="space-y-8">

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-green-600">{deployments.filter(d => d.status === 'active').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Project Status</p>
                  <p className="text-2xl font-bold text-blue-600 capitalize">{state.currentProject?.status || 'draft'}</p>
                </div>
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deployments</p>
                  <p className="text-2xl font-bold text-purple-600">{deployments.length}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Deployed</p>
                  <p className="text-sm font-bold text-green-600">
                    {state.currentProject?.lastDeployedAt 
                      ? new Date(state.currentProject.lastDeployedAt).toLocaleDateString() 
                      : 'Never'
                    }
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deployments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="deployments" className="gap-2">
              <Server className="w-4 h-4" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2">
              <Cloud className="w-4 h-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deployments" className="space-y-6">
            {loading && (
              <div className="text-center py-12">
                <Activity className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading deployments...</p>
              </div>
            )}
            
            {!loading && deployments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deployments Yet</h3>
                  <p className="text-gray-500 mb-6">Deploy your project to see it listed here</p>
                  <Button className="gap-2">
                    <Rocket className="w-4 h-4" />
                    Deploy Now
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Current Deployment Progress */}
            {!loading && deployments.some(d => d.status === 'deploying') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-pulse text-blue-600" />
                    Deployment in Progress
                  </CardTitle>
                  <CardDescription>Development environment is currently being deployed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deploying v1.2.5-alpha to GCP...</span>
                    <span className="text-sm text-gray-500">{deploymentProgress}%</span>
                  </div>
                  <Progress value={deploymentProgress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    Step 3 of 5: Building Docker image and pushing to registry
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Deployments Grid */}
            {!loading && deployments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {deployments.map((deployment) => (
                <Card key={deployment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{deployment.name}</h3>
                        <Badge className={`text-xs ${getStatusColor(deployment.status)}`}>
                          {deployment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Provider</p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center bg-white rounded overflow-hidden">
                            <img 
                              src={getProviderLogo(deployment.provider)} 
                              alt={deployment.provider}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.parentElement!.className = 'w-5 h-5 flex items-center justify-center bg-blue-100 rounded overflow-hidden'
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-semibold text-blue-600">${deployment.provider.charAt(0).toUpperCase()}</span>`
                              }}
                            />
                          </div>
                          <p className="font-medium">{deployment.provider.toUpperCase()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500">Region</p>
                        <p className="font-medium">{deployment.region}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Version</p>
                        <p className="font-medium">{deployment.version}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Health</p>
                        <p className={`font-medium ${deployment.health > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {deployment.health}%
                        </p>
                      </div>
                    </div>

                    {deployment.url && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">URL</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                            {deployment.url}
                          </code>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <p>Requests: {deployment.requests}</p>
                      </div>
                      <div>
                        <p>Response: {deployment.responseTime}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">Last deploy: {deployment.lastDeploy}</p>

                    <div className="flex items-center gap-2 pt-2">
                      {deployment.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Pause className="w-3 h-3" />
                            Stop
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Redeploy
                          </Button>
                        </>
                      )}
                      {deployment.status === 'stopped' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Play className="w-3 h-3" />
                          Start
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-1">
                        <Monitor className="w-3 h-3" />
                        Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Providers</CardTitle>
                <CardDescription>Connect and manage your cloud provider accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cloudProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded border border-gray-200">
                          <img 
                            src={provider.logo} 
                            alt={`${provider.name} logo`}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.className = 'w-12 h-12 flex items-center justify-center bg-blue-100 rounded border border-gray-200'
                              e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-blue-600">${provider.name.charAt(0)}</span>`
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-gray-500">
                            {provider.regions.length} regions available
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>

                <Alert className="mt-6">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your cloud provider credentials are encrypted and stored securely. 
                    We only request the minimum permissions needed for deployments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Settings</CardTitle>
                <CardDescription>Configure default deployment preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultProvider">Default Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cloudProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultRegion">Default Region</Label>
                    <Select defaultValue="us-east-1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cloudProviders
                          .find(p => p.id === selectedProvider)
                          ?.regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoScale">Auto-scaling</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="healthCheck">Health Check Interval</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook">Webhook URL (optional)</Label>
                  <Input
                    id="webhook"
                    placeholder="https://your-app.com/webhooks/deployment"
                    type="url"
                  />
                  <p className="text-xs text-gray-500">
                    Receive notifications when deployments complete
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Settings className="w-4 h-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseDashboardLayout>
  )
}