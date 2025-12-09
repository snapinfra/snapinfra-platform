"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  Database, 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Download,
  Filter,
  SortAsc,
  Eye,
  Settings,
  Table as TableIcon
} from "lucide-react"
import { TableSchema } from "@/lib/appContext/app-context"

interface TableListSidebarProps {
  tables: TableSchema[]
  selectedTableId?: string
  onSelectTable: (tableId: string) => void
  onCreateTable: () => void
  onUpdateTable: (table: TableSchema) => void
  onDeleteTable: (tableId: string) => void
  onDuplicateTable: (table: TableSchema) => void
}

type SortBy = 'name' | 'fields' | 'created' | 'rows'
type FilterBy = 'all' | 'empty' | 'hasData' | 'primary'

export function TableListSidebar({
  tables,
  selectedTableId,
  onSelectTable,
  onCreateTable,
  onUpdateTable,
  onDeleteTable,
  onDuplicateTable
}: TableListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')

  // Filter and sort tables
  const filteredTables = tables
    .filter(table => {
      // Search filter
      const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesSearch) return false

      // Category filter
      switch (filterBy) {
        case 'empty':
          return table.fields.length === 0
        case 'hasData':
          return (table.estimatedRows || 0) > 0
        case 'primary':
          return table.fields.some(f => f.isPrimary)
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'fields':
          return b.fields.length - a.fields.length
        case 'rows':
          return (b.estimatedRows || 0) - (a.estimatedRows || 0)
        case 'created':
          return new Date(b.position?.x || 0).getTime() - new Date(a.position?.x || 0).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const getTableStats = (table: TableSchema) => {
    const stats = []
    stats.push(`${table.fields.length} fields`)
    
    const primaryKeys = table.fields.filter(f => f.isPrimary).length
    const foreignKeys = table.fields.filter(f => f.isForeignKey).length
    const indexes = table.fields.filter(f => f.hasIndex).length
    
    if (primaryKeys > 0) stats.push(`${primaryKeys} PK`)
    if (foreignKeys > 0) stats.push(`${foreignKeys} FK`)
    if (indexes > 0) stats.push(`${indexes} indexed`)
    
    return stats
  }

  const getTableColor = (table: TableSchema) => {
    if (table.color) {
      return {
        background: `${table.color}20`,
        border: `${table.color}40`,
        text: table.color
      }
    }
    return {
      background: '#f3f4f6',
      border: '#e5e7eb', 
      text: '#6b7280'
    }
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tables</h2>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterBy('all')}>
                  <div className="flex items-center justify-between w-full">
                    <span>All Tables</span>
                    {filterBy === 'all' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('hasData')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Has Data</span>
                    {filterBy === 'hasData' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('empty')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Empty Tables</span>
                    {filterBy === 'empty' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('primary')}>
                  <div className="flex items-center justify-between w-full">
                    <span>With Primary Keys</span>
                    {filterBy === 'primary' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <SortAsc className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Name</span>
                    {sortBy === 'name' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('fields')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Field Count</span>
                    {sortBy === 'fields' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rows')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Row Count</span>
                    {sortBy === 'rows' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <Button onClick={onCreateTable} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Table List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredTables.map((table) => {
            const isSelected = table.id === selectedTableId
            const colors = getTableColor(table)
            const stats = getTableStats(table)
            
            return (
              <div
                key={table.id}
                className={`group relative rounded-lg p-3 mb-2 cursor-pointer border-2 transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
                style={!isSelected ? {
                  backgroundColor: colors.background,
                  borderColor: colors.border
                } : {}}
                onClick={() => onSelectTable(table.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors.text }}
                      />
                      <h3 className="font-semibold text-sm truncate">
                        {table.name}
                      </h3>
                    </div>
                    
                    {table.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {table.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {stats.slice(0, 2).map((stat, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {stat}
                        </Badge>
                      ))}
                      {stats.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{stats.length - 2} more
                        </Badge>
                      )}
                    </div>
                    
                    {table.estimatedRows && (
                      <div className="text-xs text-muted-foreground">
                        ~{table.estimatedRows.toLocaleString()} rows
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onSelectTable(table.id)
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Table
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateTable(table)
                      }}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTable(table.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          
          {filteredTables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No tables match your search' : 'No tables yet'}
              </p>
              {!searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={onCreateTable}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first table
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      {tables.length > 0 && (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tables.length} tables total</span>
            <span>{tables.reduce((sum, t) => sum + t.fields.length, 0)} fields total</span>
          </div>
        </div>
      )}
    </div>
  )
}