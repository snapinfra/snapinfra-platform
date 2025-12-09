"use client"

import { useAppContext } from "@/lib/appContext/app-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableManagementModal } from "./table-management-modal"
import { CodeGenerationModal } from "./code-generation-modal"
import { InteractiveSchemaDiagram } from "./interactive-schema-diagram"
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
} from "lucide-react"

export function SchemaPreview() {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state

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
    <div className="h-full w-full border-l border-border bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="space-y-4">
          {/* Text Row */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Database Schema</h1>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">Manage tables, fields, and relationships</p>
            </div>
          </div>
          
          {/* Buttons Row */}
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 text-xs"
            >
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white text-sm">
                  <Settings className="h-3 w-3 mr-2" />
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
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="diagram" className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diagram">Interactive Diagram</TabsTrigger>
              <TabsTrigger value="overview">Schema Overview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="diagram" className="flex-1 mt-4">
            <InteractiveSchemaDiagram 
              onTableEdit={handleUpdateTable}
              onTableDelete={handleDeleteTable}
              onTableDuplicate={handleDuplicateTable}
            />
          </TabsContent>
          
          <TabsContent value="overview" className="flex-1 overflow-auto mt-4">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                  {/* Schema Overview Card */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                          <Layers className="w-3 h-3 text-blue-600" />
                        </div>
                        Schema Overview
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Current database structure and configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{currentProject.schema.length}</p>
                              <p className="text-xs font-medium text-blue-600 mt-1">Tables</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-200 rounded-md flex items-center justify-center">
                              <Database className="w-4 h-4 text-blue-700" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-blue-700">
                                {currentProject.schema.reduce((acc, table) => acc + table.fields.length, 0)}
                              </p>
                              <p className="text-xs font-medium text-blue-600 mt-1">Fields</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-200 rounded-md flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-blue-700" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {currentProject.database && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900">Database</h4>
                            <Badge variant="outline" className="bg-white text-xs">
                              {currentProject.database.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-700 mb-3 leading-relaxed">
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

                      <TableManagementModal
                        tables={currentProject.schema}
                        databaseConfig={currentProject.database}
                        onUpdateTable={handleUpdateTable}
                        onDeleteTable={handleDeleteTable}
                        onDuplicateTable={handleDuplicateTable}
                        onCreateTable={handleCreateTable}
                        onDatabaseChange={handleDatabaseChange}
                      >
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm">
                          <Settings className="w-3 h-3 mr-2" />
                          Manage Database
                        </Button>
                      </TableManagementModal>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
