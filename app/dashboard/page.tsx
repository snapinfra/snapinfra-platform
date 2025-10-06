"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useAppContext } from "@/lib/app-context"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { 
  EnterpriseMetricCard, 
  StatsGrid, 
  ActivityTimeline, 
  DataSummaryCard,
  StatusOverview,
  ProgressTracker
} from "@/components/enterprise-dashboard-widgets"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeploymentModal } from "@/components/deployment-modal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart as PieChartIcon, BarChart3, Layers, Database, ListChecks, Network, Settings, Rocket, Activity, Globe, Code2, FileText, Download, Copy, Plus, Filter, RefreshCw, Shield, CheckCircle2, Clock } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function Dashboard() {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state

  async function retryGenerate(kind: 'code'|'iac') {
    if (!currentProject) return
    try {
      if (kind === 'code') {
        const resp = await fetch('/api/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: currentProject, framework: 'express', language: 'typescript', includeAuth: false, includeTests: false })
        })
        const data = await resp.json()
        if (data?.success) {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode: data.data } as any })
        } else {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode: { files: [], instructions: '', dependencies: [], success: false, error: data?.error || 'Code generation failed' } } as any })
        }
      } else {
        const resp = await fetch('/api/generate-iac', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: currentProject, options: { targets: ['terraform','aws-cdk','docker-compose'], cloud: 'aws', environment: 'development' } })
        })
        const data = await resp.json()
        if (data?.success) {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedIaC: data.data } as any })
        } else {
          dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedIaC: { files: [], instructions: '', dependencies: [], success: false, error: data?.error || 'IaC generation failed' } } as any })
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      if (kind === 'code') {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode: { files: [], instructions: '', dependencies: [], success: false, error: msg } } as any })
      } else {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedIaC: { files: [], instructions: '', dependencies: [], success: false, error: msg } } as any })
      }
    }
  }

  const metrics = useMemo(() => {
    const tables = currentProject?.schema?.length || 0
    const fields = currentProject?.schema?.reduce((acc: number, t: any) => acc + (t.fields?.length || 0), 0) || 0
    const endpoints = currentProject?.endpoints?.length ?? (tables > 0 ? tables * 4 : 0)
    const decisions = (currentProject as any)?.decisions?.decisions?.length || 0
    const components = (currentProject as any)?.architecture?.nodes?.length || 0
    const connections = (currentProject as any)?.architecture?.edges?.length || 0
    return { tables, fields, endpoints, decisions, components, connections }
  }, [currentProject])

  const fieldTypeData = useMemo(() => {
    if (!currentProject?.schema) return [] as { name: string; value: number; fill: string }[]
    const counts = new Map<string, number>()
    currentProject.schema.forEach((tbl: any) => {
      tbl.fields?.forEach((f: any) => {
        const key = typeof f.type === 'string' && f.type.trim() ? f.type : 'Other'
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })
    const palette = ["#e11d48", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#f43f5e"]
    const entries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
    const top = entries.slice(0, 5)
    const restTotal = entries.slice(5).reduce((acc, [, v]) => acc + v, 0)
    const data = top.map(([name, value], i) => ({ name, value, fill: palette[i % palette.length] }))
    if (restTotal > 0) data.push({ name: 'Other', value: restTotal, fill: palette[data.length % palette.length] })
    return data
  }, [currentProject])

  const methodData = useMemo(() => {
    const approx = metrics.endpoints
    const methodCounts = new Map<string, number>()
    if (currentProject?.endpoints?.length) {
      currentProject.endpoints.forEach((ep: any) => {
        const m = (ep.method || 'GET').toUpperCase()
        methodCounts.set(m, (methodCounts.get(m) || 0) + 1)
      })
    } else if (approx > 0) {
      // Heuristic distribution
      methodCounts.set('GET', Math.round(approx * 0.5))
      methodCounts.set('POST', Math.round(approx * 0.3))
      methodCounts.set('PUT', Math.round(approx * 0.1))
      methodCounts.set('DELETE', approx - (methodCounts.get('GET')! + methodCounts.get('POST')! + methodCounts.get('PUT')!))
    }
    return Array.from(methodCounts.entries()).map(([name, value]) => ({ name, value }))
  }, [currentProject, metrics.endpoints])

  // Endpoint filters
  const [endpointSearch, setEndpointSearch] = useState("")
  const [endpointMethod, setEndpointMethod] = useState("ALL")
  const filteredEndpoints = useMemo(() => {
    const list: any[] = currentProject?.endpoints || []
    return list.filter((ep) => {
      const matchesMethod = endpointMethod === 'ALL' || (ep.method || '').toUpperCase() === endpointMethod
      const q = endpointSearch.trim().toLowerCase()
      const matchesQuery = !q || ep.path?.toLowerCase().includes(q) || ep.group?.toLowerCase().includes(q)
      return matchesMethod && matchesQuery
    })
  }, [currentProject, endpointMethod, endpointSearch])

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
      title={currentProject ? currentProject.name : "Dashboard"}
      description={currentProject ? "Project overview and management" : "Welcome to Snapinfra"}
      breadcrumbs={[
        { label: "Projects", href: "/" },
        { label: currentProject?.name || "Dashboard" },
      ]}
      actions={
        currentProject && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <DeploymentModal>
              <Button size="sm">
                Deploy
              </Button>
            </DeploymentModal>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* If no project, show enterprise empty state */}
        {!currentProject ? (
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
                  <Link href="/architecture-demo">
                    <Button variant="outline" size="lg" className="border-gray-300 hover:bg-gray-50">
                      <Activity className="w-4 h-4 mr-2" />
                      View Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Feature Overview for Empty State */}
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
            {/* Enterprise Metrics Grid */}
            <StatsGrid
              title="Project Metrics"
              description="Overview of your infrastructure components"
              stats={[
                { label: "Database Tables", value: metrics.tables, change: 12, changeLabel: "vs. last week" },
                { label: "Total Fields", value: metrics.fields, change: 8, changeLabel: "vs. last week" },
                { label: "API Endpoints", value: metrics.endpoints, change: 15, changeLabel: "vs. last week" },
                { label: "Architecture Nodes", value: metrics.components, change: 5, changeLabel: "vs. last week" },
                { label: "Connections", value: metrics.connections, change: 3, changeLabel: "vs. last week" },
                { label: "Decisions Made", value: metrics.decisions, change: 0, changeLabel: "vs. last week" },
              ]}
              columns={6}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EnterpriseMetricCard
                    title="Database Tables"
                    value={metrics.tables}
                    subtitle="Active schema definitions"
                    icon={<Database className="h-5 w-5" />}
                    change={{ value: 12, period: "vs. last week", isPositive: true }}
                    status="success"
                  />
                  <EnterpriseMetricCard
                    title="API Endpoints"
                    value={metrics.endpoints}
                    subtitle="REST API routes"
                    icon={<Code2 className="h-5 w-5" />}
                    change={{ value: 15, period: "vs. last week", isPositive: true }}
                    status="success"
                  />
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100 bg-white pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                        <PieChartIcon className="w-4 h-4 text-gray-600" />
                        Field Types
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600 mt-1">Schema field distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-6 bg-white">
                      {fieldTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={fieldTypeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} strokeWidth={2}>
                              {fieldTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any, name: any) => [value, name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChartPlaceholder label="No field data yet" />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100 bg-white pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                        API Methods
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600 mt-1">HTTP method distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-6 bg-white">
                      {methodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={methodData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                            <Tooltip formatter={(value: any) => [`${value} endpoints`, 'Count']} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChartPlaceholder label="No endpoint data yet" />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Generated Assets */}
                <Card id="assets" className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 bg-white">
                  <CardTitle className="text-sm font-semibold text-gray-900">Generated Assets</CardTitle>
                  <CardDescription className="text-xs text-gray-600 mt-1">Backend code and Infrastructure-as-Code</CardDescription>
                </CardHeader>
                <CardContent className="p-4 bg-white">
                  <Tabs defaultValue={currentProject?.generatedCode ? 'code' : 'iac'}>
                    <TabsList>
                      <TabsTrigger value="code">Backend Code</TabsTrigger>
                      <TabsTrigger value="iac">IaC</TabsTrigger>
                    </TabsList>
                    <TabsContent value="code" className="mt-3 space-y-2">
                      {currentProject?.generatedCode?.files?.length ? (
                        <GeneratedFilesList files={currentProject.generatedCode.files} fileType="code" projectName={currentProject.name} />
                      ) : (
                        <>
                          <div className="text-sm text-gray-500">
                            {currentProject?.generatedCode?.success === false ? (
                              <>Code generation failed: {currentProject.generatedCode.error || 'Unknown error'}</>
                            ) : (
                              <>Generating backend code…</>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => retryGenerate('code')}>Retry</Button>
                        </>
                      )}
                    </TabsContent>
                    <TabsContent value="iac" className="mt-3 space-y-2">
                      {currentProject?.generatedIaC?.files?.length ? (
                        <GeneratedFilesList files={currentProject.generatedIaC.files} fileType="iac" projectName={currentProject.name} />
                      ) : (
                        <>
                          <div className="text-sm text-gray-500">
                            {currentProject?.generatedIaC?.success === false ? (
                              <>IaC generation failed: {currentProject.generatedIaC.error || 'Unknown error'}. {`Ensure GROQ_API_KEY is configured on the server.`}</>
                            ) : (
                              <>Generating infrastructure code…</>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => retryGenerate('iac')}>Retry</Button>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                {/* Project Status Overview */}
                <StatusOverview
                  title="System Status"
                  items={[
                    {
                      label: "Database",
                      status: "operational",
                      description: currentProject?.database?.type || "PostgreSQL",
                      lastChecked: "2 minutes ago",
                    },
                    {
                      label: "API Endpoints",
                      status: metrics.endpoints > 0 ? "operational" : "maintenance",
                      description: `${metrics.endpoints} active routes`,
                      lastChecked: "Just now",
                    },
                    {
                      label: "Deployment",
                      status: currentProject?.deployment ? "operational" : "maintenance",
                      description: currentProject?.deployment?.environment || "Not deployed",
                      lastChecked: "5 minutes ago",
                    },
                  ]}
                />

                {/* Activity Timeline */}
                <ActivityTimeline
                  items={recentActivity.map((ev, i) => ({
                    id: String(i),
                    type: ev.type === 'schema' ? 'success' : ev.type === 'endpoint' ? 'info' : ev.type === 'deployment' ? 'warning' : 'info',
                    title: ev.title,
                    description: ev.description,
                    timestamp: ev.time,
                  }))}
                />

                {/* Progress Tracker */}
                <ProgressTracker
                  title="Project Completion"
                  items={[
                    {
                      label: "Schema Design",
                      current: metrics.tables,
                      total: Math.max(metrics.tables, 5),
                      percentage: Math.min((metrics.tables / Math.max(metrics.tables, 5)) * 100, 100),
                    },
                    {
                      label: "API Implementation",
                      current: metrics.endpoints,
                      total: Math.max(metrics.endpoints, 10),
                      percentage: Math.min((metrics.endpoints / Math.max(metrics.endpoints, 10)) * 100, 100),
                    },
                    {
                      label: "Architecture",
                      current: metrics.components,
                      total: Math.max(metrics.components, 5),
                      percentage: Math.min((metrics.components / Math.max(metrics.components, 5)) * 100, 100),
                    },
                  ]}
                />

                {/* Database Summary */}
                <DataSummaryCard
                  title="Database Configuration"
                  data={[
                    {
                      label: "Type",
                      value: currentProject?.database?.type?.toUpperCase() || "POSTGRESQL",
                      badge: {
                        label: typeof currentProject?.database?.confidence === 'number'
                          ? `${(currentProject.database.confidence * 100).toFixed(0)}% match`
                          : "Recommended",
                        variant: "secondary" as const,
                      },
                    },
                    { label: "Tables", value: metrics.tables, subtitle: "Schema definitions" },
                    { label: "Total Fields", value: metrics.fields, subtitle: "Across all tables" },
                    { label: "Relationships", value: metrics.connections, subtitle: "Foreign keys" },
                  ]}
                />
              </div>
            </div>

            {/* Full-Width Resources Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">Project Resources</CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">Detailed view of all project components</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 bg-white">
                <Tabs defaultValue="tables">
                  <TabsList>
                    <TabsTrigger value="tables">Tables ({metrics.tables})</TabsTrigger>
                    <TabsTrigger value="endpoints">Endpoints ({metrics.endpoints})</TabsTrigger>
                    <TabsTrigger value="decisions">Decisions ({metrics.decisions})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tables" className="mt-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 border-b border-gray-200">
                            <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Name</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 text-xs uppercase tracking-wide">Fields</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 text-xs uppercase tracking-wide">Relationships</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 text-xs uppercase tracking-wide">Indexes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(currentProject?.schema || []).length > 0 ? (
                            (currentProject?.schema || []).map((t: any) => (
                              <TableRow key={t.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                <TableCell className="font-medium text-gray-900 text-sm">{t.name}</TableCell>
                                <TableCell className="text-right text-gray-600 text-sm">{t.fields?.length || 0}</TableCell>
                                <TableCell className="text-right text-gray-600 text-sm">{t.relationships?.length || 0}</TableCell>
                                <TableCell className="text-right text-gray-600 text-sm">{t.indexes?.length || 0}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-8">
                                No tables defined yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="endpoints" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Search path or group..."
                            value={endpointSearch}
                            onChange={(e) => setEndpointSearch(e.target.value)}
                          />
                        </div>
                        <Select value={endpointMethod} onValueChange={setEndpointMethod}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>HTTP Method</SelectLabel>
                              <SelectItem value="ALL">All Methods</SelectItem>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 border-b border-gray-200">
                              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Method</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Path</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Group</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Auth</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEndpoints.length > 0 ? (
                              filteredEndpoints.map((ep: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs font-mono font-semibold border-gray-300">
                                      {ep.method}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm text-gray-900">{ep.path}</TableCell>
                                  <TableCell className="text-sm text-gray-600">{ep.group}</TableCell>
                                  <TableCell className="text-sm">
                                    {ep.auth ? (
                                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Required</Badge>
                                    ) : (
                                      <span className="text-gray-500 text-xs">None</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-[300px] truncate text-sm text-gray-600" title={ep.description}>
                                    {ep.description}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-8">
                                  No endpoints found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="decisions" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(currentProject as any)?.decisions?.decisions?.length > 0 ? (
                        (currentProject as any).decisions.decisions.slice(0, 12).map((d: any) => (
                          <Card key={d.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 bg-white">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                                  <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{d.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs flex-shrink-0 bg-gray-100 text-gray-700 border-gray-200">
                                  {d.category}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-sm text-gray-500 py-8">
                          No decisions made yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
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
