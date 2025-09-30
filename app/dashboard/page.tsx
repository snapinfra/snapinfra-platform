"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { GeneratedSummary } from "@/components/generated-summary"
import { useAppContext } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern"
import { DeploymentModal } from "@/components/deployment-modal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart as PieChartIcon, BarChart3, Layers, Database, ListChecks, Network, Settings, Rocket, ArrowRight, Sparkles, Activity, Globe, Shield, CheckCircle2, AlertTriangle, Clock, FileText, Download, Copy } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full pt-[44px] sm:pt-[52px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* If no project, show a friendly empty state */}
          {!currentProject ? (
            <Card className="relative overflow-hidden border border-gray-200">
              <GridPattern width={60} height={60} strokeDasharray="4 4" className="opacity-30" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Welcome to Rhinoback
                </CardTitle>
                <CardDescription>Start by creating a project to unlock your interactive dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/onboarding?new=true">
                    <Button className=""><Rocket className="w-4 h-4 mr-2" /> New Project</Button>
                  </Link>
                  <Link href="/architecture-demo">
                    <Button variant="outline" className=""><ArrowRight className="w-4 h-4 mr-2" /> See a demo</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Hero / Overview */}
              <Card id="overview" className="relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-transparent" />
                <GridPattern width={60} height={60} strokeDasharray="4 4" className="opacity-30" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tight-tracking text-gray-900">{currentProject?.name || 'Your Project'}</h1>
                      </div>
                      <CardDescription className="mt-1 text-gray-600">
                        A snapshot of your backend blueprint with quick actions.
                      </CardDescription>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <DeploymentModal>
                        <Button className="bg-gray-900 text-white hover:bg-gray-800"><Rocket className="w-4 h-4 mr-2" /> Deploy</Button>
                      </DeploymentModal>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {/* KPI tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Kpi icon={<Database className="w-4 h-4" />} label="Tables" value={metrics.tables} />
                    <Kpi icon={<Layers className="w-4 h-4" />} label="Fields" value={metrics.fields} />
                    <Kpi icon={<ListChecks className="w-4 h-4" />} label="Endpoints" value={metrics.endpoints} />
                    <Kpi icon={<Settings className="w-4 h-4" />} label="Decisions" value={metrics.decisions} />
                    <Kpi icon={<Network className="w-4 h-4" />} label="Components" value={metrics.components} />
                    <Kpi icon={<Network className="w-4 h-4" />} label="Connections" value={metrics.connections} />
                  </div>

                  {/* Mobile quick actions */}
                  <div className="mt-4 flex sm:hidden flex-col gap-2">
                    <DeploymentModal>
                      <Button className="bg-gray-900 text-white hover:bg-gray-800"><Rocket className="w-4 h-4 mr-2" /> Deploy</Button>
                    </DeploymentModal>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Assets (on top) */}
              <Card id="assets" className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Generated Assets</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Backend code and Infrastructure-as-Code</CardDescription>
                </CardHeader>
                <CardContent>
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

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-gray-200" id="charts">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><PieChartIcon className="w-4 h-4" /> Field type distribution</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Composition of your schema fields</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    {fieldTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={fieldTypeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} strokeWidth={2}>
                            {fieldTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, name: any) => [value, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartPlaceholder label="No fields yet" />
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Endpoint methods</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Distribution of API methods</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    {methodData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={methodData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value: any, name: any) => [value, name]} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartPlaceholder label="No endpoints yet" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* In-page navigation (desktop) */}
              <div className="hidden lg:grid grid-cols-[220px_1fr] gap-6">
                <nav className="sticky top-[60px] self-start space-y-1 border border-gray-200 rounded-md p-2 bg-white h-fit" aria-label="Section navigation">
                  <a href="#overview" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Overview</a>
                  <a href="#assets" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Assets</a>
                  <a href="#charts" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Analytics</a>
                  <a href="#resources" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Resources</a>
                  <a href="#activity" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Activity</a>
                  <a href="#deployments" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Deployments</a>
                  <a href="#database" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Database</a>
                  <a href="#insights" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Insights</a>
                  <a href="#recommendations" className="block px-2 py-1.5 rounded hover:bg-gray-50 text-sm">Recommendations</a>
                </nav>
                <div className="space-y-6">
                  {/* Resources */}
                  <Card id="resources" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Resources</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Explore your tables, endpoints, and decisions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Tabs defaultValue="tables">
                        <TabsList>
                          <TabsTrigger value="tables">Tables</TabsTrigger>
                          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                          <TabsTrigger value="decisions">Decisions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tables" className="space-y-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Fields</TableHead>
                                <TableHead className="text-right">Relationships</TableHead>
                                <TableHead className="text-right">Indexes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(currentProject?.schema || []).map((t: any) => (
                                <TableRow key={t.id}>
                                  <TableCell className="font-medium">{t.name}</TableCell>
                                  <TableCell className="text-right">{t.fields?.length || 0}</TableCell>
                                  <TableCell className="text-right">{t.relationships?.length || 0}</TableCell>
                                  <TableCell className="text-right">{t.indexes?.length || 0}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="endpoints" className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <Input placeholder="Search path or group" value={endpointSearch} onChange={(e) => setEndpointSearch(e.target.value)} />
                            </div>
                            <Select value={endpointMethod} onValueChange={setEndpointMethod}>
                              <SelectTrigger>
                                <SelectValue placeholder="Method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Method</SelectLabel>
                                  <SelectItem value="ALL">All</SelectItem>
                                  <SelectItem value="GET">GET</SelectItem>
                                  <SelectItem value="POST">POST</SelectItem>
                                  <SelectItem value="PUT">PUT</SelectItem>
                                  <SelectItem value="DELETE">DELETE</SelectItem>
                                  <SelectItem value="PATCH">PATCH</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Method</TableHead>
                                <TableHead>Path</TableHead>
                                <TableHead>Group</TableHead>
                                <TableHead>Auth</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEndpoints.map((ep: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{ep.method}</Badge>
                                  </TableCell>
                                  <TableCell className="font-mono">{ep.path}</TableCell>
                                  <TableCell>{ep.group}</TableCell>
                                  <TableCell>{ep.auth ? 'Yes' : 'No'}</TableCell>
                                  <TableCell className="max-w-[300px] truncate" title={ep.description}>{ep.description}</TableCell>
                                </TableRow>
                              ))}
                              {filteredEndpoints.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">No endpoints found</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="decisions" className="space-y-2">
                          {(currentProject as any)?.decisions?.decisions?.slice(0, 12).map((d: any) => (
                            <div key={d.id} className="flex items-start justify-between border rounded-md p-2">
                              <div>
                                <div className="text-sm font-medium">{d.title}</div>
                                <div className="text-xs text-gray-600 line-clamp-2">{d.description}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs">{d.category}</Badge>
                            </div>
                          )) || <div className="text-sm text-gray-500">No decisions yet.</div>}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Activity */}
                  <Card id="activity" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> Recent activity</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Latest system and AI events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentActivity.map((ev, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <TimelineIcon type={ev.type} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{ev.title}</div>
                              <div className="text-xs text-gray-600 truncate">{ev.description}</div>
                            </div>
                            <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">{ev.time}</div>
                          </div>
                        ))}
                        {recentActivity.length === 0 && (
                          <div className="text-sm text-gray-500">No recent activity</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deployments */}
                  <Card id="deployments" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Environments & Deployments</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Status across environments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['development','staging','production'].map((env) => (
                          <div key={env} className="border rounded-md p-3 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium capitalize">{env}</div>
                              <EnvStatusBadge env={env as any} deployment={currentProject?.deployment} />
                            </div>
                            <div className="mt-1 text-xs text-gray-600 truncate">
                              {currentProject?.deployment?.environment === env ? (
                                <>
                                  URL: <a className="text-blue-600 hover:underline" href={currentProject.deployment.url} target="_blank" rel="noreferrer">{currentProject.deployment.url}</a>
                                </>
                              ) : (
                                'No deployment'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Database */}
                  <Card id="database" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Database</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Selected storage and rationale</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{currentProject?.database?.type || 'postgresql'}</Badge>
                        {typeof currentProject?.database?.confidence === 'number' && (
                          <Badge variant="secondary">Confidence {(currentProject.database.confidence * 100).toFixed(0)}%</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">{currentProject?.database?.reasoning || 'Recommended based on your use case and schema.'}</div>
                      <div className="flex flex-wrap gap-1">
                        {(currentProject?.database?.features || ['ACID compliance','Complex queries','Scalability']).map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights from generation */}
                  <Card id="insights" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Generated Insights</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Results from earlier analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentProject?.analysis ? (
                        <Tabs defaultValue="db">
                          <TabsList>
                            <TabsTrigger value="db">Database</TabsTrigger>
                            <TabsTrigger value="scaling">Scaling</TabsTrigger>
                            <TabsTrigger value="smart">Smart</TabsTrigger>
                            <TabsTrigger value="opt">Optimizations</TabsTrigger>
                            <TabsTrigger value="sec">Security</TabsTrigger>
                          </TabsList>
                          <TabsContent value="db" className="space-y-2">
                            {(currentProject.analysis.databaseRecommendations || []).slice(0, 5).map((r: any, i: number) => (
                              <div key={i} className="border rounded-md p-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{r.name}</div>
                                  {typeof r.score === 'number' && <Badge variant="secondary" className="text-xs">{r.score}%</Badge>}
                                </div>
                                {r.bestFor && <div className="text-xs text-gray-600">Best for: {r.bestFor}</div>}
                                {r.reasons && r.reasons.length > 0 && (
                                  <ul className="text-xs text-gray-600 list-disc pl-5 mt-1">
                                    {r.reasons.slice(0, 3).map((x: string, idx: number) => <li key={idx}>{x}</li>)}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </TabsContent>
                          <TabsContent value="scaling" className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Kpi icon={<Activity className="w-4 h-4" />} label="Expected load" valueLabel={currentProject.analysis.scalingInsights?.expectedLoad || 'Unknown'} />
                              <Kpi icon={<Network className="w-4 h-4" />} label="Read/Write" valueLabel={currentProject.analysis.scalingInsights?.readWriteRatio || '—'} />
                              <Kpi icon={<Layers className="w-4 h-4" />} label="Caching" valueLabel={currentProject.analysis.scalingInsights?.cachingStrategy || '—'} />
                            </div>
                            {Array.isArray(currentProject.analysis.scalingInsights?.indexingPriority) && currentProject.analysis.scalingInsights.indexingPriority.length > 0 && (
                              <div className="border rounded-md p-2">
                                <div className="text-sm font-medium mb-1">Indexing priorities</div>
                                <div className="flex flex-wrap gap-1">
                                  {currentProject.analysis.scalingInsights.indexingPriority.map((p: any, idx: number) => {
                                    const isObj = p && typeof p === 'object'
                                    const label = isObj
                                      ? `${p.table ?? p.field ?? 'Index'}${p.priority ? ` - ${p.priority}` : ''}`
                                      : String(p)
                                    const title = isObj && p.reason ? String(p.reason) : undefined
                                    return (
                                      <Badge key={idx} variant="outline" className="text-xs" title={title}>{label}</Badge>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="smart" className="space-y-2">
                            {(currentProject.analysis.smartRecommendations || []).slice(0, 10).map((s: any, i: number) => (
                              <div key={i} className="border rounded-md p-2">
                                <div className="text-sm font-medium">{s.title || s.name || `Recommendation ${i+1}`}</div>
                                {s.description && <div className="text-xs text-gray-600">{s.description}</div>}
                              </div>
                            ))}
                          </TabsContent>
                          <TabsContent value="opt" className="space-y-2">
                            {(currentProject.analysis.optimizationSuggestions || []).slice(0, 10).map((o: any, i: number) => (
                              <div key={i} className="border rounded-md p-2">
                                <div className="text-sm font-medium">{o.title || o.name || `Optimization ${i+1}`}</div>
                                {o.description && <div className="text-xs text-gray-600">{o.description}</div>}
                              </div>
                            ))}
                          </TabsContent>
                          <TabsContent value="sec" className="space-y-2">
                            {(currentProject.analysis.securityRecommendations || []).slice(0, 10).map((s: any, i: number) => (
                              <div key={i} className="border rounded-md p-2">
                                <div className="text-sm font-medium">{s.title || s.name || `Security item ${i+1}`}</div>
                                {s.description && <div className="text-xs text-gray-600">{s.description}</div>}
                              </div>
                            ))}
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-sm text-gray-500">No insights available.</div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card id="recommendations" className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Recommendations</CardTitle>
                      <CardDescription className="text-sm text-gray-600">AI and tool decisions overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="border rounded-md p-3">
                          <div className="text-sm font-medium mb-1">Tool selections</div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const tools = currentProject?.selectedTools
                              || (currentProject?.decisions?.decisions ? Object.fromEntries(
                                currentProject.decisions.decisions.map((d: any) => [d.id, d.selectedTool])
                              ) : null)
                              return tools ? (
                                Object.entries(tools).map(([k, v]) => (
                                  <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500">None selected yet</div>
                              )
                            })()}
                          </div>
                        </div>
                        <div className="border rounded-md p-3">
                          <div className="text-sm font-medium mb-1">Highlights</div>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            <li>{metrics.tables} tables with {metrics.fields} fields</li>
                            <li>~{metrics.endpoints} API endpoints</li>
                            <li>{metrics.components} components, {metrics.connections} connections</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Detailed sections (kept for power users) */}
<GeneratedSummary compact />
        </div>
      </main>
    </div>
  )
}

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
          <div key={i} className="border rounded-md p-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <div className="font-mono text-sm truncate" title={f.path}>{f.path}</div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => copy(f.content)} title="Copy">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {more > 0 && <div className="text-xs text-gray-500">+{more} more files</div>}
      <div className="pt-1">
        <Button variant="outline" size="sm" onClick={downloadBundle}><Download className="w-4 h-4 mr-1" /> Download ZIP</Button>
      </div>
    </div>
  )
}

function TimelineIcon({ type }: { type: 'schema' | 'endpoint' | 'deployment' | 'ai' }) {
  const cls = "w-4 h-4 text-gray-600"
  switch (type) {
    case 'schema':
      return <Database className={cls} />
    case 'endpoint':
      return <ListChecks className={cls} />
    case 'deployment':
      return <Rocket className={cls} />
    default:
      return <Clock className={cls} />
  }
}

function EnvStatusBadge({ env, deployment }: { env: 'development'|'staging'|'production'; deployment?: any }) {
  const isActive = deployment?.environment === env
  const status: string = isActive ? deployment?.status || 'deployed' : 'idle'
  const cls =
    status === 'deployed' || status === 'deploying'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'failed'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-gray-100 text-gray-700 border-gray-200'
  return <Badge variant="secondary" className={`text-xs ${cls}`}>{isActive ? status : 'idle'}</Badge>
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
