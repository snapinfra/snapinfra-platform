"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Database,
  Key,
  Link,
  Hash,
  ArrowRight,
  GitBranch,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Settings
} from "lucide-react"
import { TableSchema, FieldSchema, Relationship } from "@/lib/appContext/app-context"

interface RelationshipDiagramProps {
  tables: TableSchema[]
  onTableClick?: (table: TableSchema) => void
  onRelationshipClick?: (relationship: Relationship & { sourceTable: string }) => void
}

interface TablePosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface ConnectionLine {
  from: TablePosition
  to: TablePosition
  relationship: Relationship & { sourceTable: string }
  fromField: string
  toField: string
}

const RELATIONSHIP_ICONS = {
  'one-to-one': <ArrowRight className="w-3 h-3" />,
  'one-to-many': <GitBranch className="w-3 h-3" />,
  'many-to-many': <Network className="w-3 h-3" />
}

const RELATIONSHIP_COLORS = {
  'one-to-one': '#3B82F6', // blue
  'one-to-many': '#10B981', // green  
  'many-to-many': '#8B5CF6' // purple
}

export function RelationshipDiagram({ tables, onTableClick, onRelationshipClick }: RelationshipDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tablePositions, setTablePositions] = useState<TablePosition[]>([])
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [layout, setLayout] = useState<'grid' | 'circular' | 'hierarchical'>('grid')

  // Calculate table positions based on layout
  const calculatePositions = (layoutType: 'grid' | 'circular' | 'hierarchical') => {
    const tableWidth = 280
    const tableHeight = 200
    const padding = 50
    
    return tables.map((table, index) => {
      let x = 0
      let y = 0
      
      switch (layoutType) {
        case 'grid':
          const cols = Math.ceil(Math.sqrt(tables.length))
          const col = index % cols
          const row = Math.floor(index / cols)
          x = col * (tableWidth + padding) + padding
          y = row * (tableHeight + padding) + padding
          break
          
        case 'circular':
          const centerX = 400
          const centerY = 300
          const radius = Math.max(150, tables.length * 30)
          const angle = (index / tables.length) * 2 * Math.PI
          x = centerX + Math.cos(angle) * radius - tableWidth / 2
          y = centerY + Math.sin(angle) * radius - tableHeight / 2
          break
          
        case 'hierarchical':
          // Simple hierarchical layout - tables with more relationships at top
          const relationshipCount = table.relationships.length
          const level = Math.max(0, 3 - relationshipCount)
          x = (index % 3) * (tableWidth + padding) + padding
          y = level * (tableHeight + padding) + padding
          break
      }
      
      return {
        id: table.id,
        x,
        y,
        width: tableWidth,
        height: tableHeight
      }
    })
  }

  // Initialize positions
  useEffect(() => {
    setTablePositions(calculatePositions(layout))
  }, [tables, layout])

  // Get all relationships with source table info
  const allRelationships = tables.flatMap(table => 
    table.relationships.map(rel => ({
      ...rel,
      sourceTable: table.id,
      sourceTableName: table.name
    }))
  )

  // Calculate connection lines
  const connectionLines: ConnectionLine[] = allRelationships.map(rel => {
    const fromPos = tablePositions.find(pos => pos.id === rel.sourceTable)
    const toPos = tablePositions.find(pos => pos.id === rel.targetTable)
    
    if (!fromPos || !toPos) return null
    
    return {
      from: fromPos,
      to: toPos,
      relationship: rel,
      fromField: rel.sourceField,
      toField: rel.targetField
    }
  }).filter(Boolean) as ConnectionLine[]

  // Handle pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as Element).closest('.diagram-background')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.4))
  }

  const resetView = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Render connection line with arrow
  const renderConnectionLine = (line: ConnectionLine, index: number) => {
    const startX = line.from.x + line.from.width / 2
    const startY = line.from.y + line.from.height / 2
    const endX = line.to.x + line.to.width / 2
    const endY = line.to.y + line.to.height / 2
    
    // Calculate connection points on table edges
    const dx = endX - startX
    const dy = endY - startY
    const angle = Math.atan2(dy, dx)
    
    // Adjust start and end points to table edges
    const fromX = startX + Math.cos(angle) * (line.from.width / 2)
    const fromY = startY + Math.sin(angle) * (line.from.height / 2)
    const toX = endX - Math.cos(angle) * (line.to.width / 2)
    const toY = endY - Math.sin(angle) * (line.to.height / 2)
    
    const color = RELATIONSHIP_COLORS[line.relationship.type]
    
    return (
      <g key={index}>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={color}
          strokeWidth="2"
          strokeDasharray={line.relationship.type === 'many-to-many' ? '5,5' : 'none'}
          className="cursor-pointer hover:stroke-width-3"
          onClick={() => onRelationshipClick?.(line.relationship)}
        />
        
        {/* Arrow head */}
        <polygon
          points={`${toX},${toY} ${toX - 8 * Math.cos(angle - 0.5)},${toY - 8 * Math.sin(angle - 0.5)} ${toX - 8 * Math.cos(angle + 0.5)},${toY - 8 * Math.sin(angle + 0.5)}`}
          fill={color}
          className="cursor-pointer"
          onClick={() => onRelationshipClick?.(line.relationship)}
        />
        
        {/* Relationship label */}
        <text
          x={(fromX + toX) / 2}
          y={(fromY + toY) / 2 - 8}
          fill={color}
          fontSize="10"
          textAnchor="middle"
          className="cursor-pointer pointer-events-none select-none"
        >
          {line.fromField} Ã¢â€ â€™ {line.toField}
        </text>
      </g>
    )
  }

  // Render table card
  const renderTable = (table: TableSchema, position: TablePosition) => {
    const isSelected = selectedTable === table.id
    const primaryFields = table.fields.filter(f => f.isPrimary)
    const foreignFields = table.fields.filter(f => f.isForeignKey)
    const regularFields = table.fields.filter(f => !f.isPrimary && !f.isForeignKey)
    
    return (
      <div
        key={table.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'z-20 scale-105' : 'z-10'
        }`}
        style={{
          left: position.x,
          top: position.y,
          width: position.width,
          height: position.height
        }}
        onClick={() => {
          setSelectedTable(table.id)
          onTableClick?.(table)
        }}
      >
        <Card className={`h-full shadow-md hover:shadow-lg transition-shadow ${
          isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
        }`}>
          <CardContent className="p-4 h-full flex flex-col">
            {/* Table Header */}
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm truncate">{table.name}</h3>
              <Badge variant="outline" className="text-xs ml-auto">
                {table.fields.length}
              </Badge>
            </div>
            
            {/* Fields List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {/* Primary Keys */}
              {primaryFields.map(field => (
                <div key={field.id} className="flex items-center gap-2 text-xs bg-yellow-50 p-1 rounded">
                  <Key className="w-3 h-3 text-yellow-600" />
                  <span className="font-mono font-medium">{field.name}</span>
                  <span className="text-muted-foreground text-xs">{field.type}</span>
                </div>
              ))}
              
              {/* Foreign Keys */}
              {foreignFields.map(field => (
                <div key={field.id} className="flex items-center gap-2 text-xs bg-blue-50 p-1 rounded">
                  <Link className="w-3 h-3 text-blue-600" />
                  <span className="font-mono font-medium">{field.name}</span>
                  <span className="text-muted-foreground text-xs">{field.type}</span>
                </div>
              ))}
              
              {/* Regular Fields (show first few) */}
              {regularFields.slice(0, 5).map(field => (
                <div key={field.id} className="flex items-center gap-2 text-xs p-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  <span className="font-mono">{field.name}</span>
                  <span className="text-muted-foreground text-xs">{field.type}</span>
                </div>
              ))}
              
              {regularFields.length > 5 && (
                <div className="text-xs text-muted-foreground text-center p-1">
                  +{regularFields.length - 5} more fields
                </div>
              )}
            </div>
            
            {/* Relationship Count */}
            {table.relationships.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <Badge variant="secondary" className="text-xs">
                  {table.relationships.length} relationship{table.relationships.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Tables to Display</h3>
          <p className="text-sm text-gray-600 max-w-md">
            Create some tables first to see their relationships visualized in an interactive diagram.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Layout:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {layout.charAt(0).toUpperCase() + layout.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLayout('grid')}>
                Grid Layout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayout('circular')}>
                Circular Layout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLayout('hierarchical')}>
                Hierarchical Layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Diagram Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing diagram-background"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 transition-transform"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Connection Lines SVG */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              minWidth: '2000px',
              minHeight: '1500px'
            }}
          >
            {connectionLines.map((line, index) => renderConnectionLine(line, index))}
          </svg>
          
          {/* Table Cards */}
          <div className="relative" style={{ minWidth: '2000px', minHeight: '1500px' }}>
            {tables.map(table => {
              const position = tablePositions.find(pos => pos.id === table.id)
              if (!position) return null
              return renderTable(table, position)
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Key className="w-3 h-3 text-yellow-600" />
              <span>Primary Key</span>
            </div>
            <div className="flex items-center gap-1">
              <Link className="w-3 h-3 text-blue-600" />
              <span>Foreign Key</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(RELATIONSHIP_ICONS).map(([type, icon]) => (
              <div key={type} className="flex items-center gap-1">
                <div style={{ color: RELATIONSHIP_COLORS[type as keyof typeof RELATIONSHIP_COLORS] }}>
                  {icon}
                </div>
                <span className="capitalize">{type.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          Drag to pan Ã¢â‚¬Â¢ Scroll to zoom Ã¢â‚¬Â¢ Click tables to select Ã¢â‚¬Â¢ Click relationships for details
        </p>
      </div>
    </div>
  )
}