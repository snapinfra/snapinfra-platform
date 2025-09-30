"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Boxes,
  Download, 
  Copy, 
  Check, 
  FileText, 
  Package, 
  Loader2,
  Cloud,
  Wrench
} from "lucide-react"
import { useAppContext } from "@/lib/app-context"

interface GeneratedFile { path: string; content: string; description?: string }
interface GeneratedResult { files: GeneratedFile[]; instructions: string; dependencies: string[] }

export function IacGenerationModal({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext()
  const { currentProject } = state
  
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  // Form state
  const [targets, setTargets] = useState<Record<string, boolean>>({
    terraform: true,
    "aws-cdk": true,
    "docker-compose": true,
    kubernetes: false,
    helm: false,
    "azure-bicep": false,
    "gcp-terraform": false,
  })
  const [cloud, setCloud] = useState<'aws' | 'gcp' | 'azure' | 'multi'>('aws')
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development')

  const handleGenerate = async () => {
    if (!currentProject) return
    const selectedTargets = Object.entries(targets).filter(([_, v]) => v).map(([k]) => k)
    if (selectedTargets.length === 0) {
      setError('Select at least one target')
      return
    }
    setError(null)
    setIsGenerating(true)
    try {
      const payload = {
        project: currentProject,
        options: {
          targets: Object.entries(targets).filter(([_, v]) => v).map(([k]) => k),
          cloud,
          environment,
        }
      }
      const resp = await fetch('/api/generate-iac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'IaC generation failed')
        console.error('IaC generation failed:', data.error)
      }
    } catch (e) {
      console.error('Failed to generate IaC:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (path: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  const handleDownloadBundle = () => {
    if (!result) return
    const bundle = result.files.map(f => `--- ${f.path} ---\n${f.content}\n\n`).join('\n')
    const blob = new Blob([bundle], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name || 'project'}-iac.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setResult(null)
    setCopiedPath(null)
  }

  if (!currentProject) {
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Project Selected</DialogTitle>
            <DialogDescription>Select or create a project to generate infrastructure code.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="w-5 h-5" />
            Generate Infrastructure-as-Code
          </DialogTitle>
          <DialogDescription>
            Production-ready Terraform, AWS CDK, Kubernetes, or Docker Compose based on your project.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Cloud className="w-4 h-4" /> Cloud</label>
                <Select value={cloud} onValueChange={(v: any) => setCloud(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="gcp">GCP</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                    <SelectItem value="multi">Multi-cloud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Wrench className="w-4 h-4" /> Environment</label>
                <Select value={environment} onValueChange={(v: any) => setEnvironment(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Targets</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(targets).map(key => (
                  <label key={key} className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
                    <Checkbox checked={targets[key]} onCheckedChange={(v) => setTargets(prev => ({...prev, [key]: Boolean(v)}))} />
                    <span className="text-sm capitalize">{key.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Project Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Project:</strong> {currentProject.name}</p>
                <p><strong>Tables:</strong> {currentProject.schema.length}</p>
                <p><strong>Database:</strong> {currentProject.database.type}</p>
                <p><strong>Architecture:</strong> {currentProject.architecture ? `${currentProject.architecture.nodes.length} components` : 'N/A'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">IaC Generated</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{result.files.length} files</Badge>
                <Button variant="outline" size="sm" onClick={handleDownloadBundle} className="flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            </div>

            <Tabs defaultValue="files" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="instructions">Setup</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                <ScrollArea className="h-[400px] w-full border rounded-md">
                  <div className="space-y-4 p-4">
                    {result.files.map((file, idx) => (
                      <div key={idx} className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-sm">{file.path}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(file.path, file.content)} className="flex items-center gap-2">
                            {copiedPath === file.path ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="p-3">
                          {file.description && <p className="text-sm text-gray-600 mb-2">{file.description}</p>}
                          <div className="h-40 w-full border rounded bg-gray-900 text-white overflow-auto">
                            <pre className="p-3 text-xs whitespace-pre min-w-max"><code>{file.content}</code></pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="instructions">
                <div className="border rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">{result.instructions}</pre>
                </div>
              </TabsContent>

              <TabsContent value="dependencies">
                <div className="grid grid-cols-2 gap-2">
                  {result.dependencies.map((dep, index) => (
                    <Badge key={index} variant="secondary" className="justify-center">
                      <Package className="w-3 h-3 mr-1" />
                      {dep}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={isGenerating || currentProject.schema.length === 0} className="flex items-center gap-2">
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate IaC
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={reset}>Generate Again</Button>
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
