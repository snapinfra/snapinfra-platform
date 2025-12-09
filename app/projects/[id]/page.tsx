"use client"

import React, { useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useAppContext } from "@/lib/appContext/app-context"
import { getProjectById } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Database, Layers, Code2, Rocket, CheckCircle2, ArrowRight, Clock, GitBranch, Users, Settings, TrendingUp, Package, FileCode, Server } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ProjectPage() {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    if (!projectId) return
    if (!currentProject || currentProject.id !== projectId) {
      getProjectById(projectId)
        .then((project) => {
          // Normalize schema format: AWS returns { tables: [...] }, but app expects array
          const normalizedProject = {
            ...project,
            schema: Array.isArray(project.schema)
              ? project.schema
              : (project.schema?.tables || [])
          }
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: normalizedProject })
        })
        .catch(() => router.push('/projects'))
    }
  }, [projectId, currentProject, dispatch, router])

  const metrics = useMemo(() => {
    const schemaArray = Array.isArray(currentProject?.schema)
      ? currentProject?.schema || []
      : currentProject?.schema?.tables || []
    const tables = schemaArray.length || 0
    const fields = schemaArray.reduce((acc: number, t: any) => acc + (t.fields?.length || 0), 0) || 0
    const endpoints = currentProject?.endpoints?.length || 0
    const components = (currentProject as any)?.architecture?.nodes?.length || 0
    const connections = (currentProject as any)?.architecture?.edges?.length || 0
    const codeFiles = currentProject?.generatedCode?.files?.length || 0
    const iacFiles = currentProject?.generatedIaC?.files?.length || 0
    
    // Calculate completion percentage
    const completionSteps = [
      tables > 0,
      endpoints > 0,
      components > 0,
      codeFiles > 0,
      iacFiles > 0
    ]
    const completionPercentage = Math.round((completionSteps.filter(Boolean).length / completionSteps.length) * 100)
    
    return { tables, fields, endpoints, components, connections, codeFiles, iacFiles, completionPercentage }
  }, [currentProject])

  if (!currentProject) {
    return (
      <EnterpriseDashboardLayout title="Project" description="Loading project...">
        <div className="p-6 text-sm text-gray-600">Loading...</div>
      </EnterpriseDashboardLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300'
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'building': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'deployed': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'error': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <EnterpriseDashboardLayout
      title={currentProject.name}
      description={currentProject.description || 'Project overview'}
      breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: currentProject.name }]}
      actions={
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(currentProject.status || 'draft')}>
            {currentProject.status || 'draft'}
          </Badge>
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Project Metrics */}
        <Card className="border-2 border-gray-200 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Project Metrics</h3>
                  <p className="text-xs text-gray-500">Current status and statistics</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Completion</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${metrics.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{metrics.completionPercentage}%</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-gray-600">Tables</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.tables}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.fields} total fields</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-gray-600">Endpoints</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.endpoints}</p>
                <p className="text-xs text-gray-500 mt-1">API routes</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-gray-600">Components</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.components}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.connections} connections</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-gray-600">Code Files</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.codeFiles + metrics.iacFiles}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.codeFiles} code, {metrics.iacFiles} IaC</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-medium text-gray-600">Database</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{currentProject?.database?.type?.toUpperCase() || 'POSTGRESQL'}</p>
                <p className="text-xs text-gray-500 mt-1">Primary DB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/projects/${projectId}/schema`}>
              <Card className="border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">Schema Editor</h3>
                  <p className="text-xs text-gray-500 mb-3">Design database structure</p>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="font-medium">{metrics.tables} tables</span>
                    <span>•</span>
                    <span>{metrics.fields} fields</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/projects/${projectId}/architecture`}>
              <Card className="border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                      <Layers className="w-6 h-6 text-green-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1">Architecture</h3>
                  <p className="text-xs text-gray-500 mb-3">Visualize system design</p>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="font-medium">{metrics.components} components</span>
                    <span>•</span>
                    <span>{metrics.connections} links</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/projects/${projectId}/code-generation`}>
              <Card className="border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <Code2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">Code Generation</h3>
                  <p className="text-xs text-gray-500 mb-3">Generate backend code</p>
                  <div className="flex items-center gap-2 text-xs">
                    {metrics.codeFiles > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">{metrics.codeFiles} files generated</span>
                      </>
                    ) : (
                      <span className="text-gray-600">Ready to generate</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/projects/${projectId}/deployments`}>
              <Card className="border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                      <Rocket className="w-6 h-6 text-orange-600" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">Deployments</h3>
                  <p className="text-xs text-gray-500 mb-3">Deploy to cloud</p>
                  <div className="flex items-center gap-2 text-xs">
                    {metrics.iacFiles > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">IaC ready</span>
                      </>
                    ) : (
                      <span className="text-gray-600">Configure deployment</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Project Info */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock className="w-3 h-3" />
                  Created
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDistanceToNow(new Date(currentProject.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <GitBranch className="w-3 h-3" />
                  Last Updated
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDistanceToNow(new Date(currentProject.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Users className="w-3 h-3" />
                  Project ID
                </div>
                <p className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {currentProject.id.slice(0, 16)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnterpriseDashboardLayout>
  )
}