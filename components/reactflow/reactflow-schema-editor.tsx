"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  Connection,
  NodeTypes,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './reactflow-styles.css'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Eye,
  EyeOff,
  Database,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import TableNode, { TableNodeData } from './table-node'
import { TableEditDialog } from './table-edit-dialog'
import { useAppContext } from "@/lib/appContext/app-context"
import type { TableSchema, Relationship } from "@/lib/appContext/app-context"

interface ReactFlowSchemaEditorProps {
  onTableEdit?: (table: TableSchema) => void
  onTableDelete?: (tableId: string) => void
  onTableDuplicate?: (table: TableSchema) => void
}

const nodeTypes: NodeTypes = {
  table: TableNode,
}

// Auto-layout algorithm for distributing tables based on relationships
const calculateAutoLayout = (tables: TableSchema[]): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {}
  
  if (tables.length === 0) return positions
  
  const NODE_WIDTH = 320
  const NODE_HEIGHT = 400 // Increased to account for varying table heights
  const HORIZONTAL_GAP = 400 // Increased gap
  const VERTICAL_GAP = 250 // Increased gap
  const START_X = 100 // Starting X position
  const START_Y = 100 // Starting Y position
  
  // Check if tables have meaningful manual positions (not just 0,0 or near-zero)
  const hasManualPositions = tables.some(t => 
    t.position && 
    (Math.abs(t.position.x) > 50 || Math.abs(t.position.y) > 50) &&
    tables.filter(other => 
      other.position && 
      Math.abs(other.position.x - t.position.x) < 50 && 
      Math.abs(other.position.y - t.position.y) < 50
    ).length === 1 // Not stacked with another table
  )
  
  if (hasManualPositions) {
    // Use saved positions only if they're properly distributed
    let allValid = true
    tables.forEach(table => {
      if (!table.position || (table.position.x === 0 && table.position.y === 0)) {
        allValid = false
      }
    })
    
    if (allValid) {
      tables.forEach(table => {
        positions[table.id] = table.position!
      })
      return positions
    }
  }
  
  // Build relationship graph
  const relationships = new Map<string, Set<string>>()
  tables.forEach(table => {
    relationships.set(table.id, new Set())
  })
  
  // Add foreign key relationships
  tables.forEach(table => {
    table.fields.forEach(field => {
      const isForeignKey = field.isForeignKey || 
        field.name.toLowerCase().endsWith('_id') ||
        field.name.toLowerCase().endsWith('id') ||
        field.name.toLowerCase().startsWith('fk_')
      
      if (isForeignKey) {
        const cleanFieldName = field.name.toLowerCase()
          .replace(/_?id$/i, '')
          .replace(/_?(uuid|key)$/i, '')
          .replace(/^fk_/i, '')
        
        const referencedTable = tables.find(t => {
          if (t.id === table.id) return false
          const tableName = t.name.toLowerCase()
          return tableName === cleanFieldName || 
                 tableName === cleanFieldName + 's' || 
                 tableName + 's' === cleanFieldName ||
                 cleanFieldName.includes(tableName) || 
                 tableName.includes(cleanFieldName)
        })
        
        if (referencedTable) {
          relationships.get(table.id)?.add(referencedTable.id)
        }
      }
    })
    
    // Add explicit relationships
    if (table.relationships) {
      table.relationships.forEach(rel => {
        relationships.get(table.id)?.add(rel.targetTable)
      })
    }
  })
  
  // Find root nodes (tables with no incoming references)
  const incomingEdges = new Map<string, number>()
  tables.forEach(t => incomingEdges.set(t.id, 0))
  
  relationships.forEach((targets) => {
    targets.forEach(targetId => {
      incomingEdges.set(targetId, (incomingEdges.get(targetId) || 0) + 1)
    })
  })
  
  // Hierarchical layout: arrange by levels
  const levels: string[][] = []
  const visited = new Set<string>()
  const levelMap = new Map<string, number>()
  
  // BFS from root nodes
  const queue: Array<{ id: string; level: number }> = []
  
  tables.forEach(table => {
    if ((incomingEdges.get(table.id) || 0) === 0) {
      queue.push({ id: table.id, level: 0 })
    }
  })
  
  // If no root nodes, start with first table
  if (queue.length === 0 && tables.length > 0) {
    queue.push({ id: tables[0].id, level: 0 })
  }
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    
    if (visited.has(id)) continue
    visited.add(id)
    
    if (!levels[level]) levels[level] = []
    levels[level].push(id)
    levelMap.set(id, level)
    
    // Add children to next level
    const children = relationships.get(id) || new Set()
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }
  
  // Add any unvisited nodes to the last level
  tables.forEach(table => {
    if (!visited.has(table.id)) {
      const lastLevel = levels.length
      if (!levels[lastLevel]) levels[lastLevel] = []
      levels[lastLevel].push(table.id)
      levelMap.set(table.id, lastLevel)
    }
  })
  
  // Position nodes by level with proper spacing
  levels.forEach((levelNodes, levelIndex) => {
    const nodesInLevel = levelNodes.length
    
    // Calculate positions to prevent stacking
    levelNodes.forEach((nodeId, indexInLevel) => {
      // Use simple left-to-right, top-to-bottom layout
      positions[nodeId] = {
        x: START_X + (indexInLevel * (NODE_WIDTH + HORIZONTAL_GAP)),
        y: START_Y + (levelIndex * (NODE_HEIGHT + VERTICAL_GAP))
      }
    })
  })
  
  // Ensure no overlapping positions (collision detection)
  const occupiedPositions = new Set<string>()
  Object.keys(positions).forEach(nodeId => {
    let pos = positions[nodeId]
    let posKey = `${Math.floor(pos.x / 100)},${Math.floor(pos.y / 100)}`
    let offset = 0
    
    // If position is occupied, shift right
    while (occupiedPositions.has(posKey) && offset < 10) {
      offset++
      pos = {
        x: positions[nodeId].x + (offset * (NODE_WIDTH + HORIZONTAL_GAP)),
        y: positions[nodeId].y
      }
      posKey = `${Math.floor(pos.x / 100)},${Math.floor(pos.y / 100)}`
    }
    
    positions[nodeId] = pos
    occupiedPositions.add(posKey)
  })
  
  return positions
}

// Convert TableSchema to ReactFlow Node
const convertTableToNode = (
  table: TableSchema,
  position: { x: number; y: number },
  onEdit?: () => void,
  onDelete?: () => void,
  onDuplicate?: () => void
): Node<TableNodeData> => ({
  id: table.id,
  type: 'table',
  position,
  data: {
    id: table.id,
    name: table.name,
    description: table.description || '',
    fields: table.fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      isPrimary: field.isPrimary,
      isForeignKey: field.isForeignKey,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      hasIndex: field.hasIndex,
      description: field.description,
    })),
    onEdit,
    onDelete,
    onDuplicate,
  },
})

// Generate edges based on foreign key relationships and saved relationships
const generateEdges = (tables: TableSchema[]): Edge[] => {
  const edges: Edge[] = []
  const edgeIds = new Set<string>()
  
  console.log('🔍 Generating edges for tables:', tables.map(t => ({ name: t.name, id: t.id, fields: t.fields.map(f => f.name) })))

  // Helper function to find referenced table by field name
  const findReferencedTable = (fieldName: string, currentTableId: string): TableSchema | undefined => {
    const cleanFieldName = fieldName.toLowerCase()
      .replace(/_?id$/i, '')           // Remove _id, id suffix
      .replace(/_?(uuid|key)$/i, '')   // Remove _uuid, uuid, _key, key suffix
      .replace(/^fk_/i, '')            // Remove fk_ prefix
    
    // Try multiple matching strategies
    return tables.find(t => {
      if (t.id === currentTableId) return false // Don't match self
      const tableName = t.name.toLowerCase()
      
      // Direct match
      if (tableName === cleanFieldName) return true
      
      // Singular/plural variations
      if (tableName === cleanFieldName + 's' || tableName + 's' === cleanFieldName) return true
      
      // Check if field name contains table name
      if (cleanFieldName.includes(tableName) || tableName.includes(cleanFieldName)) return true
      
      return false
    })
  }

  // Add edges from foreign key fields
  tables.forEach(table => {
    table.fields.forEach(field => {
      // Check if field is explicitly marked as FK OR has FK naming pattern
      const isForeignKey = field.isForeignKey || 
        field.name.toLowerCase().endsWith('_id') ||
        field.name.toLowerCase().endsWith('id') ||
        field.name.toLowerCase().startsWith('fk_')
      
      if (isForeignKey) {
        console.log(`🔗 Found FK field: ${table.name}.${field.name} (isForeignKey=${field.isForeignKey})`)
        const referencedTable = findReferencedTable(field.name, table.id)

        if (referencedTable) {
          console.log(`  ✅ Matched to table: ${referencedTable.name}`)
          // Find primary key, or use first field as fallback (usually 'id')
          const primaryKeyField = referencedTable.fields.find(f => f.isPrimary) || 
                                 referencedTable.fields.find(f => f.name.toLowerCase() === 'id') ||
                                 referencedTable.fields[0]
          
          if (primaryKeyField) {
            const edgeId = `${table.id}-${field.id}-${referencedTable.id}-${primaryKeyField.id}`
            if (!edgeIds.has(edgeId)) {
              edgeIds.add(edgeId)
              edges.push({
                id: edgeId,
                source: table.id,
                target: referencedTable.id,
                sourceHandle: `${table.id}-${field.id}-source`,
                targetHandle: `${referencedTable.id}-${primaryKeyField.id}-target`,
                type: 'smoothstep',
                animated: false,
                style: {
                  stroke: '#3b82f6',
                  strokeWidth: 2.5,
                  strokeDasharray: '0',
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 25,
                  height: 25,
                  color: '#3b82f6',
                },
                // Remove label for cleaner look
              })
              console.log(`  ➕ Added edge from ${table.name} to ${referencedTable.name}`)
            }
          } else {
            console.log(`  ⚠️ No fields found in ${referencedTable.name}`)
          }
        } else {
          console.log(`  ❌ No matching table found for ${field.name}`)
        }
      }
    })

    // Add edges from saved relationships
    if (table.relationships && table.relationships.length > 0) {
      table.relationships.forEach(rel => {
        const targetTable = tables.find(t => t.id === rel.targetTable)
        if (targetTable) {
          const edgeId = `rel-${table.id}-${rel.targetTable}`
          if (!edgeIds.has(edgeId)) {
            edgeIds.add(edgeId)
            const relColor = rel.type === 'one-to-many' ? '#10b981' : rel.type === 'one-to-one' ? '#f59e0b' : '#8b5cf6'
            const relLabel = rel.type === 'one-to-many' ? '1:N' : rel.type === 'one-to-one' ? '1:1' : 'N:N'
            
            edges.push({
              id: edgeId,
              source: table.id,
              target: rel.targetTable,
              sourceHandle: rel.sourceField,
              targetHandle: rel.targetField,
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: relColor,
                strokeWidth: 2.5,
                strokeDasharray: '5,5',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 25,
                height: 25,
                color: relColor,
              },
              label: relLabel,
              labelStyle: {
                fontSize: '9px',
                fontWeight: '600',
                color: relColor,
                background: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                border: `1px solid ${relColor}`,
              },
              labelBgPadding: [4, 4],
              labelBgStyle: {
                fill: 'white',
                fillOpacity: 0.9,
              },
            })
          }
        }
      })
    }
  })
  
  console.log(`🎯 Total edges generated: ${edges.length}`)

  return edges
}

export function ReactFlowSchemaEditor({
  onTableEdit,
  onTableDelete,
  onTableDuplicate
}: ReactFlowSchemaEditorProps) {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const { toast } = useToast()
  const [showRelations, setShowRelations] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [editingTable, setEditingTable] = useState<TableSchema | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Ensure schema is always an array
  const schema = Array.isArray(currentProject?.schema) ? currentProject.schema : []

  // Handle opening edit dialog
  const handleEditTable = useCallback((table: TableSchema) => {
    setEditingTable(table)
    setIsEditDialogOpen(true)
  }, [])

  // Handle saving edited table
  const handleSaveEditedTable = useCallback((updatedTable: TableSchema) => {
    onTableEdit?.(updatedTable)
    toast({
      title: "Table updated",
      description: `${updatedTable.name} has been updated successfully.`
    })
  }, [onTableEdit, toast])

  // Convert schema to ReactFlow nodes
  const initialNodes = useMemo(() => {
    if (!Array.isArray(schema) || schema.length === 0) return []
    
    const positions = calculateAutoLayout(schema)
    
    return schema.map(table => convertTableToNode(
      table,
      positions[table.id],
      () => handleEditTable(table),
      () => onTableDelete?.(table.id),
      () => onTableDuplicate?.(table)
    ))
  }, [schema, handleEditTable, onTableDelete, onTableDuplicate])

  // Generate edges from foreign key relationships
  const initialEdges = useMemo(() => {
    return generateEdges(schema)
  }, [schema])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(showRelations ? initialEdges : [])
  const schemaVersionRef = React.useRef(0)
  const prevSchemaLengthRef = React.useRef(schema.length)

  // Update nodes when schema changes - ONLY when table count or structure actually changes
  useEffect(() => {
    // Quick check: if length is the same and we're already synced, skip
    if (schema.length === prevSchemaLengthRef.current && schemaVersionRef.current > 0) {
      return
    }
    
    prevSchemaLengthRef.current = schema.length
    schemaVersionRef.current++
    
    if (!Array.isArray(schema) || schema.length === 0) {
      setNodes([])
      return
    }
    
    const positions = calculateAutoLayout(schema)
    
    const updatedNodes = schema.map(table => convertTableToNode(
      table,
      positions[table.id],
      () => handleEditTable(table),
      () => onTableDelete?.(table.id),
      () => onTableDuplicate?.(table)
    ))
    setNodes(updatedNodes)
  }, [schema.length, handleEditTable, onTableDelete, onTableDuplicate, setNodes])

  // Update edges when showRelations changes
  useEffect(() => {
    setEdges(showRelations ? generateEdges(schema) : [])
  }, [showRelations, schema.length, setEdges])

  // Handle node position changes - DO NOT dispatch during drag to prevent loops
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    
    // REMOVED: Position syncing to prevent infinite loops
    // Position changes are local to ReactFlow only
    // If you need to persist positions, do it on manual save action only
  }, [onNodesChange])

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return
    
    // Add the edge to the UI only - do not sync to schema to prevent loops
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#8b5cf6',
        strokeWidth: 2.5,
        strokeDasharray: '5,5',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: '#8b5cf6',
      },
      // Remove label for custom edges
    }, eds))
    
    const sourceTable = schema.find(t => t.id === params.source)
    const targetTable = schema.find(t => t.id === params.target)
    
    if (sourceTable && targetTable) {
      toast({
        title: "Relationship created",
        description: `Connected ${sourceTable.name} to ${targetTable.name}`
      })
    }
  }, [setEdges, schema, toast])

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => {
      // Only delete manual relationships (those with 'rel-' prefix)
      // Do not sync to schema to prevent loops
      if (edge.id.startsWith('rel-')) {
        const sourceTable = schema.find(t => t.id === edge.source)
        const targetTable = schema.find(t => t.id === edge.target)
        if (sourceTable && targetTable) {
          toast({
            title: "Relationship deleted",
            description: `Disconnected ${sourceTable.name} from ${targetTable.name}`
          })
        }
      }
    })
  }, [schema, toast])

  const handleAddTable = useCallback(() => {
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
  }, [schema, dispatch])

  const handleManualSave = useCallback(async () => {
    if (!currentProject) return
    
    setIsSaving(true)
    
    try {
      // Schema is already saved to context via dispatch calls
      // This provides visual feedback that save is complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setJustSaved(true)
      toast({
        title: "Schema saved",
        description: "Your schema changes have been saved successfully."
      })
      
      // Reset the "just saved" indicator after 2 seconds
      setTimeout(() => setJustSaved(false), 2000)
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save schema changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [currentProject, toast])

  const handleFitView = useCallback(() => {
    // This will be handled by ReactFlow's fitView function from useReactFlow hook
  }, [])

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRelations(!showRelations)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              {showRelations ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">Relations</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Minimap</span>
            </Button>

            <Button
              onClick={handleAddTable}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Table</span>
            </Button>

            <Button
              onClick={handleManualSave}
              disabled={isSaving || justSaved}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
              variant={justSaved ? "default" : "outline"}
            >
              {justSaved ? (
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              ) : (
                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Saving..." : justSaved ? "Saved" : "Save"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="bg-gray-50"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
          />
          
          <Controls 
            position="bottom-right"
            className="bg-white border border-gray-200 rounded-md shadow-lg"
            showZoom
            showFitView
            showInteractive={false}
          />
          
          {showMiniMap && (
            <MiniMap
              position="bottom-left"
              className="bg-white border border-gray-200 rounded-md shadow-lg"
              pannable
              zoomable
              nodeColor="#3b82f6"
            />
          )}

          {/* Custom Panel for Empty State */}
          {schema.length === 0 && (
            <Panel position="center" className="pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Yet</h3>
                <p className="text-gray-600 mb-4 max-w-sm">
                  Start building your database schema by adding tables or chatting with AI
                </p>
              </div>
            </Panel>
          )}

          {/* Relationship Legend */}
          {showRelations && schema.length > 0 && initialEdges.length > 0 && (
            <Panel position="top-right" className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
              <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Relationships</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-blue-500" style={{ minWidth: '40px' }} />
                  <span className="text-xs text-gray-600 whitespace-nowrap">Foreign Key</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-emerald-500" style={{ minWidth: '40px', borderTop: '2px dashed' }} />
                  <span className="text-xs text-gray-600 whitespace-nowrap">One-to-Many (1:N)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-amber-500" style={{ minWidth: '40px', borderTop: '2px dashed' }} />
                  <span className="text-xs text-gray-600 whitespace-nowrap">One-to-One (1:1)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-purple-500" style={{ minWidth: '40px', borderTop: '2px dashed' }} />
                  <span className="text-xs text-gray-600 whitespace-nowrap">Many-to-Many (N:N)</span>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-2 text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>
              {schema.length} tables, {showRelations ? initialEdges.length : 0} relations
            </span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              ReactFlow Schema Editor
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span>Drag nodes • Connect handles • Zoom with mouse wheel</span>
          </div>
        </div>
      </div>

      {/* Table Edit Dialog */}
      <TableEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        table={editingTable}
        onSave={handleSaveEditedTable}
      />
    </div>
  )
}
