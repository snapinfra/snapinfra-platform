"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppContext } from "@/lib/app-context"
import { updateProject as updateProjectAPI, getProjectById } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { GenerationProgress } from "@/components/generation-progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Code2, 
  Download, 
  Copy,
  Database,
  Shield,
  Globe,
  FileText,
  RefreshCw,
  Rocket,
  CheckCircle2
} from "lucide-react"


export default function CodeGenerationPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')

  // Load project if not in context (e.g., on page refresh)
  useEffect(() => {
    if (!projectId) return
    if (!currentProject || currentProject.id !== projectId) {
      getProjectById(projectId)
        .then((project) => {
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

  async function generateAll() {
    if (!currentProject) return
    
    // Normalize schema to array format (AWS returns { tables: [...] })
    const normalizedSchema = Array.isArray(currentProject.schema) 
      ? currentProject.schema 
      : currentProject.schema?.tables || []
    
    if (normalizedSchema.length === 0) {
      alert('Project has no tables. Please add tables to your schema first.')
      return
    }
    
    setIsGenerating(true)
    setGenerationProgress(5)
    setGenerationMessage('Validating project schema...')
    
    // Create normalized project with schema as array
    const normalizedProject = {
      ...currentProject,
      schema: normalizedSchema
    }
    
    try {
      // Simulate progressive updates
      const updates = [
        { progress: 10, message: 'Generating backend configuration files...' },
        { progress: 20, message: 'Creating database models...' },
        { progress: 35, message: 'Building service layer...' },
        { progress: 50, message: 'Setting up API routes...' },
        { progress: 60, message: 'Analyzing infrastructure requirements...' },
        { progress: 75, message: 'Generating Terraform configurations...' },
        { progress: 85, message: 'Creating Docker Compose files...' },
        { progress: 95, message: 'Finalizing code generation...' }
      ]
      
      let updateIndex = 0
      const updateInterval = setInterval(() => {
        if (updateIndex < updates.length) {
          setGenerationProgress(updates[updateIndex].progress)
          setGenerationMessage(updates[updateIndex].message)
          updateIndex++
        }
      }, 8000)
      const resp = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project: normalizedProject, 
          framework: 'express', 
          language: 'typescript', 
          includeAuth: false, 
          includeTests: false,
          options: {
            iacTargets: ['terraform', 'docker-compose'],
            environment: 'development'
          }
        })
      })
      const data = await resp.json()
      clearInterval(updateInterval)
      
      if (data?.success) {
        setGenerationProgress(100)
        setGenerationMessage('Generation complete!')
        const generatedCode = data.data.generatedCode
        const generatedIaC = data.data.generatedIaC
        
        // Update local state with both results
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode, generatedIaC } as any })
        
        // Save to AWS (project ID is the backend ID)
        try {
          await updateProjectAPI(currentProject.id, { generatedCode, generatedIaC })
          console.log('✅ Generated code and IaC saved to AWS')
        } catch (awsError) {
          console.warn('⚠️ Failed to save generated files to AWS:', awsError)
        }
      } else {
        // Handle failure - update state with error
        const generatedCode = data?.data?.generatedCode || { files: [], instructions: '', dependencies: [], success: false, error: 'Code generation failed' }
        const generatedIaC = data?.data?.generatedIaC || { files: [], instructions: '', dependencies: [], success: false, error: 'IaC generation failed' }
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode, generatedIaC } as any })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      const generatedCode = { files: [], instructions: '', dependencies: [], success: false, error: msg }
      const generatedIaC = { files: [], instructions: '', dependencies: [], success: false, error: msg }
      dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode, generatedIaC } as any })
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
        setGenerationMessage('')
      }, generationProgress === 100 ? 2000 : 0)
    }
  }

  return (
    <EnterpriseDashboardLayout
      title="Code Generation"
      description="Generate production-ready backend code from your schema"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Projects", href: "/projects" },
        { label: currentProject?.name || "Project", href: `/projects/${projectId}` },
        { label: "Code Generation" },
      ]}
    >
      <div className="space-y-8">

        {/* Single Unified Card with Generate Button in Header */}
        {currentProject && (
          <Card id="generated-code" className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4 bg-white border-b border-gray-200">
              <div className="space-y-4">
                {/* Title and Action Row */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-blue-600" />
                      Generated Code
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Backend API + Infrastructure as Code (Terraform, Docker)
                    </CardDescription>
                  </div>
                  {(currentProject?.generatedCode?.files?.length || currentProject?.generatedIaC?.files?.length) ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                      {(currentProject.generatedCode?.files?.length || 0) + (currentProject.generatedIaC?.files?.length || 0)} files
                    </Badge>
                  ) : (
                    <Button 
                      onClick={generateAll} 
                      disabled={isGenerating}
                      size="default"
                      className="shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Generate Code
                    </Button>
                  )}
                </div>

                {/* Progress Bar (shown when generating) */}
                {isGenerating && (
                  <div className="space-y-2 pt-2 border-t border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700">
                          {generationMessage || "Processing your request..."}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">{Math.round(generationProgress)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">This may take 1-2 minutes</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              {(() => {
                const hasBackend = currentProject?.generatedCode?.files?.length > 0
                const hasIaC = currentProject?.generatedIaC?.files?.length > 0
                const backendFailed = currentProject?.generatedCode?.success === false
                const iacFailed = currentProject?.generatedIaC?.success === false
                const hasAny = hasBackend || hasIaC
                const hasFailed = backendFailed || iacFailed

                if (!hasAny && !hasFailed) {
                  return (
                    <div className="border border-dashed border-gray-300 rounded-lg p-12">
                      <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Code2 className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-gray-900">No Code Generated Yet</h4>
                          <p className="text-sm text-gray-500 max-w-md">Click the button above to generate production-ready backend API and infrastructure code</p>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    {/* Success Banner */}
                    {hasAny && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Generation Complete</p>
                          <p className="text-xs text-green-700 mt-0.5">
                            {hasBackend && hasIaC && "Backend code and infrastructure files generated"}
                            {hasBackend && !hasIaC && "Backend code generated"}
                            {!hasBackend && hasIaC && "Infrastructure files generated"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error Banner */}
                    {hasFailed && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium text-red-900">Partial Generation Failure</p>
                            {backendFailed && (
                              <p className="text-xs text-red-700">Backend: {currentProject.generatedCode.error}</p>
                            )}
                            {iacFailed && (
                              <p className="text-xs text-red-700">Infrastructure: {currentProject.generatedIaC.error}</p>
                            )}
                            <Button variant="outline" size="sm" onClick={generateAll} className="mt-2">
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Combined File List */}
                    {hasAny && (() => {
                      const allFiles = [
                        ...((currentProject.generatedCode?.files || []).map((f: any) => ({ ...f, category: 'Backend' }))),
                        ...((currentProject.generatedIaC?.files || []).map((f: any) => ({ ...f, category: 'IaC' })))
                      ]
                      return <GeneratedFilesList files={allFiles} fileType="all" projectName={currentProject.name} />
                    })()}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {currentProject && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database Tables</p>
                    <p className="text-2xl font-bold text-blue-600">{(() => {
                      const schemaArray = Array.isArray(currentProject?.schema) 
                        ? currentProject.schema 
                        : currentProject?.schema?.tables || []
                      return schemaArray.length
                    })()}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                    <p className="text-2xl font-bold text-green-600">{(() => {
                      const schemaArray = Array.isArray(currentProject?.schema) 
                        ? currentProject.schema 
                        : currentProject?.schema?.tables || []
                      return schemaArray.length * 5
                    })()}</p>
                  </div>
                  <Globe className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Est. Lines of Code</p>
                    <p className="text-2xl font-bold text-purple-600">{(() => {
                      const schemaArray = Array.isArray(currentProject?.schema) 
                        ? currentProject.schema 
                        : currentProject?.schema?.tables || []
                      return schemaArray.length * 150
                    })()}</p>
                  </div>
                  <Code2 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </EnterpriseDashboardLayout>
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
