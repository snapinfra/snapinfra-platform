"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext } from "@/lib/appContext/app-context"
import { getProjectById } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Edit3,
  RefreshCw
} from "lucide-react"
import { DeployModal } from "./deploy-modal"
import { DestroyModal } from "./destroy-modal"

const BACKEND_URL = "http://localhost:3001"

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
]

interface Deployment {
  id: string
  userId: string
  deploymentId: string
  projectName: string
  status: string
  region: string
  createdAt: string
  updatedAt: string
  outputs: any
  images: string[]
  duration: string
  error?: string
  accountId?: string
  ecrRegistry?: string
  deploymentUrl?: string
}

export default function DeploymentsPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [selectedProvider, setSelectedProvider] = useState('aws')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [showDestroyModal, setShowDestroyModal] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [backendHealth, setBackendHealth] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Check backend health
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      if (response.ok) {
        const data = await response.json()
        setBackendHealth(data)
      }
    } catch (error) {
      console.error('Backend health check failed:', error)
      setBackendHealth({ status: 'offline' })
    }
  }

  // Load project and deployments from DynamoDB
  useEffect(() => {
    if (!projectId) return
    loadData()
  }, [projectId])

  const loadData = async () => {
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

      // Fetch deployments from DynamoDB via backend API
      const response = await fetch(`${BACKEND_URL}/api/deployments/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.deployments) {
          // Transform DynamoDB data to match our UI format
          const formattedDeployments = data.deployments.map((dep: Deployment) => ({
            id: dep.deploymentId,
            name: getDeploymentName(dep.status),
            environment: dep.status === 'active' ? 'production' : 'staging',
            status: dep.status,
            provider: 'aws',
            region: dep.region,
            url: dep.deploymentUrl || (dep.outputs?.alb_url?.value || null),
            lastDeploy: new Date(dep.updatedAt).toLocaleDateString(),
            version: 'v1.0.0',
            health: dep.status === 'active' ? 99.9 : 0,
            requests: 'N/A',
            responseTime: 'N/A',
            deploymentId: dep.deploymentId,
            accountId: dep.accountId,
            ecrRegistry: dep.ecrRegistry,
            images: dep.images,
            outputs: dep.outputs,
            error: dep.error,
            duration: dep.duration,
            createdAt: dep.createdAt,
            updatedAt: dep.updatedAt
          }))
          setDeployments(formattedDeployments)
        } else {
          setDeployments([])
        }
      } else {
        console.error('Failed to fetch deployments from backend')
        setDeployments([])
      }
    } catch (error) {
      console.error('Failed to load deployment data:', error)
      setDeployments([])
    } finally {
      setLoading(false)
    }
  }

  const getDeploymentName = (status: string) => {
    switch (status) {
      case 'active': return 'Production'
      case 'deploying': return 'Deploying...'
      case 'failed': return 'Failed Deployment'
      case 'destroyed': return 'Destroyed'
      case 'destroying': return 'Destroying...'
      default: return 'Deployment'
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await checkBackendHealth()
    setRefreshing(false)
  }

  const handleDeploymentComplete = async () => {
    // Refresh data after successful deployment
    await loadData()
    setShowDeployModal(false)
  }

  const handleDestroyClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment)
    setShowDestroyModal(true)
  }

  const handleDestroyComplete = async () => {
    // Refresh data after successful destruction
    await loadData()
    setShowDestroyModal(false)
    setSelectedDeployment(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'deploying': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'destroyed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'destroying': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProviderLogo = (provider: string) => {
    const p = cloudProviders.find(cp => cp.id === provider)
    return p?.logo || 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg'
  }

  const activeDeployments = deployments.filter(d => d.status === 'active').length
  const totalDeployments = deployments.length
  const lastDeployment = deployments.length > 0
    ? new Date(deployments[0].updatedAt).toLocaleDateString()
    : 'Never'

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`${BACKEND_URL}/api/health`, '_blank')}
          >
            <Activity className="w-4 h-4" />
            Service Status
          </Button>
          <Button
            className="gap-2"
            onClick={() => setShowDeployModal(true)}
          >
            <Rocket className="w-4 h-4" />
            New Deployment
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Backend Status Alert */}
        {backendHealth && backendHealth.status === 'offline' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Deployment service is offline. Please ensure the backend is running at {BACKEND_URL}
            </AlertDescription>
          </Alert>
        )}

        {backendHealth && backendHealth.status === 'healthy' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Deployment service is online and ready. DynamoDB Table: {backendHealth.dynamoDbTable}
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-green-600">{activeDeployments}</p>
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
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {activeDeployments > 0 ? 'deployed' : 'draft'}
                  </p>
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
                  <p className="text-2xl font-bold text-purple-600">{totalDeployments}</p>
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
                  <p className="text-sm font-bold text-green-600">{lastDeployment}</p>
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
                <p className="text-gray-500">Loading deployments from DynamoDB...</p>
              </div>
            )}

            {!loading && deployments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deployments Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Deploy your project to AWS with one click. Deployments are automatically saved to DynamoDB.
                  </p>
                  <Button
                    className="gap-2"
                    onClick={() => setShowDeployModal(true)}
                    disabled={backendHealth?.status !== 'healthy'}
                  >
                    <Rocket className="w-4 h-4" />
                    Deploy Now
                  </Button>
                  {backendHealth?.status !== 'healthy' && (
                    <p className="text-sm text-red-600 mt-4">
                      Deployment service must be online to deploy
                    </p>
                  )}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(deployment.deploymentId)
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
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
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">{deployment.duration}</p>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(deployment.url.startsWith('http') ? deployment.url : `http://${deployment.url}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {deployment.error && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            {deployment.error.substring(0, 100)}...
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                          <p>Images: {deployment.images?.length || 0}</p>
                        </div>
                        <div>
                          <p>Account: {deployment.accountId?.substring(0, 8) || 'N/A'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Created: {new Date(deployment.createdAt).toLocaleString()}
                      </p>

                      <div className="flex items-center gap-2 pt-2">
                        {deployment.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => setShowDeployModal(true)}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Redeploy
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Monitor className="w-4 h-4" />
                              Logs
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDestroyClick(deployment)}
                            >
                              <Trash2 className="w-3 h-3" />
                              Destroy
                            </Button>
                          </>
                        )}
                        {deployment.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setShowDeployModal(true)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </Button>
                        )}
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
                          />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-gray-500">
                            {provider.regions.length} regions available
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => provider.id === 'aws' && setShowDeployModal(true)}
                      >
                        <Plus className="w-4 h-4" />
                        {provider.id === 'aws' ? 'Deploy' : 'Coming Soon'}
                      </Button>
                    </div>
                  ))}
                </div>

                <Alert className="mt-6">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Deployments are automatically saved to DynamoDB ({backendHealth?.dynamoDbTable})
                    for persistent storage and tracking.
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
                <div className="space-y-2">
                  <Label>Backend Service URL</Label>
                  <Input value={BACKEND_URL} disabled />
                  <p className="text-xs text-gray-500">
                    The deployment service endpoint with DynamoDB integration.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>DynamoDB Table</Label>
                  <Input value={backendHealth?.dynamoDbTable || 'Loading...'} disabled />
                  <p className="text-xs text-gray-500">
                    All deployments are stored in this DynamoDB table.
                  </p>
                </div>

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

      <DeployModal
        open={showDeployModal}
        onOpenChange={setShowDeployModal}
        projectId={projectId}
        projectName={state.currentProject?.name || 'Project'}
        userId={state.user?.id}
        onDeploymentComplete={handleDeploymentComplete}
      />

      <DestroyModal
        open={showDestroyModal}
        onOpenChange={setShowDestroyModal}
        projectId={projectId}
        projectName={state.currentProject?.name || 'Project'}
        userId={state.user?.id}
        deployment={selectedDeployment}
        onDestroyComplete={handleDestroyComplete}
      />
    </EnterpriseDashboardLayout>
  )
}