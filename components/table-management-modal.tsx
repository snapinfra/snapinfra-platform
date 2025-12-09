"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Database,
  Settings,
  Search,
  MoreHorizontal,
  Key,
  Link,
  Hash,
  Calendar,
  FileText,
  Mail,
  Lock,
  CheckSquare,
  Code,
  Upload,
  List,
  Shield,
  Eye,
  Server,
  Zap,
  BarChart,
  Brain,
  Rocket,
  Leaf
} from "lucide-react"
import { TableSchema, FieldSchema, FieldType, DatabaseConfig, DatabaseType } from "@/lib/appContext/app-context"
import { FieldConfigPanel } from "./field-config-panel"
import { DatabaseSelection } from "./database-selection"
import { DatabaseConfigPanel } from "./database-config-panel"
import { RelationshipsPanel } from "./relationships-panel"

interface TableManagementModalProps {
  tables: TableSchema[]
  databaseConfig?: DatabaseConfig
  onUpdateTable: (table: TableSchema) => void
  onDeleteTable: (tableId: string) => void
  onDuplicateTable: (table: TableSchema) => void
  onCreateTable: () => void
  onDatabaseChange?: (dbType: DatabaseType) => void
  children: React.ReactNode
}

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  'Text': <FileText className="w-4 h-4" />,
  'Textarea': <FileText className="w-4 h-4" />,
  'Number': <Hash className="w-4 h-4" />,
  'Decimal': <Hash className="w-4 h-4" />,
  'Email': <Mail className="w-4 h-4" />,
  'Password': <Lock className="w-4 h-4" />,
  'Date': <Calendar className="w-4 h-4" />,
  'DateTime': <Calendar className="w-4 h-4" />,
  'Boolean': <CheckSquare className="w-4 h-4" />,
  'JSON': <Code className="w-4 h-4" />,
  'File': <Upload className="w-4 h-4" />,
  'UUID': <Key className="w-4 h-4" />,
  'Enum': <List className="w-4 h-4" />
}

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  'Text': 'bg-blue-100 text-blue-700',
  'Textarea': 'bg-blue-100 text-blue-700',
  'Number': 'bg-blue-100 text-blue-700',
  'Decimal': 'bg-blue-100 text-blue-700',
  'Email': 'bg-purple-100 text-purple-700',
  'Password': 'bg-red-100 text-red-700',
  'Date': 'bg-orange-100 text-orange-700',
  'DateTime': 'bg-orange-100 text-orange-700',
  'Boolean': 'bg-yellow-100 text-yellow-700',
  'JSON': 'bg-gray-100 text-gray-700',
  'File': 'bg-pink-100 text-pink-700',
  'UUID': 'bg-indigo-100 text-indigo-700',
  'Enum': 'bg-cyan-100 text-cyan-700'
}

export function TableManagementModal({
  tables,
  databaseConfig,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable,
  onCreateTable,
  onDatabaseChange,
  children
}: TableManagementModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState("")
  
  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) : null
  
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddField = (field: FieldSchema) => {
    if (!selectedTable) return
    onUpdateTable({
      ...selectedTable,
      fields: [...selectedTable.fields, field]
    })
  }

  const handleUpdateField = (fieldId: string, updatedField: FieldSchema) => {
    if (!selectedTable) return
    onUpdateTable({
      ...selectedTable,
      fields: selectedTable.fields.map(f => f.id === fieldId ? updatedField : f)
    })
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTable) return
    onUpdateTable({
      ...selectedTable,
      fields: selectedTable.fields.filter(f => f.id !== fieldId)
    })
  }

  const getFieldBadges = (field: FieldSchema) => {
    const badges = []
    if (field.isPrimary) badges.push({ text: 'PK', color: 'bg-yellow-100 text-yellow-700', icon: <Key className="w-3 h-3" /> })
    if (field.isForeignKey) badges.push({ text: 'FK', color: 'bg-blue-100 text-blue-700', icon: <Link className="w-3 h-3" /> })
    if (field.isRequired) badges.push({ text: 'Required', color: 'bg-red-100 text-red-700', icon: <Shield className="w-3 h-3" /> })
    if (field.isUnique) badges.push({ text: 'Unique', color: 'bg-purple-100 text-purple-700', icon: <Hash className="w-3 h-3" /> })
    if (field.hasIndex) badges.push({ text: 'Indexed', color: 'bg-blue-100 text-blue-700', icon: <Database className="w-3 h-3" /> })
    return badges
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="!max-w-none !w-[60vw] !min-w-[700px] !max-w-[980px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Management
            <Badge variant="secondary" className="text-xs">
              {tables.length} tables
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs defaultValue="tables" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="tables">Tables & Fields</TabsTrigger>
              <TabsTrigger value="database">Database Config</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
            </TabsList>

            {/* Tables Tab */}
            <TabsContent value="tables" className="flex-1 min-h-0 flex gap-4 mt-4 overflow-hidden">
              {/* Left: Table List */}
              <div className="w-80 border border-border rounded-lg flex-shrink-0 flex flex-col overflow-hidden">
                <div className="p-3 border-b flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Tables</h3>
                    <Button size="sm" onClick={onCreateTable}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Table
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                    <Input
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      {filteredTables.map((table) => (
                        <div
                          key={table.id}
                          className={`p-2 rounded-md mb-1 cursor-pointer transition-colors ${
                            selectedTableId === table.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                          onClick={() => setSelectedTableId(table.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs truncate">{table.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {table.fields.length} fields
                              </p>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicateTable(table)
                                }}>
                                  <Copy className="w-3 h-3 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteTable(table.id)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      
                      {filteredTables.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <Database className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No tables found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Right: Table Details */}
              <div className="flex-1 border border-border rounded-lg flex flex-col overflow-hidden">
                {selectedTable ? (
                  <>
                    <div className="p-3 border-b flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">{selectedTable.name}</h3>
                          <p className="text-xs text-muted-foreground">{selectedTable.description}</p>
                        </div>
                        
                        <FieldConfigPanel
                          onSave={handleAddField}
                          onCancel={() => {}}
                          existingFieldNames={selectedTable.fields.map(f => f.name)}
                        >
                          <Button size="sm">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Field
                          </Button>
                        </FieldConfigPanel>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Field</TableHead>
                            <TableHead className="w-[120px]">Type</TableHead>
                            <TableHead className="w-[300px]">Attributes</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTable.fields.map((field) => (
                            <TableRow key={field.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {FIELD_TYPE_ICONS[field.type]}
                                  <span className="font-mono text-sm">{field.name}</span>
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${FIELD_TYPE_COLORS[field.type]}`}
                                >
                                  {field.type}
                                </Badge>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {getFieldBadges(field).map((badge, index) => (
                                    <Badge 
                                      key={index}
                                      variant="outline" 
                                      className={`text-xs ${badge.color} flex items-center gap-1`}
                                    >
                                      {badge.icon}
                                      {badge.text}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                  <FieldConfigPanel
                                    field={field}
                                    onSave={(updatedField) => handleUpdateField(field.id, updatedField)}
                                    onCancel={() => {}}
                                    existingFieldNames={selectedTable.fields.map(f => f.name).filter(name => name !== field.name)}
                                  >
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </FieldConfigPanel>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDeleteField(field.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        </Table>
                        
                        {selectedTable.fields.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No fields in this table</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a table to view its fields</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database" className="flex-1 min-h-0 mt-4 overflow-hidden">
              {databaseConfig ? (
                <DatabaseConfigPanel 
                  databaseConfig={databaseConfig}
                  onDatabaseChange={onDatabaseChange}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground flex items-center justify-center h-full">
                  <div>
                    <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No database configuration available</p>
                    <p className="text-xs mt-2">Start a chat to get AI database recommendations</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="flex-1 min-h-0 mt-4 overflow-hidden">
              <RelationshipsPanel
                tables={tables}
                onUpdateTable={onUpdateTable}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}