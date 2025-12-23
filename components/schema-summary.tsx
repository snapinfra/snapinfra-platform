"use client"

import { useAppContext } from "@/lib/appContext/app-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeGenerationModal } from "./code-generation-modal"
import { DeploymentModal } from "./deployment-modal"
import { IacGenerationModal } from "./iac-generation-modal"
import { TableSchema, DatabaseType } from "@/lib/appContext/app-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Database,
  Settings,
  Code,
  Activity,
  Eye,
  Sparkles,
  ExternalLink,
  Layers,
  BarChart3,
  Rocket,
  Edit,
  Key,
  Link2,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function SchemaSummary() {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const router = useRouter()

  const handleCreateTable = () => {
    const newTable: TableSchema = {
      id: `table_${Date.now()}`,
      name: `table_${(currentProject?.schema.length || 0) + 1}`,
      description: 'New table',
      fields: [
        {
          id: `field_${Date.now()}`,
          name: 'id',
          type: 'UUID',
          isPrimary: true,
          isRequired: true,
          isUnique: true,
          description: 'Primary key'
        }
      ],
      relationships: [],
      indexes: [{ name: `${`table_${(currentProject?.schema.length || 0) + 1}`}_pkey`, fields: ['id'], isUnique: true }],
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      estimatedRows: 0
    }
    
    const updatedSchema = [...(currentProject?.schema || []), newTable]
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleUpdateTable = (updatedTable: TableSchema) => {
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

  const handleDuplicateTable = (table: TableSchema) => {
    const duplicatedTable: TableSchema = {
      ...table,
      id: `table_${Date.now()}`,
      name: `${table.name}_copy`,
      fields: table.fields.map(field => ({
        ...field,
        id: `field_${Date.now()}_${field.name}`
      }))
    }
    
    const updatedSchema = [...(currentProject?.schema || []), duplicatedTable]
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleDatabaseChange = (dbType: DatabaseType) => {
    if (currentProject?.database) {
      dispatch({ 
        type: 'UPDATE_DATABASE', 
        payload: { ...currentProject.database, type: dbType } 
      })
    }
  }

  const getFieldIcon = (field: any) => {
    if (field.isPrimary) return <Key className="w-3 h-3 text-yellow-600" />
    if (field.isForeignKey) return <Link2 className="w-3 h-3 text-blue-600" />
    if (field.hasIndex) return <Zap className="w-3 h-3 text-blue-600" />
    return null
  }

  // Show empty state if no project
  if (!currentProject) {
    return (
      <div className="h-full w-full border-l border-border bg-white flex flex-col items-center justify-center min-h-0">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Database className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">Ready to Build?</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Start chatting with RhinoAI to generate your database schema and API endpoints. 
            Just describe what you want to build!
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
              <p className="text-sm font-medium text-gray-900 mb-1">Ã°Å¸â€™Â¬ Example prompts:</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-700">"Build a social media app with users and posts"</p>
                <p className="text-xs text-gray-700">"Create an e-commerce backend with products and orders"</p>
                <p className="text-xs text-gray-700">"I need a blog CMS with categories and tags"</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full lg:border-l border-border bg-gray-50 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-4 flex-shrink-0">
        <div className="space-y-3 sm:space-y-4">
          {/* Text Row */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">Database Schema</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed hidden sm:block">Manage tables, fields, and relationships</p>
            </div>
          </div>
          
          {/* Buttons Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 text-xs"
            >
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white text-xs sm:text-sm px-2 sm:px-3">
                  <Settings className="h-3 w-3 mr-1 sm:mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Schema
                </DropdownMenuItem>
                <CodeGenerationModal>
                  <DropdownMenuItem className="text-sm">
                    <Code className="mr-2 h-4 w-4" />
                    Generate Code
                  </DropdownMenuItem>
                </CodeGenerationModal>
                <DropdownMenuItem className="text-sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview API
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 sm:p-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* Schema Overview Card */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-md flex items-center justify-center">
                      <Layers className="w-3 h-3 text-blue-600" />
                    </div>
                    Schema Overview
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    Current database structure and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-blue-700">{currentProject.schema.length}</p>
                          <p className="text-xs font-medium text-blue-600 mt-1">Tables</p>
                        </div>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 rounded-md flex items-center justify-center">
                          <Database className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-blue-700">
                            {currentProject.schema.reduce((acc, table) => acc + table.fields.length, 0)}
                          </p>
                          <p className="text-xs font-medium text-blue-600 mt-1">Fields</p>
                        </div>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 rounded-md flex items-center justify-center">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentProject.database && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Database</h4>
                        <Badge variant="outline" className="bg-white text-xs">
                          {currentProject.database.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 mb-2 sm:mb-3 leading-relaxed">
                        {currentProject.database.reasoning}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Confidence:</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                          {Math.round((currentProject.database.confidence || 0.9) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Schema Editor Button */}
                  <Button 
                    onClick={() => router.push('/schema')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs sm:text-sm py-2"
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Open Schema Editor
                  </Button>
                </CardContent>
              </Card>

              {/* Tables List */}
              {currentProject.schema.length > 0 && (
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-md flex items-center justify-center">
                        <Database className="w-3 h-3 text-blue-600" />
                      </div>
                      Tables ({currentProject.schema.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="grid gap-2 sm:gap-3">
                      {currentProject.schema.map((table, index) => (
                        <div key={table.id} className="border border-gray-200 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs sm:text-sm text-gray-900 truncate mr-2">{table.name}</h4>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {table.fields.length} fields
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{table.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {table.fields.slice(0, 2).map((field) => (
                              <div key={field.id} className="flex items-center gap-1 bg-gray-100 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
                                {getFieldIcon(field)}
                                <span className="text-xs text-gray-700 truncate">{field.name}</span>
                                <span className="text-xs text-gray-500 hidden sm:inline">({field.type})</span>
                              </div>
                            ))}
                            {table.fields.length > 2 && (
                              <div className="bg-gray-100 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
                                <span className="text-xs text-gray-500">+{table.fields.length - 2} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 rounded-md flex items-center justify-center">
                      <Rocket className="w-3 h-3 text-purple-600" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <CodeGenerationModal>
                      <Button variant="outline" className="justify-center sm:justify-start text-xs sm:text-sm py-2">
                        <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Generate Code
                      </Button>
                    </CodeGenerationModal>
                    <IacGenerationModal>
                      <Button variant="outline" className="justify-center sm:justify-start text-xs sm:text-sm py-2">
                        <Layers className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Generate IaC
                      </Button>
                    </IacGenerationModal>
                    <DeploymentModal>
                      <Button variant="outline" className="justify-center sm:justify-start text-xs sm:text-sm py-2">
                        <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Deploy Project
                      </Button>
                    </DeploymentModal>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}