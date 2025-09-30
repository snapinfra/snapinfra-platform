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
  Panel,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Eye,
  EyeOff,
  Network,
  RotateCcw,
  Save,
  Download,
  Upload,
  Palette,
  Grid,
  MousePointer2,
  Trash2
} from "lucide-react"

import ArchitectureNodeComponent, { ArchitectureNodeData } from './architecture-node'
import { SystemArchitecture, ArchitectureNode, ArchitectureEdge } from '@/lib/types/architecture'
import { getNodeTypeColor, getNodeTypeIcon, architectureTemplates } from '@/lib/utils/architecture'

interface SystemArchitectureEditorProps {
  architecture: SystemArchitecture
  onArchitectureChange?: (architecture: SystemArchitecture) => void
  onSave?: () => void
  readonly?: boolean
}

const nodeTypes: NodeTypes = {
  'database': ArchitectureNodeComponent,
  'api-service': ArchitectureNodeComponent,
  'authentication': ArchitectureNodeComponent,
  'frontend': ArchitectureNodeComponent,
  'external-service': ArchitectureNodeComponent,
  'load-balancer': ArchitectureNodeComponent,
  'cache': ArchitectureNodeComponent,
  'queue': ArchitectureNodeComponent,
  'api-gateway': ArchitectureNodeComponent,
  'service-mesh': ArchitectureNodeComponent,
  'cdn': ArchitectureNodeComponent,
  'monitoring': ArchitectureNodeComponent,
  'logging': ArchitectureNodeComponent,
  'search-engine': ArchitectureNodeComponent,
  'data-warehouse': ArchitectureNodeComponent,
  'streaming': ArchitectureNodeComponent,
  'container-registry': ArchitectureNodeComponent,
  'secrets-manager': ArchitectureNodeComponent,
  'backup-storage': ArchitectureNodeComponent,
  'analytics': ArchitectureNodeComponent,
  'ml-service': ArchitectureNodeComponent,
  'notification-service': ArchitectureNodeComponent,
  'scheduler': ArchitectureNodeComponent,
  'workflow-engine': ArchitectureNodeComponent,
  'identity-provider': ArchitectureNodeComponent,
  'vpn': ArchitectureNodeComponent,
  'firewall': ArchitectureNodeComponent,
  'dns': ArchitectureNodeComponent,
  'certificate-manager': ArchitectureNodeComponent,
  'artifact-repository': ArchitectureNodeComponent,
  'ci-cd': ArchitectureNodeComponent,
  'testing-service': ArchitectureNodeComponent,
}

const convertArchitectureNodeToReactFlowNode = (
  node: ArchitectureNode,
  onEdit?: () => void,
  onDelete?: () => void,
  onDuplicate?: () => void,
  onConfigure?: () => void
): Node<ArchitectureNodeData> => ({
  id: node.id,
  type: node.type,
  position: node.position,
  data: {
    ...node.data,
    onEdit,
    onDelete,
    onDuplicate,
    onConfigure,
  },
})

export function SystemArchitectureEditor({ 
  architecture, 
  onArchitectureChange,
  onSave,
  readonly = false 
}: SystemArchitectureEditorProps) {
  const [showConnections, setShowConnections] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
  const [newNodeType, setNewNodeType] = useState<ArchitectureNode['type']>('api-service')
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeDescription, setNewNodeDescription] = useState('')

  const { fitView, screenToFlowPosition } = useReactFlow()

  // Define handler functions first
  const handleNodeEdit = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  const handleNodeDelete = useCallback((nodeId: string) => {
    if (readonly) return
    
    if (onArchitectureChange) {
      onArchitectureChange({
        ...architecture,
        nodes: architecture.nodes.filter(n => n.id !== nodeId),
        edges: architecture.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    }
  }, [architecture, onArchitectureChange, readonly])

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    if (readonly) return
    
    const originalNode = architecture.nodes.find(n => n.id === nodeId)
    if (originalNode && onArchitectureChange) {
      const newNode: ArchitectureNode = {
        ...originalNode,
        id: `node-${Date.now()}`,
        position: {
          x: originalNode.position.x + 50,
          y: originalNode.position.y + 50
        },
        data: {
          ...originalNode.data,
          name: `${originalNode.data.name} Copy`
        }
      }

      onArchitectureChange({
        ...architecture,
        nodes: [...architecture.nodes, newNode],
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    }
  }, [architecture, onArchitectureChange, readonly])

  const handleNodeConfigure = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  // Convert architecture to ReactFlow format
  const initialNodes = useMemo(() => {
    return architecture.nodes.map(node => convertArchitectureNodeToReactFlowNode(
      node,
      () => handleNodeEdit(node.id),
      () => handleNodeDelete(node.id),
      () => handleNodeDuplicate(node.id),
      () => handleNodeConfigure(node.id)
    ))
  }, [architecture.nodes, handleNodeEdit, handleNodeDelete, handleNodeDuplicate, handleNodeConfigure])

  const initialEdges = useMemo(() => {
    return architecture.edges.map(edge => ({
      ...edge,
      type: edge.type || 'smoothstep',
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
      labelStyle: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#374151',
      },
    }))
  }, [architecture.edges])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(showConnections ? initialEdges : [])

  // Update nodes when architecture changes
  useEffect(() => {
    const updatedNodes = architecture.nodes.map(node => convertArchitectureNodeToReactFlowNode(
      node,
      () => handleNodeEdit(node.id),
      () => handleNodeDelete(node.id),
      () => handleNodeDuplicate(node.id),
      () => handleNodeConfigure(node.id)
    ))
    setNodes(updatedNodes)
  }, [architecture.nodes])

  // Update edges when showConnections changes
  useEffect(() => {
    setEdges(showConnections ? initialEdges : [])
  }, [showConnections, initialEdges])

  const handleNodesChange = useCallback((changes: any[]) => {
    if (readonly) return
    onNodesChange(changes)
    
    // Update architecture with new positions
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)
    if (positionChanges.length > 0 && onArchitectureChange) {
      const updatedNodes = architecture.nodes.map(node => {
        const positionChange = positionChanges.find(change => change.id === node.id)
        if (positionChange) {
          return {
            ...node,
            position: positionChange.position
          }
        }
        return node
      })
      
      onArchitectureChange({
        ...architecture,
        nodes: updatedNodes,
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    }
  }, [onNodesChange, architecture, onArchitectureChange, readonly])

  const onConnect = useCallback((params: Connection) => {
    if (readonly) return
    
    const newEdge: ArchitectureEdge = {
      id: `edge-${Date.now()}`,
      source: params.source!,
      target: params.target!,
      type: 'smoothstep',
      label: 'Connection',
      data: {
        protocol: 'HTTPS',
        security: 'JWT'
      }
    }
    
    if (onArchitectureChange) {
      onArchitectureChange({
        ...architecture,
        edges: [...architecture.edges, newEdge],
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    }
    
    setEdges((eds) => addEdge({
      ...params,
      id: newEdge.id,
      type: 'smoothstep',
      animated: true,
      label: newEdge.label,
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
    }, eds))
  }, [setEdges, architecture, onArchitectureChange, readonly])

  const handleAddNode = useCallback(() => {
    if (readonly) return
    
    const newNode: ArchitectureNode = {
      id: `node-${Date.now()}`,
      type: newNodeType,
      position: screenToFlowPosition({ x: 300, y: 300 }),
      data: {
        name: newNodeName || `New ${newNodeType}`,
        description: newNodeDescription || `A new ${newNodeType} component`,
        color: getNodeTypeColor(newNodeType),
        metadata: {
          technology: newNodeType === 'database' ? 'PostgreSQL' : 
                      newNodeType === 'frontend' ? 'React' : 
                      newNodeType === 'api-service' ? 'Node.js' : ''
        }
      }
    }

    if (onArchitectureChange) {
      onArchitectureChange({
        ...architecture,
        nodes: [...architecture.nodes, newNode],
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    }

    setNewNodeName('')
    setNewNodeDescription('')
    setShowAddNodeDialog(false)
  }, [newNodeType, newNodeName, newNodeDescription, architecture, onArchitectureChange, readonly, screenToFlowPosition])


  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 })
  }, [fitView])

  const nodeTypeOptions = [
    { value: 'frontend', label: 'Frontend App' },
    { value: 'api-service', label: 'API Service' },
    { value: 'database', label: 'Database' },
    { value: 'authentication', label: 'Auth Service' },
    { value: 'api-gateway', label: 'API Gateway' },
    { value: 'load-balancer', label: 'Load Balancer' },
    { value: 'cache', label: 'Cache' },
    { value: 'queue', label: 'Message Queue' },
    { value: 'cdn', label: 'CDN' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'logging', label: 'Logging' },
    { value: 'search-engine', label: 'Search Engine' },
    { value: 'data-warehouse', label: 'Data Warehouse' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'ml-service', label: 'ML/AI Service' },
    { value: 'notification-service', label: 'Notifications' },
    { value: 'scheduler', label: 'Task Scheduler' },
    { value: 'secrets-manager', label: 'Secrets Manager' },
    { value: 'backup-storage', label: 'Backup Storage' },
    { value: 'ci-cd', label: 'CI/CD Pipeline' },
    { value: 'container-registry', label: 'Container Registry' },
    { value: 'external-service', label: 'External Service' },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">System Architecture</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {architecture.nodes.length} components
              </Badge>
              <Badge variant="outline" className="text-xs">
                {architecture.edges.length} connections
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              {showConnections ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">Connections</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            >
              <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Minimap</span>
            </Button>

            {!readonly && (
              <>
                <Button
                  onClick={() => setShowAddNodeDialog(true)}
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Node</span>
                </Button>

                {onSave && (
                  <Button
                    variant="outline"
                    onClick={onSave}
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                )}
              </>
            )}
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
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable={!readonly}
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
              nodeColor={(node) => {
                return getNodeTypeColor(node.type as ArchitectureNode['type'])
              }}
            />
          )}

          {/* Custom Panel for Empty State */}
          {architecture.nodes.length === 0 && (
            <Panel position="center" className="pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Network className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Architecture Components</h3>
                <p className="text-gray-600 mb-4 max-w-sm">
                  Start building your system architecture by adding components
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
              {architecture.nodes.length} components, {showConnections ? architecture.edges.length : 0} connections
            </span>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              System Architecture Editor
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span>Drag components • Connect handles • Zoom with mouse wheel</span>
          </div>
        </div>
      </div>

      {/* Add Node Dialog */}
      <Dialog open={showAddNodeDialog} onOpenChange={setShowAddNodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Architecture Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="node-type">Component Type</Label>
              <Select value={newNodeType} onValueChange={(value) => setNewNodeType(value as ArchitectureNode['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="node-name">Component Name</Label>
              <Input
                id="node-name"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder={`New ${newNodeType}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Input
                id="node-description"
                value={newNodeDescription}
                onChange={(e) => setNewNodeDescription(e.target.value)}
                placeholder="Brief description of this component"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}