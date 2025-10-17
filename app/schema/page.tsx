"use client"

import { useState } from "react"
import { ReactFlowSchemaEditor } from "@/components/reactflow/reactflow-schema-editor"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Plus, Rocket } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/app-context"
import { DeploymentModal } from "@/components/deployment-modal"
import Link from "next/link"

export default function SchemaEditor() {
  const router = useRouter()
  const { state } = useAppContext()
  const { currentProject } = state

  const handleUpdateTable = (updatedTable: any) => {
    // Handle table updates - implement as needed
    console.log("Update table:", updatedTable)
  }

  const handleDeleteTable = (tableId: string) => {
    // Handle table deletion - implement as needed
    console.log("Delete table:", tableId)
  }

  const handleDuplicateTable = (table: any) => {
    // Handle table duplication - implement as needed
    console.log("Duplicate table:", table)
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
