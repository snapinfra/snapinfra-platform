// components/DataFlowDiagram.tsx
'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  addEdge,
  Connection,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { 
  Database, Globe, Server, Shield, Cloud, 
  Plus, X, ChevronDown, ChevronUp, Save, Trash2 
} from 'lucide-react'

// --- Interfaces ---
interface DataFlowDiagramProps {
  dataFlow: {
    nodes: Node[]
    edges: Edge[]
    metadata?: {
      totalNodes: number
      totalFlows: number
      encryptedFlows: number
    }
    aiInsights?: {
      bottlenecks: string[]
      securityIssues: string[]
      cachingOpportunities: string[]
      transformationPoints: string[]
    }
  }
}

// --- Custom Node Components (Unchanged visual style) ---
// Note: passed 'selected' prop to show visual feedback when clicked
const NodeWrapper = ({ children, color, selected, onClick }: any) => (
  <div 
    className={`px-6 py-4 rounded-lg border-2 shadow-lg bg-white min-w-[200px] transition-all duration-200 ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
    style={{ borderColor: color }}
    onClick={onClick}
  >
    {children}
  </div>
)

function ExternalEntityNode({ data, selected }: { data: any, selected?: boolean }) {
  return (
    <NodeWrapper color={data.color || '#3B82F6'} selected={selected}>
      <div className="flex items-center gap-3 mb-2">
        <Globe className="w-5 h-5" style={{ color: data.color }} />
        <div className="font-semibold text-gray-900">{data.label}</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">{data.description}</div>
    </NodeWrapper>
  )
}

function GatewayNode({ data, selected }: { data: any, selected?: boolean }) {
  return (
    <NodeWrapper color={data.color || '#10B981'} selected={selected}>
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-5 h-5" style={{ color: data.color }} />
        <div className="font-semibold text-gray-900">{data.label}</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">{data.description}</div>
    </NodeWrapper>
  )
}

function ProcessNode({ data, selected }: { data: any, selected?: boolean }) {
  return (
    <NodeWrapper color={data.color || '#8B5CF6'} selected={selected}>
      <div className="flex items-center gap-3 mb-2">
        <Server className="w-5 h-5" style={{ color: data.color }} />
        <div className="font-semibold text-gray-900">{data.label}</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">{data.description}</div>
    </NodeWrapper>
  )
}

function DataStoreNode({ data, selected }: { data: any, selected?: boolean }) {
  const isExternal = data.nodeType === 'external-service'
  const Icon = isExternal ? Cloud : Database
  return (
    <NodeWrapper color={data.color || '#EF4444'} selected={selected}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" style={{ color: data.color }} />
        <div className="font-semibold text-gray-900">{data.label}</div>
      </div>
      <div className="text-xs text-gray-600 mb-2">{data.description}</div>
    </NodeWrapper>
  )
}

// --- Edit Modal Component ---
function EditNodeModal({ node, isOpen, onClose, onSave, onDelete }: any) {
  const [formData, setFormData] = useState({ label: '', description: '', color: '' })

  useEffect(() => {
    if (node) {
      setFormData({
        label: node.data.label || '',
        description: node.data.description || '',
        color: node.data.color || '#000000'
      })
    }
  }, [node])

  if (!isOpen || !node) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Edit Node</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
            <input 
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Color Accent</label>
            <div className="flex gap-2">
              <input 
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="h-8 w-14 p-0 border-0 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500 self-center">{formData.color}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <button 
            onClick={() => onDelete(node.id)}
            className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button 
            onClick={() => onSave(node.id, formData)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Flow Component ---
function Flow({ dataFlow }: DataFlowDiagramProps) {
  const nodeTypes = useMemo(() => ({
    'external-entity': ExternalEntityNode,
    'gateway': GatewayNode,
    'process': ProcessNode,
    'data-store': DataStoreNode
  }), [])

  // State
  const [nodes, setNodes, onNodesChange] = useNodesState(dataFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(dataFlow.edges)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  
  // React Flow instance for screen coordinates projection
  const { screenToFlowPosition } = useReactFlow()

  // Handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed } 
    }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNode(node)
  }, [])

  const handleSaveNode = (id: string, newData: any) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...newData } }
      }
      return node
    }))
    setEditingNode(null)
  }

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setEditingNode(null)
  }

  const addNewNode = (type: string) => {
    const id = `new_${Math.random().toString(36).substr(2, 9)}`
    // Add slightly offset from center or random position
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: `New ${type}`, 
        description: 'Click to edit description',
        color: type === 'data-store' ? '#EF4444' : '#8B5CF6'
      }
    }
    setNodes((nds) => nds.concat(newNode))
  }

  return (
    <div className="relative w-full h-[800px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' }
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => node.data.color || '#6B7280'}
          className="!bg-white !border !border-gray-200 !shadow-md !rounded-lg !bottom-20 !right-4"
          zoomable
          pannable
        />
        
        {/* Top Center: Add Node Toolbar */}
        <Panel position="top-center" className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 flex gap-2">
          <button 
            onClick={() => addNewNode('process')}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /> Process
          </button>
          <button 
            onClick={() => addNewNode('data-store')}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /> Store
          </button>
          <button 
            onClick={() => addNewNode('external-entity')}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" /> Entity
          </button>
        </Panel>

        {/* Collapsible AI Insights Panel */}
        {dataFlow.aiInsights && (
          <Panel position="top-right" className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm transition-all duration-300">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h3 className="font-semibold text-sm text-gray-900">AI Insights</h3>
              </div>
              <button 
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                {aiPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            {aiPanelOpen && (
              <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                {dataFlow.aiInsights.bottlenecks?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-orange-600 mb-2 text-xs uppercase tracking-wider">
                      ⚠️ Bottlenecks
                    </div>
                    <ul className="space-y-2">
                      {dataFlow.aiInsights.bottlenecks.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-600 bg-orange-50 p-2 rounded border border-orange-100">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {dataFlow.aiInsights.cachingOpportunities?.length > 0 && (
                  <div>
                     <div className="flex items-center gap-1.5 font-medium text-blue-600 mb-2 text-xs uppercase tracking-wider">
                      💡 Caching
                    </div>
                    <ul className="space-y-2">
                      {dataFlow.aiInsights.cachingOpportunities.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Panel>
        )}
      </ReactFlow>

      {/* Edit Modal (Rendered via Portal conceptually, but here just absolutely positioned) */}
      <EditNodeModal 
        node={editingNode} 
        isOpen={!!editingNode} 
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </div>
  )
}

// Wrap in Provider to ensure internal hooks work if used externally
export default function DataFlowDiagramWrapper(props: DataFlowDiagramProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  )
}