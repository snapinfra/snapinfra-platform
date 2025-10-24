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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Code, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Package, 
  Loader2,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { useAppContext } from "@/lib/app-context"
import type { Project } from "@/lib/app-context"

interface GeneratedFile {
  path: string
  content: string
  description: string
}

interface GeneratedCode {
  files: GeneratedFile[]
  instructions: string
  dependencies: string[]
}

interface CodeGenerationModalProps {
  children: React.ReactNode
}

export function CodeGenerationModal({ children }: CodeGenerationModalProps) {
  const { state } = useAppContext()
  const { currentProject } = state
  
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  
  // Form state
  const [framework, setFramework] = useState<string>('express')
  const [language, setLanguage] = useState<string>('typescript')
  const [includeAuth, setIncludeAuth] = useState(false)
  const [includeTests, setIncludeTests] = useState(false)

  const handleGenerate = async () => {
    if (!currentProject) return

    // Normalize schema to array format
    let normalizedSchema = currentProject.schema
    if (!Array.isArray(normalizedSchema)) {
      // If schema is an object with a tables property, extract it
      if (normalizedSchema && typeof normalizedSchema === 'object' && 'tables' in normalizedSchema) {
        normalizedSchema = (normalizedSchema as any).tables
      } else {
        normalizedSchema = []
      }
    }

    console.log('🔍 Current project before code generation:', {
      name: currentProject.name,
      hasSchema: !!currentProject.schema,
      schemaType: Array.isArray(currentProject.schema) ? 'array' : typeof currentProject.schema,
      normalizedSchemaLength: normalizedSchema.length,
      schemaSample: normalizedSchema.length > 0 ? normalizedSchema[0].name : 'No tables'
    })

    if (!normalizedSchema || normalizedSchema.length === 0) {
      setError('Project has no tables defined. Please add tables to your schema first.')
      return
    }

    setError(null)
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: {
            ...currentProject,
            schema: normalizedSchema // Use normalized schema
          },
          framework,
          language,
          includeAuth,
          includeTests,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedCode(data.data)
      } else {
        setError(data.error || 'Code generation failed')
        console.error('Code generation failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to generate code:', error)
      setError(
        error instanceof Error 
          ? error.message 
          : 'Network error. Please check your connection and try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyFile = async (filePath: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(filePath)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleDownloadZip = () => {
    if (!generatedCode) return
    
    // Create a simple download for now - in a real app you'd create a ZIP file
    const allFiles = generatedCode.files
      .map(file => `--- ${file.path} ---\n${file.content}\n\n`)
      .join('\n')
    
    const blob = new Blob([allFiles], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name || 'project'}-backend.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetModal = () => {
    setGeneratedCode(null)
    setCopiedFile(null)
  }

  if (!currentProject) {
    return (
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Project Selected</DialogTitle>
            <DialogDescription>
              Please create or select a project first to generate code.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetModal()
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generate Backend Code
          </DialogTitle>
          <DialogDescription>
            Generate production-ready backend code from your database schema.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          // Configuration Form
          <div className="space-y-6 py-4">
            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-md px-3 py-2 flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    handleGenerate()
                  }}
                  className="ml-3 h-7 text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Framework</label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="express">
                      <div className="flex items-center gap-2">
                        <span>Express.js</span>
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="fastapi">
                      <div className="flex items-center gap-2">
                        <span>FastAPI</span>
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="django">
                      <div className="flex items-center gap-2">
                        <span>Django</span>
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {framework === 'express' && (
                      <>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                      </>
                    )}
                    {framework === 'fastapi' && (
                      <SelectItem value="python">Python</SelectItem>
                    )}
                    {framework === 'django' && (
                      <SelectItem value="python">Python</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Additional Features</label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeAuth" 
                  checked={includeAuth} 
                  onCheckedChange={(checked) => setIncludeAuth(checked as boolean)} 
                />
                <label htmlFor="includeAuth" className="text-sm">
                  Include Authentication (JWT)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTests" 
                  checked={includeTests} 
                  onCheckedChange={(checked) => setIncludeTests(checked as boolean)} 
                />
                <label htmlFor="includeTests" className="text-sm">
                  Include Test Suite
                </label>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Project Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Project:</strong> {currentProject.name}</p>
                <p><strong>Tables:</strong> {currentProject.schema.length}</p>
                <p><strong>Database:</strong> {currentProject.database.type}</p>
                <p><strong>Endpoints:</strong> ~{currentProject.schema.length * 5} API routes</p>
              </div>
            </div>
          </div>
        ) : (
          // Generated Code Display
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-600">
                  Code Generated Successfully!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {generatedCode.files.length} files
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetModal()
                  }}
                  className="flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
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
                    {generatedCode.files.map((file, index) => (
                      <div key={index} className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-sm">{file.path}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyFile(file.path, file.content)}
                            className="flex items-center gap-2"
                          >
                            {copiedFile === file.path ? (
                              <Check className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-3">
                          <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                          <div className="h-40 w-full border rounded bg-gray-900 text-white overflow-auto">
                            <pre className="p-3 text-xs whitespace-pre min-w-max">
                              <code>{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="instructions">
                <div className="border rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">{generatedCode.instructions}</pre>
                </div>
              </TabsContent>
              
              <TabsContent value="dependencies">
                <div className="grid grid-cols-2 gap-2">
                  {generatedCode.dependencies.map((dep, index) => (
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
          {!generatedCode ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || currentProject.schema.length === 0}
                className="flex items-center gap-2"
              >
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Code
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={resetModal}>
                Generate Again
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}