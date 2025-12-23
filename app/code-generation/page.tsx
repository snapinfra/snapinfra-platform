"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/appContext/app-context"
import { updateProject as updateProjectAPI } from "@/lib/api-client"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isGeneratingIac, setIsGeneratingIac] = useState(false)

  async function retryGenerate(kind: 'code'|'iac') {
    if (!currentProject) return
    
    // Normalize schema to array format (AWS returns { tables: [...] })
    const normalizedSchema = Array.isArray(currentProject.schema) 
      ? currentProject.schema 
      : currentProject.schema?.tables || []
    
    if (normalizedSchema.length === 0) {
      alert('Project has no tables. Please add tables to your schema first.')
      return
    }
    
    if (kind === 'code') setIsGeneratingCode(true)
    else setIsGeneratingIac(true)
    
    // Create normalized project with schema as array
    const normalizedProject = {
      ...currentProject,
      schema: normalizedSchema
    }
    
    try {
      if (kind === 'code') {
        const resp = await fetch('/api/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: normalizedProject, framework: 'express', language: 'typescript', includeAuth: false, includeTests: false })
        })
        const data = await resp.json()
        const generatedCode = data?.success 
          ? data.data 
          : { files: [], instructions: '', dependencies: [], success: false, error: data?.error || 'Code generation failed' }
        
        // Update local state
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode } as any })
        
        // Save to AWS (project ID is the backend ID)
        try {
          await updateProjectAPI(currentProject.id, { generatedCode })
          console.log('✅ Generated code saved to AWS')
        } catch (awsError) {
          console.warn('⚠️ Failed to save generated code to AWS:', awsError)
        }
      } else {
        const resp = await fetch('/api/generate-iac', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: normalizedProject, options: { targets: ['terraform','aws-cdk','docker-compose'], cloud: 'aws', environment: 'development' } })
        })
        const data = await resp.json()
        const generatedIaC = data?.success
          ? data.data
          : { files: [], instructions: '', dependencies: [], success: false, error: data?.error || 'IaC generation failed' }
        
        // Update local state
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedIaC } as any })
        
        // Save to AWS (project ID is the backend ID)
        try {
          await updateProjectAPI(currentProject.id, { generatedIaC })
          console.log('✅ Generated IaC saved to AWS')
        } catch (awsError) {
          console.warn('⚠️ Failed to save generated IaC to AWS:', awsError)
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      if (kind === 'code') {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedCode: { files: [], instructions: '', dependencies: [], success: false, error: msg } } as any })
      } else {
        dispatch({ type: 'UPDATE_PROJECT', payload: { id: currentProject.id, generatedIaC: { files: [], instructions: '', dependencies: [], success: false, error: msg } } as any })
      }
    } finally {
      if (kind === 'code') setIsGeneratingCode(false)
      else setIsGeneratingIac(false)
    }
  }

  return (
    <EnterpriseDashboardLayout
      title="Code Generation"
      description="Generate production-ready backend code from your schema"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Code Generation" },
      ]}
    >
      <div className="space-y-8">

        {/* Backend Code Section */}
        {currentProject && (
          <Card id="backend-code" className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Backend Code
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 mt-1">Production-ready API endpoints and models</CardDescription>
                </div>
                {currentProject?.generatedCode?.files?.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                    {currentProject.generatedCode.files.length} files
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              {isGeneratingCode ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-900">Generating Backend Code</p>
                    <p className="text-xs text-gray-500">Analyzing schema and creating API endpoints...</p>
                  </div>
                </div>
              ) : currentProject?.generatedCode?.files?.length ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Code Generated Successfully</span>
                  </div>
                  <GeneratedFilesList files={currentProject.generatedCode.files} fileType="code" projectName={currentProject.name} />
                </div>
              ) : currentProject?.generatedCode?.success === false ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-900">Generation Failed</p>
                        <p className="text-xs text-red-700">{currentProject.generatedCode.error || 'Unknown error occurred'}</p>
                        <Button variant="outline" size="sm" onClick={() => retryGenerate('code')} className="mt-2">
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8">
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Code2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900">No Backend Code Yet</h4>
                      <p className="text-xs text-gray-500 max-w-sm">Generate production-ready backend code with API endpoints, models, and database configuration based on your schema.</p>
                    </div>
                    <div className="pt-2">
                      <Button 
                        onClick={() => retryGenerate('code')} 
                        size="sm"
                        className="shadow-sm"
                      >
                        <Code2 className="w-4 h-4 mr-2" />
                        Generate Backend Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Infrastructure as Code Section */}
        {currentProject && (
          <Card id="infrastructure" className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Infrastructure as Code
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 mt-1">Terraform, AWS CDK, and Docker configurations</CardDescription>
                </div>
                {currentProject?.generatedIaC?.files?.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                    {currentProject.generatedIaC.files.length} files
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              {isGeneratingIac ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-900">Generating Infrastructure Code</p>
                    <p className="text-xs text-gray-500">Creating Terraform, CDK, and Docker configurations...</p>
                  </div>
                </div>
              ) : currentProject?.generatedIaC?.files?.length ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Infrastructure Code Generated</span>
                  </div>
                  <GeneratedFilesList files={currentProject.generatedIaC.files} fileType="iac" projectName={currentProject.name} />
                </div>
              ) : currentProject?.generatedIaC?.success === false ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-900">Generation Failed</p>
                        <p className="text-xs text-red-700">{currentProject.generatedIaC.error || 'Unknown error occurred'}</p>
                        <Button variant="outline" size="sm" onClick={() => retryGenerate('iac')} className="mt-2">
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8">
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Rocket className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900">No Infrastructure Code Yet</h4>
                      <p className="text-xs text-gray-500 max-w-sm">Generate Infrastructure-as-Code including Terraform, AWS CDK, and Docker Compose configurations for deployment.</p>
                    </div>
                    <div className="pt-2">
                      <Button 
                        onClick={() => retryGenerate('iac')} 
                        size="sm"
                        className="shadow-sm"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Generate Infrastructure Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
