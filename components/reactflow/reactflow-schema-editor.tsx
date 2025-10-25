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
  ZoomOut
} from "lucide-react"

import TableNode, { TableNodeData } from './table-node'
import { useAppContext } from "@/lib/app-context"
import type { TableSchema } from "@/lib/app-context"

interface ReactFlowSchemaEditorProps {
  onTableEdit?: (table: TableSchema) => void
  onTableDelete?: (tableId: string) => void
  onTableDuplicate?: (table: TableSchema) => void
}

const nodeTypes: NodeTypes = {
  table: TableNode,
}

// Convert TableSchema to ReactFlow Node
const convertTableToNode = (
  table: TableSchema,
  onEdit?: () => void,
  onDelete?: () => void,
  onDuplicate?: () => void
): Node<TableNodeData> => ({
  id: table.id,
  type: 'table',
  position: table.position || { x: 0, y: 0 },
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

// Generate edges based on foreign key relationships
const generateEdges = (tables: TableSchema[]): Edge[] => {
  const edges: Edge[] = []

  tables.forEach(table => {
    table.fields.forEach(field => {
      if (field.isForeignKey) {
        // Find the referenced table (simplified logic)
        const referencedTable = tables.find(t =>
          t.name.toLowerCase() === field.name.replace(/_?id$/i, '').toLowerCase() ||
          t.name.toLowerCase() === field.name.replace(/_?(uuid|key)$/i, '').toLowerCase()
        )

        if (referencedTable) {
          const primaryKeyField = referencedTable.fields.find(f => f.isPrimary)
          if (primaryKeyField) {
            edges.push({
              id: `${table.id}-${field.id}-${referencedTable.id}-${primaryKeyField.id}`,
              source: table.id,
              target: referencedTable.id,
              sourceHandle: `${table.id}-${field.id}-source`,
              targetHandle: `${referencedTable.id}-${primaryKeyField.id}-target`,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#6b7280',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#6b7280',
              },
              label: 'FK',
              labelStyle: {
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#6b7280',
              },
            })
          }
        }
      }
    })
  })

  return edges
}

export function ReactFlowSchemaEditor({
  onTableEdit,
  onTableDelete,
  onTableDuplicate
}: ReactFlowSchemaEditorProps) {
  const { state, dispatch } = useAppContext()
  const { currentProject } = state
  const [showRelations, setShowRelations] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)

  // Ensure schema is always an array
  const schema = Array.isArray(currentProject?.schema) ? currentProject.schema : []

  // Convert schema to ReactFlow nodes
  const initialNodes = useMemo(() => {
    if (!Array.isArray(schema) || schema.length === 0) return []
    
    return schema.map(table => convertTableToNode(
      table,
      () => onTableEdit?.(table),
      () => onTableDelete?.(table.id),
      () => onTableDuplicate?.(table)
    ))
  }, [schema, onTableEdit, onTableDelete, onTableDuplicate])

  // Generate edges from foreign key relationships
  const initialEdges = useMemo(() => {
    return generateEdges(schema)
  }, [schema])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(showRelations ? initialEdges : [])

  // Update nodes when schema changes
  useEffect(() => {
    if (!Array.isArray(schema) || schema.length === 0) {
      setNodes([])
      return
    }
    
    const updatedNodes = schema.map(table => convertTableToNode(
      table,
      () => onTableEdit?.(table),
      () => onTableDelete?.(table.id),
      () => onTableDuplicate?.(table)
    ))
    setNodes(updatedNodes)
  }, [schema, onTableEdit, onTableDelete, onTableDuplicate])

  // Update edges when showRelations changes
  useEffect(() => {
    setEdges(showRelations ? generateEdges(schema) : [])
  }, [showRelations, schema])

  // Handle node position changes and sync back to schema
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    
    if (!Array.isArray(schema) || schema.length === 0) return
    
    // Update schema with new positions
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)
    if (positionChanges.length > 0) {
      const updatedSchema = schema.map(table => {
        const positionChange = positionChanges.find(change => change.id === table.id)
        if (positionChange) {
          return {
            ...table,
            position: positionChange.position
          }
        }
        return table
      })
      dispatch({ type: 'UPDATE_SCHEMA', payload: updatedSchema })
    }
  }, [onNodesChange, schema, dispatch])

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

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
    </div>
  )
}