"use client"

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
  Save,
  Grid,
  Trash2,
  Check
} from "lucide-react"

import ArchitectureNodeComponent, { ArchitectureNodeData } from './architecture-node'
import { SystemArchitecture, ArchitectureNode, ArchitectureEdge } from '@/lib/types/architecture'
import { getNodeTypeColor, getNodeTypeIcon } from '@/lib/utils/architecture'
import { useOnboardingData } from '@/lib/app-context'

interface SystemArchitectureEditorProps {
  architecture: SystemArchitecture
  onArchitectureChange?: (architecture: SystemArchitecture) => void
  onSave?: () => void
  readonly?: boolean
  type: string
}

// Simple group/layer background node component
const GroupNode = ({ data }: { data: ArchitectureNodeData }) => {
  return (
    <div className="relative" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <div className="absolute top-0 left-0 right-0 px-4 py-3 border-b border-[rgba(0,0,0,0.08)]">
        <div className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wide">
          {data.name}
        </div>
        <div className="text-[10px] text-[#605A57] mt-0.5">
          {data.description}
        </div>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  'group': GroupNode,
  'database': ArchitectureNodeComponent,
  'api-service': ArchitectureNodeComponent,
  'authentication': ArchitectureNodeComponent,
  'frontend': ArchitectureNodeComponent,
  'mobile': ArchitectureNodeComponent,
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
    name: node.data.name,
    description: node.data.description,
    color: node.data.color,
    metadata: node.data.metadata,
    aiExplanation: node.data.aiExplanation,
    onEdit,
    onDelete,
    onDuplicate,
    onConfigure,
  },
  style: node.style,
  draggable: node.type !== 'group',
  selectable: node.type !== 'group',
  zIndex: node.type === 'group' ? -1 : 1,
})

export function SystemArchitectureEditor({
  type,
  architecture,
  onArchitectureChange,
  onSave,
  readonly = false
}: SystemArchitectureEditorProps) {
  const [showConnections, setShowConnections] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false)
  const [showEditNodeDialog, setShowEditNodeDialog] = useState(false)
  const [showEditEdgeDialog, setShowEditEdgeDialog] = useState(false)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editEdgeLabel, setEditEdgeLabel] = useState('')
  const [newNodeType, setNewNodeType] = useState<ArchitectureNode['type']>('api-service')
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeDescription, setNewNodeDescription] = useState('')
  const [editNodeData, setEditNodeData] = useState<{ name: string; description: string; type: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { fitView, screenToFlowPosition } = useReactFlow()
  const { data, updateData } = useOnboardingData()

  // Track if we're updating from props to prevent loops
  const isUpdatingFromPropsRef = useRef(false)

  // Architecture change handler WITHOUT localStorage sync
  const handleArchitectureUpdate = useCallback((updatedArchitecture: SystemArchitecture) => {
    // Prevent update loops
    if (isUpdatingFromPropsRef.current) return

    console.log('handleArchitectureUpdate called with:', updatedArchitecture)

    // Call the original callback if provided
    if (onArchitectureChange) {
      onArchitectureChange(updatedArchitecture)
    }
  }, [onArchitectureChange])

  // Define handler functions
  const handleNodeEdit = useCallback((nodeId: string) => {
    const node = architecture.nodes.find(n => n && n.id === nodeId)
    if (node) {
      setSelectedNodeId(nodeId)
      setEditNodeData({
        name: node.data.name,
        description: node.data.description || '',
        type: node.type
      })
      setShowEditNodeDialog(true)
    }
  }, [architecture.nodes])

  const handleNodeDelete = useCallback((nodeId: string) => {
    if (readonly) return

    const updatedArchitecture = {
      ...architecture,
      nodes: architecture.nodes.filter(n => n && n.id !== nodeId),
      edges: architecture.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)
  }, [architecture, handleArchitectureUpdate, readonly])

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    if (readonly) return

    const originalNode = architecture.nodes.find(n => n && n.id === nodeId)
    if (originalNode) {
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

      const updatedArchitecture = {
        ...architecture,
        nodes: [...architecture.nodes, newNode],
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      }

      handleArchitectureUpdate(updatedArchitecture)
    }
  }, [architecture, handleArchitectureUpdate, readonly])

  const handleNodeConfigure = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  // Convert architecture to ReactFlow format - FILTER OUT NULLS
  const initialNodes = useMemo(() => {
    return architecture.nodes
      .filter(node => node !== null && node !== undefined)
      .map(node => convertArchitectureNodeToReactFlowNode(
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
        stroke: '#005BE3',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#005BE3',
      },
      labelStyle: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#1d1d1f',
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.9,
      },
    }))
  }, [architecture.edges])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(showConnections ? initialEdges : [])


  // Update nodes when architecture changes from external source
  useEffect(() => {
    isUpdatingFromPropsRef.current = true

    // Filter out nulls and create new ReactFlow nodes with fresh callbacks
    const updatedNodes = architecture.nodes
      .filter(node => node !== null && node !== undefined)
      .map(node => convertArchitectureNodeToReactFlowNode(
        node,
        () => handleNodeEdit(node.id),
        () => handleNodeDelete(node.id),
        () => handleNodeDuplicate(node.id),
        () => handleNodeConfigure(node.id)
      ))

    setNodes(updatedNodes)

    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromPropsRef.current = false
    }, 0)
  }, [architecture.nodes, setNodes, handleNodeEdit, handleNodeDelete, handleNodeDuplicate, handleNodeConfigure])

  // Update edges when showConnections changes
  useEffect(() => {
    setEdges(showConnections ? initialEdges : [])
  }, [showConnections, initialEdges, setEdges])

  const handleNodesChange = useCallback((changes: any[]) => {
    if (readonly || isUpdatingFromPropsRef.current) return

    // Always apply changes to ReactFlow state for smooth dragging
    onNodesChange(changes)

    // Only sync position changes when dragging ends
    const positionChanges = changes.filter(change =>
      change.type === 'position' && change.dragging === false && change.position
    )

    if (positionChanges.length > 0) {
      const updatedNodes = architecture.nodes
        .filter(node => node !== null && node !== undefined)
        .map(node => {
          const positionChange = positionChanges.find(change => change.id === node.id)
          if (positionChange) {
            return {
              ...node,
              position: positionChange.position
            }
          }
          return node
        })

      const updatedArchitecture = {
        ...architecture,
        nodes: updatedNodes,
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      }

      handleArchitectureUpdate(updatedArchitecture)
    }
  }, [onNodesChange, architecture, handleArchitectureUpdate, readonly])

  const handleEdgesChange = useCallback((changes: any[]) => {
    if (readonly || isUpdatingFromPropsRef.current) return

    onEdgesChange(changes)

    // Handle edge deletions
    const removeChanges = changes.filter(change => change.type === 'remove')

    if (removeChanges.length > 0) {
      const removedIds = removeChanges.map(change => change.id)
      const updatedEdges = architecture.edges.filter(edge => !removedIds.includes(edge.id))

      const updatedArchitecture = {
        ...architecture,
        edges: updatedEdges,
        metadata: {
          ...architecture.metadata,
          updatedAt: new Date().toISOString()
        }
      }

      handleArchitectureUpdate(updatedArchitecture)
    }
  }, [onEdgesChange, architecture, handleArchitectureUpdate, readonly])

  const onConnect = useCallback((params: Connection) => {
    if (readonly || isUpdatingFromPropsRef.current) return

    const existingEdgeIndex = architecture.edges.findIndex(
      edge => (edge.source === params.source && edge.target === params.target) ||
        (edge.source === params.target && edge.target === params.source)
    )

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

    let updatedEdges: ArchitectureEdge[]

    if (existingEdgeIndex !== -1) {
      updatedEdges = [...architecture.edges]
      updatedEdges[existingEdgeIndex] = newEdge
    } else {
      updatedEdges = [...architecture.edges, newEdge]
    }

    const updatedArchitecture = {
      ...architecture,
      edges: updatedEdges,
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)

    setEdges((eds) => {
      const filteredEdges = eds.filter(
        e => !((e.source === params.source && e.target === params.target) ||
          (e.source === params.target && e.target === params.source))
      )

      return addEdge({
        ...params,
        id: newEdge.id,
        type: 'smoothstep',
        animated: true,
        label: newEdge.label,
        style: {
          stroke: '#005BE3',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#005BE3',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.9,
        },
      }, filteredEdges)
    })
  }, [setEdges, architecture, handleArchitectureUpdate, readonly])

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    if (readonly) return

    event.stopPropagation()
    setSelectedEdgeId(edge.id)
    setEditEdgeLabel(edge.label || '')
    setShowEditEdgeDialog(true)
  }, [readonly])

  const handleUpdateEdge = useCallback(() => {
    if (readonly || !selectedEdgeId) return

    const updatedEdges = architecture.edges.map(edge => {
      if (edge.id === selectedEdgeId) {
        return {
          ...edge,
          label: editEdgeLabel
        }
      }
      return edge
    })

    const updatedArchitecture = {
      ...architecture,
      edges: updatedEdges,
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)

    setShowEditEdgeDialog(false)
    setEditEdgeLabel('')
    setSelectedEdgeId(null)
  }, [selectedEdgeId, editEdgeLabel, architecture, handleArchitectureUpdate, readonly])

  const handleDeleteEdge = useCallback(() => {
    if (readonly || !selectedEdgeId) return

    const updatedEdges = architecture.edges.filter(edge => edge.id !== selectedEdgeId)

    const updatedArchitecture = {
      ...architecture,
      edges: updatedEdges,
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)

    setShowEditEdgeDialog(false)
    setEditEdgeLabel('')
    setSelectedEdgeId(null)
  }, [selectedEdgeId, architecture, handleArchitectureUpdate, readonly])

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

    const updatedArchitecture = {
      ...architecture,
      nodes: [...architecture.nodes.filter(n => n !== null && n !== undefined), newNode],
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)

    setNewNodeName('')
    setNewNodeDescription('')
    setShowAddNodeDialog(false)
  }, [newNodeType, newNodeName, newNodeDescription, architecture, handleArchitectureUpdate, readonly, screenToFlowPosition])

  const handleUpdateNode = useCallback(() => {
    if (readonly || !selectedNodeId || !editNodeData) return

    // Filter out any null/undefined nodes BEFORE mapping
    const validNodes = architecture.nodes.filter(node => node !== null && node !== undefined)

    const updatedNodes = validNodes.map(node => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          type: node.type,
          position: node.position,
          style: node.style,
          data: {
            ...node.data,
            name: editNodeData.name,
            description: editNodeData.description,
            color: node.data.color,
            metadata: node.data.metadata,
            aiExplanation: node.data.aiExplanation,
          }
        }
      }
      return node
    })

    const updatedArchitecture = {
      ...architecture,
      nodes: updatedNodes,
      edges: architecture.edges || [],
      metadata: {
        ...architecture.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    handleArchitectureUpdate(updatedArchitecture)

    // Force immediate node re-render with proper callbacks
    const updatedReactFlowNodes = updatedNodes
      .filter(node => node !== null && node !== undefined)
      .map(node => convertArchitectureNodeToReactFlowNode(
        node,
        () => handleNodeEdit(node.id),
        () => handleNodeDelete(node.id),
        () => handleNodeDuplicate(node.id),
        () => handleNodeConfigure(node.id)
      ))
    setNodes(updatedReactFlowNodes)

    setShowEditNodeDialog(false)
    setEditNodeData(null)
    setSelectedNodeId(null)
  }, [selectedNodeId, editNodeData, architecture, handleArchitectureUpdate, readonly, setNodes, handleNodeEdit, handleNodeDelete, handleNodeDuplicate, handleNodeConfigure])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 })
  }, [fitView])

  // Save architecture to localStorage
  const handleSaveToStorage = useCallback(async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Filter out null nodes before saving
      const cleanedArchitecture = {
        ...architecture,
        nodes: architecture.nodes.filter(node => node !== null && node !== undefined)
      }
      // Update the architecture in localStorage via onboardingData
      if (type === "hld") {
        await updateData({ architecture: cleanedArchitecture })

      } else {
        const diagrams = data?.diagrams || {};
        updateData({
          diagrams: {
            ...diagrams,
            [type]: cleanedArchitecture
          }
        })

      }

      setSaveSuccess(true)

      // Reset success message after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to save architecture to storage:', error)
    } finally {
      setIsSaving(false)
    }
  }, [architecture, updateData])

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

  // Count valid nodes only
  const validNodesCount = architecture.nodes.filter(n => n !== null && n !== undefined).length

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-[rgba(55,50,47,0.08)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-[#1d1d1f] text-sm">System Architecture</h3>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs h-6 px-2.5 border-[rgba(55,50,47,0.12)]">
                {validNodesCount} components
              </Badge>
              <Badge variant="outline" className="text-xs h-6 px-2.5 border-[rgba(55,50,47,0.12)]">
                {architecture.edges.length} connections
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="h-8 px-3 text-xs hover:bg-[#005BE3]/5"
            >
              {showConnections ? <Eye className="w-3.5 h-3.5 mr-1.5" /> : <EyeOff className="w-3.5 h-3.5 mr-1.5" />}
              Connections
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMiniMap(!showMiniMap)}
              className="h-8 px-3 text-xs hover:bg-[#005BE3]/5"
            >
              <Grid className="w-3.5 h-3.5 mr-1.5" />
              Minimap
            </Button>

            {!readonly && (
              <>
                <Button
                  onClick={() => setShowAddNodeDialog(true)}
                  size="sm"
                  className="h-8 px-3 text-xs bg-[#005BE3] hover:bg-[#004BC9]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Node
                </Button>

                <Button
                  onClick={handleSaveToStorage}
                  disabled={isSaving}
                  size="sm"
                  className={`h-8 px-3 text-xs ${saveSuccess
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#005BE3] hover:bg-[#004BC9]'
                    }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save to Storage
                    </>
                  )}
                </Button>

                {onSave && (
                  <Button
                    variant="ghost"
                    onClick={onSave}
                    size="sm"
                    className="h-8 px-3 text-xs hover:bg-[#005BE3]/5"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save
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
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="bg-[#fafafa]"
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable={!readonly}
          edgesupdatable={!readonly}
          edgesFocusable={!readonly}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={0.8}
            color="#d1d5db"
          />

          <Controls
            position="bottom-right"
            className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg shadow-md !m-4"
            showZoom
            showFitView
            showInteractive={false}
          />

          {showMiniMap && (
            <MiniMap
              position="bottom-left"
              className="bg-white border border-[rgba(55,50,47,0.12)] rounded-lg shadow-md !m-4"
              pannable
              zoomable
              nodeColor={(node) => {
                return getNodeTypeColor(node.type as ArchitectureNode['type'])
              }}
            />
          )}

          {validNodesCount === 0 && (
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
      <div className="flex-shrink-0 bg-white border-t border-[rgba(55,50,47,0.08)] px-4 py-2.5 text-xs text-[#605A57]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              {validNodesCount} components, {showConnections ? architecture.edges.length : 0} connections
            </span>
            <span className="text-[rgba(55,50,47,0.2)] hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              System Architecture Editor
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[#605A57]/70">Drag components • Connect handles • Click edges to edit</span>
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

      {/* Edit Node Dialog */}
      <Dialog open={showEditNodeDialog} onOpenChange={setShowEditNodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-node-type">Component Type</Label>
              <Input
                id="edit-node-type"
                value={editNodeData?.type || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-node-name">Component Name</Label>
              <Input
                id="edit-node-name"
                value={editNodeData?.name || ''}
                onChange={(e) => setEditNodeData(editNodeData ? { ...editNodeData, name: e.target.value } : null)}
                placeholder="Component name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-node-description">Description</Label>
              <Input
                id="edit-node-description"
                value={editNodeData?.description || ''}
                onChange={(e) => setEditNodeData(editNodeData ? { ...editNodeData, description: e.target.value } : null)}
                placeholder="Brief description of this component"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditNodeDialog(false)
              setEditNodeData(null)
              setSelectedNodeId(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNode}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Edge Dialog */}
      <Dialog open={showEditEdgeDialog} onOpenChange={setShowEditEdgeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-edge-label">Connection Label</Label>
              <Input
                id="edit-edge-label"
                value={editEdgeLabel}
                onChange={(e) => setEditEdgeLabel(e.target.value)}
                placeholder="Connection label"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteEdge}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowEditEdgeDialog(false)
                setEditEdgeLabel('')
                setSelectedEdgeId(null)
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEdge}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}