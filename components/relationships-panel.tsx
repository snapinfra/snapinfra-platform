"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Link,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Key,
  Database,
  ArrowRight,
  ArrowLeftRight,
  MoreHorizontal,
  Eye,
  Settings,
  Zap,
  Shield,
  Hash,
  RefreshCw,
  GitBranch,
  Network,
  Layers
} from "lucide-react"
import { TableSchema, FieldSchema, Relationship } from "@/lib/appContext/app-context"
import { RelationshipDiagram } from "./relationship-diagram"

interface RelationshipsPanelProps {
  tables: TableSchema[]
  onUpdateTable: (table: TableSchema) => void
  onCreateRelationship?: (relationship: Relationship, sourceTableId: string) => void
}

interface NewRelationship extends Omit<Relationship, 'targetTable'> {
  sourceTable: string
  targetTable: string
}

const RELATIONSHIP_ICONS = {
  'one-to-one': <ArrowRight className="w-4 h-4" />,
  'one-to-many': <GitBranch className="w-4 h-4" />,
  'many-to-many': <Network className="w-4 h-4" />
}

const RELATIONSHIP_COLORS = {
  'one-to-one': 'bg-blue-100 text-blue-700 border-blue-200',
  'one-to-many': 'bg-blue-100 text-blue-700 border-blue-200',  
  'many-to-many': 'bg-purple-100 text-purple-700 border-purple-200'
}

const RELATIONSHIP_DESCRIPTIONS = {
  'one-to-one': 'Each record in the source table corresponds to exactly one record in the target table',
  'one-to-many': 'Each record in the source table can have multiple records in the target table',
  'many-to-many': 'Records in both tables can have multiple corresponding records (requires junction table)'
}

export function RelationshipsPanel({ tables, onUpdateTable, onCreateRelationship }: RelationshipsPanelProps) {
  const [selectedRelationship, setSelectedRelationship] = useState<{ tableId: string, relationship: Relationship } | null>(null)
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false)
  const [newRelationship, setNewRelationship] = useState<Partial<NewRelationship>>({
    type: 'one-to-many'
  })

  // Get all relationships across all tables
  const allRelationships = tables.flatMap(table => 
    table.relationships.map(rel => ({
      ...rel,
      sourceTableId: table.id,
      sourceTableName: table.name
    }))
  )

  // Get available fields for dropdowns
  const getTableFields = (tableId: string): FieldSchema[] => {
    const table = tables.find(t => t.id === tableId)
    return table?.fields || []
  }

  const getFieldsForForeignKey = (tableId: string): FieldSchema[] => {
    const table = tables.find(t => t.id === tableId)
    return table?.fields.filter(f => f.isPrimary || f.isUnique) || []
  }

  const handleCreateRelationship = () => {
    if (!newRelationship.sourceTable || !newRelationship.targetTable || 
        !newRelationship.sourceField || !newRelationship.targetField || !newRelationship.type) {
      return
    }

    const relationship: Relationship = {
      type: newRelationship.type,
      targetTable: newRelationship.targetTable,
      sourceField: newRelationship.sourceField,
      targetField: newRelationship.targetField
    }

    // Add relationship to source table
    const sourceTable = tables.find(t => t.id === newRelationship.sourceTable)
    if (sourceTable) {
      const updatedTable = {
        ...sourceTable,
        relationships: [...sourceTable.relationships, relationship]
      }
      onUpdateTable(updatedTable)
    }

    // For many-to-many relationships, create the junction table suggestion
    if (newRelationship.type === 'many-to-many') {
      // This would typically create a junction table
      console.log('Would create junction table for many-to-many relationship')
    }

    if (onCreateRelationship) {
      onCreateRelationship(relationship, newRelationship.sourceTable)
    }

    setNewRelationship({ type: 'one-to-many' })
    setIsCreatingRelationship(false)
  }

  const handleDeleteRelationship = (tableId: string, relationshipIndex: number) => {
    const table = tables.find(t => t.id === tableId)
    if (table) {
      const updatedTable = {
        ...table,
        relationships: table.relationships.filter((_, index) => index !== relationshipIndex)
      }
      onUpdateTable(updatedTable)
    }
  }


  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="list">Relationships</TabsTrigger>
          <TabsTrigger value="diagram">Visual Diagram</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="flex-1 mt-4">
          <div className="space-y-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Table Relationships</h2>
                <Badge variant="secondary" className="text-xs">
                  {allRelationships.length} total
                </Badge>
              </div>
              
              <Dialog open={isCreatingRelationship} onOpenChange={setIsCreatingRelationship}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Relationship
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Link className="w-5 h-5" />
                      Create New Relationship
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Relationship Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Relationship Type</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(RELATIONSHIP_DESCRIPTIONS).map(([type, description]) => (
                          <div
                            key={type}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              newRelationship.type === type 
                                ? RELATIONSHIP_COLORS[type as keyof typeof RELATIONSHIP_COLORS] + ' border-opacity-100'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setNewRelationship({ ...newRelationship, type: type as Relationship['type'] })}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                newRelationship.type === type ? 'bg-white bg-opacity-50' : 'bg-gray-100'
                              }`}>
                                {RELATIONSHIP_ICONS[type as keyof typeof RELATIONSHIP_ICONS]}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm capitalize">
                                  {type.replace('-', ' ')}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {description}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Table Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Source Table</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {newRelationship.sourceTable 
                                ? tables.find(t => t.id === newRelationship.sourceTable)?.name 
                                : 'Select source table'
                              }
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {tables.map(table => (
                              <DropdownMenuItem 
                                key={table.id}
                                onClick={() => setNewRelationship({ 
                                  ...newRelationship, 
                                  sourceTable: table.id,
                                  sourceField: undefined
                                })}
                              >
                                <Database className="w-4 h-4 mr-2" />
                                {table.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Target Table</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {newRelationship.targetTable 
                                ? tables.find(t => t.id === newRelationship.targetTable)?.name 
                                : 'Select target table'
                              }
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {tables.filter(t => t.id !== newRelationship.sourceTable).map(table => (
                              <DropdownMenuItem 
                                key={table.id}
                                onClick={() => setNewRelationship({ 
                                  ...newRelationship, 
                                  targetTable: table.id,
                                  targetField: undefined
                                })}
                              >
                                <Database className="w-4 h-4 mr-2" />
                                {table.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Field Selection */}
                    {newRelationship.sourceTable && newRelationship.targetTable && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Source Field</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {newRelationship.sourceField || 'Select field'}
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                              {getTableFields(newRelationship.sourceTable).map(field => (
                                <DropdownMenuItem 
                                  key={field.id}
                                  onClick={() => setNewRelationship({ 
                                    ...newRelationship, 
                                    sourceField: field.name 
                                  })}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {field.isPrimary && <Key className="w-3 h-3 text-yellow-600" />}
                                    {field.isUnique && <Hash className="w-3 h-3 text-purple-600" />}
                                    <span className="font-mono text-sm">{field.name}</span>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {field.type}
                                    </Badge>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Target Field</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {newRelationship.targetField || 'Select field'}
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                              {getFieldsForForeignKey(newRelationship.targetTable).map(field => (
                                <DropdownMenuItem 
                                  key={field.id}
                                  onClick={() => setNewRelationship({ 
                                    ...newRelationship, 
                                    targetField: field.name 
                                  })}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {field.isPrimary && <Key className="w-3 h-3 text-yellow-600" />}
                                    {field.isUnique && <Hash className="w-3 h-3 text-purple-600" />}
                                    <span className="font-mono text-sm">{field.name}</span>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {field.type}
                                    </Badge>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreatingRelationship(false)
                          setNewRelationship({ type: 'one-to-many' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateRelationship}
                        disabled={!newRelationship.sourceTable || !newRelationship.targetTable || 
                                  !newRelationship.sourceField || !newRelationship.targetField}
                      >
                        Create Relationship
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Relationships Table */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              {allRelationships.length > 0 ? (
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRelationships.map((rel, index) => {
                        const targetTable = tables.find(t => t.id === rel.targetTable)
                        const sourceTable = tables.find(t => t.id === rel.sourceTableId)
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline" className={`${RELATIONSHIP_COLORS[rel.type]} flex items-center gap-1 w-fit`}>
                                {RELATIONSHIP_ICONS[rel.type]}
                                <span className="text-xs">{rel.type.replace('-', ' ')}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-medium text-sm">{sourceTable?.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{rel.sourceField}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-medium text-sm">{targetTable?.name}</div>
                                <div className="font-mono text-xs text-muted-foreground">{rel.targetField}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => setSelectedRelationship({ 
                                    tableId: rel.sourceTableId, 
                                    relationship: rel 
                                  })}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => {
                                    const relIndex = sourceTable?.relationships.findIndex(r => 
                                      r.targetTable === rel.targetTable && 
                                      r.sourceField === rel.sourceField && 
                                      r.targetField === rel.targetField
                                    )
                                    if (relIndex !== undefined && relIndex !== -1) {
                                      handleDeleteRelationship(rel.sourceTableId, relIndex)
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-6">
                  <div>
                    <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="font-medium text-gray-900 mb-2">No relationships defined</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Create relationships between your tables to define how data connects.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setIsCreatingRelationship(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Relationship
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Diagram View */}
        <TabsContent value="diagram" className="flex-1 mt-4 overflow-hidden">
          <RelationshipDiagram
            tables={tables}
            onTableClick={(table) => {
              // Optional: Could trigger table selection or show table details
              console.log('Table clicked:', table.name)
            }}
            onRelationshipClick={(relationship) => {
              // Optional: Could show relationship details or edit modal
              console.log('Relationship clicked:', relationship)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}