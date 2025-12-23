"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  Database,
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
  Search,
  Eye
} from "lucide-react"
import { TableSchema, FieldSchema, FieldType } from "@/lib/appContext/app-context"
import { FieldConfigPanel } from "./field-config-panel"

interface TableViewProps {
  table: TableSchema
  onUpdateTable: (table: TableSchema) => void
  onDeleteTable: (tableId: string) => void
  onDuplicateTable: (table: TableSchema) => void
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

export function TableView({ table, onUpdateTable, onDeleteTable, onDuplicateTable }: TableViewProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tableName, setTableName] = useState(table.name)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFields = table.fields.filter(field =>
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveTableName = () => {
    if (tableName.trim() && tableName !== table.name) {
      onUpdateTable({
        ...table,
        name: tableName.trim()
      })
    }
    setIsEditingName(false)
  }

  const handleAddField = (field: FieldSchema) => {
    onUpdateTable({
      ...table,
      fields: [...table.fields, field]
    })
  }

  const handleUpdateField = (fieldId: string, updatedField: FieldSchema) => {
    onUpdateTable({
      ...table,
      fields: table.fields.map(f => f.id === fieldId ? updatedField : f)
    })
  }

  const handleDeleteField = (fieldId: string) => {
    onUpdateTable({
      ...table,
      fields: table.fields.filter(f => f.id !== fieldId)
    })
  }

  const handleDuplicateField = (field: FieldSchema) => {
    const duplicatedField: FieldSchema = {
      ...field,
      id: `field_${Date.now()}`,
      name: `${field.name}_copy`
    }
    handleAddField(duplicatedField)
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  onBlur={handleSaveTableName}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveTableName()}
                  className="font-semibold text-lg"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTableName}>Save</Button>
              </div>
            ) : (
              <h2 
                className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {table.name}
              </h2>
            )}
            <Badge variant="secondary" className="text-xs">
              {table.fields.length} fields
            </Badge>
            {table.estimatedRows && (
              <Badge variant="outline" className="text-xs">
                ~{table.estimatedRows.toLocaleString()} rows
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <FieldConfigPanel
              onSave={handleAddField}
              onCancel={() => {}}
              existingFieldNames={table.fields.map(f => f.name)}
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </FieldConfigPanel>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDuplicateTable(table)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Table
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Schema
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Table
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Table</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the "{table.name}" table? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteTable(table.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {table.description && (
          <p className="text-sm text-muted-foreground">{table.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Field Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead className="w-[300px]">Description</TableHead>
                <TableHead className="w-[120px]">Default</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field) => (
                <TableRow key={field.id} className="group">
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      {FIELD_TYPE_ICONS[field.type]}
                      {field.name}
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
                    <div className="text-sm text-muted-foreground">
                      {field.description || '-'}
                      {field.validation && field.validation.length > 0 && (
                        <div className="text-xs mt-1">
                          <span className="text-blue-600">
                            {field.validation.length} validation rule{field.validation.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {field.defaultValue !== undefined ? String(field.defaultValue) : '-'}
                    </code>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FieldConfigPanel
                        field={field}
                        onSave={(updatedField) => handleUpdateField(field.id, updatedField)}
                        onCancel={() => {}}
                        existingFieldNames={table.fields.map(f => f.name).filter(name => name !== field.name)}
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </FieldConfigPanel>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDuplicateField(field)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate Field
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteField(field.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Field
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredFields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No fields match your search' : 'No fields in this table'}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}