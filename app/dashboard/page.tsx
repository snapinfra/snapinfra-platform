"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/app-context"
import { getProjects } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { 
  EnterpriseMetricCard, 
  StatsGrid, 
  ActivityTimeline
} from "@/components/enterprise-dashboard-widgets"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Folder, Database, Code2, Plus, Filter, Clock, CheckCircle2, AlertCircle, TrendingUp, Activity as ActivityIcon } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const { state } = useAppContext()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Load all projects
  useEffect(() => {
    getProjects().then(projectList => {
      setProjects(projectList)
      setLoading(false)
    }).catch(error => {
      console.error('Failed to load projects:', error)
      setLoading(false)
    })
  }, [])

  // Calculate workspace-wide metrics
  const workspaceMetrics = useMemo(() => {
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => {
      const schema = Array.isArray(p.schema) ? p.schema : p.schema?.tables || []
      return schema.length > 0
    }).length
    const totalTables = projects.reduce((acc, p) => {
      const schema = Array.isArray(p.schema) ? p.schema : p.schema?.tables || []
      return acc + schema.length
    }, 0)
    const totalEndpoints = projects.reduce((acc, p) => acc + (p.endpoints?.length || 0), 0)
    
    return { totalProjects, activeProjects, totalTables, totalEndpoints }
  }, [projects])

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q)
    )
  }, [projects, searchQuery])

  // Project activity chart data
  const projectActivityData = useMemo(() => {
    return projects.slice(0, 5).map(p => {
      const schema = Array.isArray(p.schema) ? p.schema : p.schema?.tables || []
      return {
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        tables: schema.length,
        endpoints: p.endpoints?.length || 0
      }
    })
  }, [projects])

  // Recent activity from chat
  const recentActivity = useMemo(() => {
    const msgs: any[] = state.chatMessages || []
    const last = msgs.slice(-8).reverse()
    return last.map((m) => {
      const action = m?.metadata?.action
      let type: 'schema' | 'endpoint' | 'deployment' | 'ai' = 'ai'
      if (action === 'schema_update') type = 'schema'
      else if (action === 'endpoint_create') type = 'endpoint'
      else if (action === 'deployment') type = 'deployment'
      return {
        type,
        title: m.type === 'user' ? 'User input' : action === 'schema_update' ? 'Schema updated' : action === 'endpoint_create' ? 'Endpoints generated' : action === 'deployment' ? 'Deployment' : 'AI response',
        description: (m.content || '').replace(/\n/g, ' ').slice(0, 140),
        time: formatRelativeTime(new Date(m.timestamp)),
      }
    })
  }, [state.chatMessages])

  return (
    <EnterpriseDashboardLayout
      title="Dashboard"
      description="Overview of all your projects and workspace activity"
      breadcrumbs={[
        { label: "Dashboard" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/onboarding?new=true">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <>
            {/* Skeleton for Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skeleton for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-[250px] w-full" />
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skeleton for Projects Table */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-9 w-64" />
                </div>
              </CardHeader>
              <CardContent className="pt-6 bg-white">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                      <Skeleton className="h-5 w-1/4" />
                      <Skeleton className="h-5 w-1/6" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : projects.length === 0 ? (
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <CardTitle className="text-xl font-semibold text-gray-900">Get Started</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Create your first project to start building and managing your backend infrastructure.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/onboarding?new=true">
                    <Button size="lg" className="shadow-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <StatsGrid
              title="Platform Capabilities"
              description="What you can do with Snapinfra"
              stats={[
                { label: "Schema Design", value: "Automated", changeLabel: "AI-powered database modeling" },
                { label: "API Generation", value: "Instant", changeLabel: "Production-ready endpoints" },
                { label: "Deployment", value: "One-Click", changeLabel: "Multi-cloud support" },
                { label: "Monitoring", value: "Real-time", changeLabel: "Live system insights" },
              ]}
            />
          </div>
        ) : (
          <>
            {/* Workspace Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Projects</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{workspaceMetrics.totalProjects}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                      <Folder className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Projects</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{workspaceMetrics.activeProjects}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Tables</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{workspaceMetrics.totalTables}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg">
                      <Database className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Endpoints</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{workspaceMetrics.totalEndpoints}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg">
                      <Code2 className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-base font-semibold">Project Activity</CardTitle>
                  <CardDescription className="text-sm">Tables and endpoints by project</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {projectActivityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={projectActivityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="tables" fill="#8b5cf6" name="Tables" />
                        <Bar dataKey="endpoints" fill="#3b82f6" name="Endpoints" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                      No project data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Latest updates across projects</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project, idx) => (
                      <div key={project.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => router.push(`/projects/${project.id}`)}>
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0">
                          <Folder className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-xs text-gray-500">Updated {formatRelativeTime(new Date(project.updatedAt || project.createdAt))}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {(Array.isArray(project.schema) ? project.schema : project.schema?.tables || []).length} tables
                        </Badge>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No recent activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects List */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">All Projects</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">Manage and view all your projects</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Search projects..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 bg-white">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Name</TableHead>
                        <TableHead className="font-semibold text-gray-700">Database</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Tables</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Endpoints</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => {
                          const schema = Array.isArray(project.schema) ? project.schema : project.schema?.tables || []
                          const hasContent = schema.length > 0
                          return (
                            <TableRow 
                              key={project.id} 
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/projects/${project.id}`)}
                            >
                              <TableCell className="font-medium text-gray-900">{project.name}</TableCell>
                              <TableCell className="text-gray-600">{project.database?.type?.toUpperCase() || 'PostgreSQL'}</TableCell>
                              <TableCell className="text-right text-gray-600">{schema.length}</TableCell>
                              <TableCell className="text-right text-gray-600">{project.endpoints?.length || 0}</TableCell>
                              <TableCell>
                                {hasContent ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Empty
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 text-sm">
                                {formatRelativeTime(new Date(project.updatedAt || project.createdAt))}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            {searchQuery ? 'No projects match your search' : 'No projects yet'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </EnterpriseDashboardLayout>
  )
}

{/* Helper Components */}
function Kpi({ icon, label, value, valueLabel }: { icon: React.ReactNode; label: string; value?: number; valueLabel?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-lg font-semibold text-gray-900">{valueLabel ?? value}</div>
      </div>
    </div>
  )
}

function EmptyChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
      {label}
    </div>
  )
}

function GeneratedFilesList({ files, fileType, projectName }: { files: { path: string; content: string }[]; fileType: 'code'|'iac'; projectName: string }) {
  const max = 8
  const list = files.slice(0, max)
  const more = files.length - list.length

  const copy = async (content: string) => {
    try { await navigator.clipboard.writeText(content) } catch {}
  }
  const downloadBundle = async () => {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    for (const f of files) {
      const path = String(f.path || '').replace(/^\/+/, '')
      zip.file(path, f.content ?? '')
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}-${fileType}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((f, i) => (
          <div key={i} className="border rounded-md p-2 flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors">
            <div className="min-w-0 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div className="font-mono text-sm truncate" title={f.path}>{f.path}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copy(f.content)} title="Copy" className="flex-shrink-0">
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {more > 0 && <div className="text-xs text-gray-500">+{more} more files</div>}
      <div className="pt-1">
        <Button variant="outline" size="sm" onClick={downloadBundle}>
          <Download className="w-4 h-4 mr-2" />
          Download ZIP ({files.length} files)
        </Button>
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date) {
  const now = new Date().getTime()
  const diff = Math.max(0, Math.floor((now - date.getTime()) / 1000))
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
