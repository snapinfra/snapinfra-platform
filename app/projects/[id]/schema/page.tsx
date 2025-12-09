"use client"

import { useState, useEffect } from "react"
import { ReactFlowSchemaEditor } from "@/components/reactflow/reactflow-schema-editor"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Plus, Rocket, Info, AlertCircle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useAppContext } from "@/lib/appContext/app-context"
import { getProjectById } from "@/lib/api-client"
import { DeploymentModal } from "@/components/deployment-modal"
import Link from "next/link"

export default function SchemaEditor() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [isLoading, setIsLoading] = useState(false)

  // Load project if not in context (e.g., on page refresh)
  useEffect(() => {
    if (!projectId) return
    if (!currentProject || currentProject.id !== projectId) {
      setIsLoading(true)
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
        .finally(() => setIsLoading(false))
    }
  }, [projectId, currentProject, dispatch, router])

  // Normalize schema to array format (AWS returns { tables: [...] })
  const normalizedSchema = currentProject?.schema 
    ? (Array.isArray(currentProject.schema) 
        ? currentProject.schema 
        : currentProject.schema?.tables || [])
    : []

  const handleUpdateTable = (updatedTable: any) => {
    if (!currentProject) return
    
    const updatedSchema = normalizedSchema.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    )
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleDeleteTable = (tableId: string) => {
    if (!currentProject) return
    
    const updatedSchema = normalizedSchema.filter(table => table.id !== tableId)
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleDuplicateTable = (table: any) => {
    if (!currentProject) return
    
    const newTable = {
      ...table,
      id: `${table.id}-copy-${Date.now()}`,
      name: `${table.name}_copy`,
      position: {
        x: (table.position?.x || 0) + 50,
        y: (table.position?.y || 0) + 50
      }
    }
    
    const updatedSchema = [...normalizedSchema, newTable]
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  // Show loading state while fetching project
  if (isLoading || !currentProject) {
    return (
      <EnterpriseDashboardLayout
        title="Schema Editor"
        description="Visual database schema designer"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Schema" },
        ]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </EnterpriseDashboardLayout>
    )
  }

  if (normalizedSchema.length === 0) {
    return (
      <EnterpriseDashboardLayout
        title={`${currentProject.name} - Schema Editor`}
        description="Visual database schema designer"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: currentProject.name, href: `/projects/${projectId}` },
          { label: "Schema" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                currentProject.status === 'deployed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                currentProject.status === 'building' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                currentProject.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {currentProject.status}
            </Badge>
          </div>
        }
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No schema found for this project. Please complete the onboarding process to generate a database schema.
          </AlertDescription>
        </Alert>
      </EnterpriseDashboardLayout>
    )
  }

  return (
    <EnterpriseDashboardLayout
      title={currentProject ? `${currentProject.name} - Schema Editor` : "Schema Editor"}
      description="Visual database schema designer"
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: currentProject?.name || "Project", href: `/projects/${projectId}` },
        { label: "Schema" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {currentProject && (
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                currentProject.status === 'deployed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                currentProject.status === 'building' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                currentProject.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {currentProject.status}
            </Badge>
          )}
          {currentProject && (
            <DeploymentModal>
              <Button size="sm">
                <Rocket className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </DeploymentModal>
          )}
        </div>
      }
    >
      <div className="h-[calc(100vh-200px)]">
        <ReactFlowSchemaEditor 
          onTableEdit={handleUpdateTable}
          onTableDelete={handleDeleteTable}
          onTableDuplicate={handleDuplicateTable}
        />
      </div>
    </EnterpriseDashboardLayout>
  )
}
