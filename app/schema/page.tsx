"use client"

import { useState } from "react"
import { ReactFlowSchemaEditor } from "@/components/reactflow/reactflow-schema-editor"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Plus, Rocket, Info, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/app-context"
import { DeploymentModal } from "@/components/deployment-modal"
import Link from "next/link"

export default function SchemaEditor() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { currentProject } = state

  const handleUpdateTable = (updatedTable: any) => {
    if (!currentProject) return
    
    const updatedSchema = currentProject.schema.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    )
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleDeleteTable = (tableId: string) => {
    if (!currentProject) return
    
    const updatedSchema = currentProject.schema.filter(table => table.id !== tableId)
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
    
    const updatedSchema = [...currentProject.schema, newTable]
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  // Check if project has no schema
  if (!currentProject) {
    return (
      <EnterpriseDashboardLayout
        title="Schema Editor"
        description="Visual database schema designer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Schema" },
        ]}
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please create or select a project to view its schema.
          </AlertDescription>
        </Alert>
      </EnterpriseDashboardLayout>
    )
  }

  if (!currentProject.schema || currentProject.schema.length === 0) {
    return (
      <EnterpriseDashboardLayout
        title={`${currentProject.name} - Schema Editor`}
        description="Visual database schema designer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: currentProject.name, href: "/dashboard" },
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
        { label: "Dashboard", href: "/dashboard" },
        { label: currentProject?.name || "Project", href: "/dashboard" },
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
