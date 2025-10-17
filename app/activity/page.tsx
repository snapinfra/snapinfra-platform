"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  Clock, 
  User, 
  Code2, 
  Database, 
  Rocket, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  GitCommit,
  Upload,
  Download,
  Bell,
  Filter,
  Search,
  Eye,
  Play
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const activityData = [
  {
    id: '1',
    type: 'deployment',
    action: 'Deployed to production',
    user: { name: 'John Doe', avatar: null, email: 'john@example.com' },
    project: 'E-commerce API',
    timestamp: new Date('2024-01-17T09:15:00Z'),
    details: 'Version v1.2.3 deployed successfully',
    status: 'success'
  },
  {
    id: '2',
    type: 'code_generation',
    action: 'Generated API endpoints',
    user: { name: 'Jane Smith', avatar: null, email: 'jane@example.com' },
    project: 'User Management System',
    timestamp: new Date('2024-01-17T08:30:00Z'),
    details: 'Created 12 REST endpoints with authentication',
    status: 'info'
  },
  {
    id: '3',
    type: 'schema_update',
    action: 'Updated database schema',
    user: { name: 'Mike Johnson', avatar: null, email: 'mike@example.com' },
    project: 'Analytics Dashboard',
    timestamp: new Date('2024-01-17T07:45:00Z'),
    details: 'Added new tables: analytics_events, user_sessions',
    status: 'info'
  },
  {
    id: '4',
    type: 'error',
    action: 'Deployment failed',
    user: { name: 'Sarah Wilson', avatar: null, email: 'sarah@example.com' },
    project: 'Payment Service',
    timestamp: new Date('2024-01-17T06:20:00Z'),
    details: 'Build failed due to missing environment variables',
    status: 'error'
  },
  {
    id: '5',
    type: 'project_created',
    action: 'Created new project',
    user: { name: 'Alex Brown', avatar: null, email: 'alex@example.com' },
    project: 'Social Media Backend',
    timestamp: new Date('2024-01-16T16:30:00Z'),
    details: 'Initialized project with authentication and user management',
    status: 'success'
  },
  {
    id: '6',
    type: 'settings_update',
    action: 'Updated project settings',
    user: { name: 'Emily Davis', avatar: null, email: 'emily@example.com' },
    project: 'E-commerce API',
    timestamp: new Date('2024-01-16T14:15:00Z'),
    details: 'Enabled auto-scaling and updated environment variables',
    status: 'info'
  }
]

const systemLogs = [
  {
    id: '1',
    level: 'info',
    timestamp: new Date('2024-01-17T09:15:00Z'),
    service: 'deployment-service',
    message: 'Deployment completed successfully',
    details: 'Project: e-commerce-api, Version: v1.2.3, Duration: 2m 34s'
  },
  {
    id: '2',
    level: 'warn',
    timestamp: new Date('2024-01-17T09:10:00Z'),
    service: 'code-generator',
    message: 'High memory usage detected',
    details: 'Memory usage: 85%, Consider optimizing large schema processing'
  },
  {
    id: '3',
    level: 'error',
    timestamp: new Date('2024-01-17T06:20:00Z'),
    service: 'deployment-service',
    message: 'Deployment failed',
    details: 'Missing environment variable: DATABASE_URL'
  },
  {
    id: '4',
    level: 'info',
    timestamp: new Date('2024-01-17T05:45:00Z'),
    service: 'auth-service',
    message: 'User authentication successful',
    details: 'User: john@example.com, Session: abc123'
  }
]

export default function ActivityPage() {
  const { user } = useUser()
  const [filter, setFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deployment': return <Rocket className="w-4 h-4" />
      case 'code_generation': return <Code2 className="w-4 h-4" />
      case 'schema_update': return <Database className="w-4 h-4" />
      case 'error': return <AlertTriangle className="w-4 h-4" />
      case 'project_created': return <CheckCircle className="w-4 h-4" />
      case 'settings_update': return <Settings className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-100 border-red-200'
      case 'warn': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const filteredActivities = activityData.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || activity.type === filter
    return matchesSearch && matchesFilter
  })

  return (
    <EnterpriseDashboardLayout
      title="Activity Feed"
      description="Monitor recent actions, deployments, and system events"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Activity" },
      ]}
      actions={
        <Button variant="outline" className="gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </Button>
      }
    >
      <div className="space-y-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Actions</p>
                  <p className="text-2xl font-bold text-blue-600">24</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Deployments</p>
                  <p className="text-2xl font-bold text-green-600">5</p>
                </div>
                <Rocket className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-purple-600">12</p>
                </div>
                <User className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Eye className="w-4 h-4" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="deployments" className="gap-2">
              <Rocket className="w-4 h-4" />
              Deployments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      <SelectItem value="deployment">Deployments</SelectItem>
                      <SelectItem value="code_generation">Code Generation</SelectItem>
                      <SelectItem value="schema_update">Schema Updates</SelectItem>
                      <SelectItem value="error">Errors</SelectItem>
                      <SelectItem value="project_created">Project Created</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions and events across your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {activity.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{activity.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.project}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Real-time system events and error logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-gray-600">{log.service}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-1">{log.message}</p>
                      <p className="text-xs text-gray-600">{log.details}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment History</CardTitle>
                <CardDescription>Recent deployments and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityData
                    .filter(activity => activity.type === 'deployment')
                    .map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getStatusColor(deployment.status)}`}>
                          <Rocket className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{deployment.project}</p>
                          <p className="text-sm text-gray-600">{deployment.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDistanceToNow(deployment.timestamp, { addSuffix: true })}
                        </p>
                        <Badge className={`text-xs ${getStatusColor(deployment.status)}`}>
                          {deployment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnterpriseDashboardLayout>
  )
}