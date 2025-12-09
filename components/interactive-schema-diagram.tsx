"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  Database, 
  Key, 
  Link, 
  MoreVertical, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  Move3D,
  Zap,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppContext } from "@/lib/appContext/app-context"
import type { TableSchema, FieldSchema } from "@/lib/appContext/app-context"

interface Position {
  x: number
  y: number
}

interface Connection {
  from: { tableId: string; fieldId: string }
  to: { tableId: string; fieldId: string }
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

interface InteractiveSchemaDiagramProps {
  onTableEdit?: (table: TableSchema) => void
  onTableDelete?: (tableId: string) => void
  onTableDuplicate?: (table: TableSchema) => void
}

export function InteractiveSchemaDiagram({
  onTableEdit,
  onTableDelete,
  onTableDuplicate
}: InteractiveSchemaDiagramProps) {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [connections, setConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState<Position>({ x: 0, y: 0 })

  const schema = currentProject?.schema || []
  
  // Constants for zoom and pan limits
  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 3

  // Initialize connections based on foreign key relationships
  useEffect(() => {
    if (!schema.length) return
    
    const newConnections: Connection[] = []
    schema.forEach(table => {
      table.fields.forEach(field => {
        if (field.isForeignKey) {
          // Find the referenced table (simplified logic)
          const referencedTable = schema.find(t => 
            t.name.toLowerCase() === field.name.replace(/_?id$/i, '').toLowerCase() ||
            t.name.toLowerCase() === field.name.replace(/_?(uuid|key)$/i, '').toLowerCase()
          )
          
          if (referencedTable) {
            const primaryKeyField = referencedTable.fields.find(f => f.isPrimary)
            if (primaryKeyField) {
              newConnections.push({
                from: { tableId: table.id, fieldId: field.id },
                to: { tableId: referencedTable.id, fieldId: primaryKeyField.id },
                type: 'many-to-one' as any
              })
            }
          }
        }
      })
    })
    
    setConnections(newConnections)
  }, [schema])

  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return // Only left click
    
    const table = schema.find(t => t.id === tableId)
    if (!table || !table.position) return

    const rect = e.currentTarget.getBoundingClientRect()
    const diagramRect = diagramRef.current?.getBoundingClientRect()
    
    if (!diagramRect) return
    
    // Calculate offset in screen space for more accurate dragging
    setDragOffset({
      x: e.clientX - diagramRect.left - (table.position.x + pan.x) * zoom,
      y: e.clientY - diagramRect.top - (table.position.y + pan.y) * zoom
    })
    setDraggedTable(tableId)
    setSelectedTable(tableId)
    e.preventDefault()
    e.stopPropagation()
  }, [schema, pan, zoom])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedTable || !diagramRef.current) return
    
    const rect = diagramRef.current.getBoundingClientRect()
    // Convert screen coordinates to diagram coordinates accounting for zoom and pan
    const diagramX = (e.clientX - rect.left) / zoom - pan.x
    const diagramY = (e.clientY - rect.top) / zoom - pan.y
    
    // Calculate the offset in diagram space
    const offsetX = dragOffset.x / zoom
    const offsetY = dragOffset.y / zoom
    
    const x = diagramX - offsetX
    const y = diagramY - offsetY
    
    const updatedSchema = schema.map(table => 
      table.id === draggedTable 
        ? { ...table, position: { x: Math.max(0, x), y: Math.max(0, y) } }
        : table
    )
    
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }, [draggedTable, dragOffset, zoom, pan, schema, dispatch])

  const handleMouseUp = useCallback(() => {
    setDraggedTable(null)
  }, [])

  useEffect(() => {
    if (draggedTable) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedTable, handleMouseMove, handleMouseUp])

  // Zoom functionality
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const rect = diagramRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta))
    
    if (newZoom !== zoom) {
      // Zoom towards mouse cursor
      const factor = newZoom / zoom - 1
      const newPan = {
        x: pan.x - (mouseX / zoom) * factor,
        y: pan.y - (mouseY / zoom) * factor
      }
      
      setZoom(newZoom)
      setPan(newPan)
    }
  }, [zoom, pan, MAX_ZOOM, MIN_ZOOM])
  
  // Pan functionality
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === diagramRef.current && e.button === 0) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [])
  
  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint, zoom])
  
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])
  
  // Canvas pan event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove)
      document.addEventListener('mouseup', handleCanvasMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove)
        document.removeEventListener('mouseup', handleCanvasMouseUp)
      }
    }
  }, [isPanning, handleCanvasMouseMove, handleCanvasMouseUp])
  
  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(MAX_ZOOM, zoom + 0.2)
    setZoom(newZoom)
  }, [zoom, MAX_ZOOM])
  
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoom - 0.2)
    setZoom(newZoom)
  }, [zoom, MIN_ZOOM])
  
  const handleResetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body && !(e.target as HTMLElement).closest('[data-schema-diagram]')) {
        return
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            handleZoomIn()
            break
          case '-':
            e.preventDefault()
            handleZoomOut()
            break
          case '0':
            e.preventDefault()
            handleResetZoom()
            break
        }
      } else {
        const panAmount = 50 / zoom
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault()
            setPan(prev => ({ x: prev.x, y: prev.y + panAmount }))
            break
          case 'ArrowDown':
            e.preventDefault()
            setPan(prev => ({ x: prev.x, y: prev.y - panAmount }))
            break
          case 'ArrowLeft':
            e.preventDefault()
            setPan(prev => ({ x: prev.x + panAmount, y: prev.y }))
            break
          case 'ArrowRight':
            e.preventDefault()
            setPan(prev => ({ x: prev.x - panAmount, y: prev.y }))
            break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleZoomIn, handleZoomOut, handleResetZoom, zoom])

  const getFieldTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'uuid':
      case 'text':
        return 'bg-blue-100 text-blue-700'
      case 'number':
      case 'decimal':
        return 'bg-blue-100 text-blue-700'
      case 'boolean':
        return 'bg-purple-100 text-purple-700'
      case 'date':
      case 'datetime':
        return 'bg-orange-100 text-orange-700'
      case 'json':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getFieldIcon = (field: FieldSchema) => {
    if (field.isPrimary) return <Key className="w-3 h-3 text-yellow-600" />
    if (field.isForeignKey) return <Link className="w-3 h-3 text-blue-600" />
    if (field.hasIndex) return <Zap className="w-3 h-3 text-blue-600" />
    return null
  }

  const renderConnection = (connection: Connection) => {
    const fromTable = schema.find(t => t.id === connection.from.tableId)
    const toTable = schema.find(t => t.id === connection.to.tableId)
    
    if (!fromTable?.position || !toTable?.position) return null
    
    const fromX = fromTable.position.x + 200 // Table width
    const fromY = fromTable.position.y + 50  // Approximate field position
    const toX = toTable.position.x
    const toY = toTable.position.y + 50
    
    return (
      <svg
        key={`${connection.from.tableId}-${connection.to.tableId}`}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="#6b7280"
          strokeWidth="2"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    )
  }

  const handleAddTable = () => {
    const newTable: TableSchema = {
      id: `table_${Date.now()}`,
      name: `table_${schema.length + 1}`,
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
      indexes: [{ name: `table_${schema.length + 1}_pkey`, fields: ['id'], isUnique: true }],
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      estimatedRows: 0
    }
    
    const updatedSchema = [...schema, newTable]
    dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
  }

  const handleTableAction = (action: string, table: TableSchema) => {
    switch (action) {
      case 'edit':
        onTableEdit?.(table)
        break
      case 'duplicate':
        onTableDuplicate?.(table)
        break
      case 'delete':
        onTableDelete?.(table.id)
        break
    }
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No project selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Database Schema</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {schema.length} tables
              </Badge>
              <Badge variant="outline" className="text-xs">
                {schema.reduce((acc, table) => acc + table.fields.length, 0)} fields
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Zoom Controls */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-none border-r"
              >
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="px-1.5 sm:px-2 text-xs sm:text-sm font-mono min-w-[3rem] sm:min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-none border-l"
              >
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              title="Reset zoom and pan"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              {showConnections ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">Relations</span>
            </Button>
            
            <Button
              onClick={handleAddTable}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Schema Diagram */}
      <div 
        ref={diagramRef}
        data-schema-diagram
        tabIndex={0}
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 focus:outline-none"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        title="Use mouse wheel to zoom, drag to pan, or use Ctrl +/- and arrow keys"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Connection Lines */}
          {showConnections && connections.map(renderConnection)}
          
          {/* Tables */}
          {schema.map((table) => (
          <Card
            key={table.id}
            className={`absolute w-64 sm:w-72 shadow-lg transition-all duration-200 cursor-move ${
              selectedTable === table.id ? 'ring-2 ring-blue-500' : ''
            } ${draggedTable === table.id ? 'shadow-xl z-10' : 'z-20'}`}
            style={{
              left: table.position?.x || 0,
              top: table.position?.y || 0,
            }}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
          >
            <CardHeader className="pb-3 bg-white rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <Database className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{table.name}</h4>
                    <p className="text-xs text-gray-500">{table.description}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTableAction('edit', table)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Table
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTableAction('duplicate', table)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleTableAction('delete', table)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-48 overflow-y-auto">
                {table.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`flex items-center justify-between px-3 py-2 text-xs border-b border-gray-100 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFieldIcon(field)}
                      <span className="font-medium text-gray-900 truncate">
                        {field.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-1 py-0 ${getFieldTypeColor(field.type)}`}
                      >
                        {field.type}
                      </Badge>
                      
                      {field.isRequired && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {table.fields.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-xs">
                  No fields defined
                </div>
              )}
            </CardContent>
          </Card>
          ))}

          {/* Empty State */}
          {schema.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Yet</h3>
                <p className="text-gray-600 mb-4 max-w-sm">
                  Start building your database schema by adding tables or chatting with AI
                </p>
                <Button onClick={handleAddTable} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Table
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-2 text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>
              {schema.length} tables, {connections.length} relations
            </span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            {selectedTable && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-blue-600 truncate max-w-32 sm:max-w-none">
                  {schema.find(t => t.id === selectedTable)?.name}
                </span>
              </>
            )}
            <span className="text-gray-400 hidden md:inline">|</span>
            <span className="text-gray-400 hidden md:inline">
              Ctrl +/- zoom â€¢ Arrows pan â€¢ Ctrl 0 reset
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}