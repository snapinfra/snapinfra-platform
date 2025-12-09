import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Mock ERDTableNode component
const ERDTableNode = ({ data, id, onEdit, onDelete }) => {
  return (
    <div style={{
      padding: '0',
      background: 'white',
      border: `3px solid ${data.color}`,
      borderRadius: '12px',
      minWidth: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }}>
      {/* Header with gradient */}
      <div style={{
        fontWeight: 'bold',
        padding: '14px 16px',
        color: 'white',
        background: `linear-gradient(135deg, ${data.color} 0%, ${data.color}dd 100%)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '15px',
        letterSpacing: '0.3px'
      }}>
        <span>{data.label}</span>
        {!data.readonly && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(id);
              }}
              style={{
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
            >
              ✏️ Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this table?')) onDelete?.(id);
              }}
              style={{
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                background: 'rgba(239,68,68,0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#DC2626'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239,68,68,0.9)'}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          padding: '12px 16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontStyle: 'italic'
        }}>
          {data.description}
        </div>
      )}

      {/* Fields */}
      <div style={{ padding: '12px' }}>
        {data.fields?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
            padding: '16px',
            fontStyle: 'italic'
          }}>
            No fields defined
          </div>
        ) : (
          data.fields?.map((field, idx) => (
            <div key={idx} style={{
              fontSize: '13px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
              borderRadius: '6px',
              marginBottom: '4px',
              border: '1px solid #f3f4f6',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
                e.currentTarget.style.borderColor = data.color + '40';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
                e.currentTarget.style.borderColor = '#f3f4f6';
              }}
            >
              <div style={{ display: 'flex', gap: '4px', minWidth: '48px' }}>
                {field.isPrimaryKey && <span title="Primary Key">🔑</span>}
                {field.isForeignKey && <span title="Foreign Key">🔗</span>}
                {field.isUnique && !field.isPrimaryKey && <span title="Unique">⭐</span>}
              </div>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: '600',
                color: '#1f2937',
                flex: 1
              }}>
                {field.name}
              </span>
              <span style={{
                color: '#6b7280',
                fontSize: '12px',
                background: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                {field.type}
              </span>
              {!field.isNullable && (
                <span style={{
                  fontSize: '10px',
                  color: '#DC2626',
                  fontWeight: '600',
                  background: '#FEE2E2',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  NOT NULL
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Simple Dialog Component
const Dialog = ({ open, onClose, children, title }) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        width: '90%'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'default', size = 'default', disabled, ...props }) => {
  const styles = {
    default: { background: '#3B82F6', color: 'white' },
    outline: { background: 'white', color: '#3B82F6', border: '1px solid #3B82F6' },
    ghost: { background: 'transparent', color: '#666' }
  };

  const sizeStyles = {
    default: { padding: '8px 16px', fontSize: '14px' },
    sm: { padding: '4px 8px', fontSize: '12px' }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        ...sizeStyles[size],
        border: variant === 'outline' ? '1px solid #3B82F6' : 'none',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        ...props.style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      ...props.style
    }}
    {...props}
  />
);

const Select = ({ value, onChange, children, ...props }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      ...props.style
    }}
    {...props}
  >
    {children}
  </select>
);

const Checkbox = ({ checked, onChange, id }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
  />
);

const Label = ({ children, htmlFor, style }) => (
  <label htmlFor={htmlFor} style={{ fontSize: '14px', fontWeight: '500', ...style }}>
    {children}
  </label>
);

// Sample ERD data
const initialERD = {
  name: "E-Commerce Database",
  nodes: [
    {
      id: "users",
      type: "default",
      position: { x: 100, y: 100 },
      data: {
        label: "Users",
        description: "Customer accounts",
        color: "#3B82F6",
        fields: [
          { name: "id", type: "uuid", isPrimaryKey: true, isForeignKey: false, isUnique: true, isNullable: false },
          { name: "email", type: "varchar", isPrimaryKey: false, isForeignKey: false, isUnique: true, isNullable: false },
          { name: "name", type: "varchar", isPrimaryKey: false, isForeignKey: false, isUnique: false, isNullable: false }
        ]
      }
    },
    {
      id: "orders",
      type: "default",
      position: { x: 400, y: 100 },
      data: {
        label: "Orders",
        description: "Customer orders",
        color: "#10B981",
        fields: [
          { name: "id", type: "uuid", isPrimaryKey: true, isForeignKey: false, isUnique: true, isNullable: false },
          { name: "user_id", type: "uuid", isPrimaryKey: false, isForeignKey: true, isUnique: false, isNullable: false },
          { name: "total", type: "decimal", isPrimaryKey: false, isForeignKey: false, isUnique: false, isNullable: false }
        ]
      }
    }
  ],
  edges: [
    {
      id: "users-orders",
      source: "users",
      target: "orders",
      type: "smoothstep",
      label: "FK",
      style: { strokeWidth: 2 }
    }
  ],
  metadata: {
    totalTables: 2,
    totalRelationships: 1,
    totalFields: 6
  }
};

// Main Component
const ERDDiagramViewerInner = ({ erd: initialErd, readonly = false, onSave }) => {
  const { screenToFlowPosition } = useReactFlow();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [erdData, setErdData] = useState(initialErd || initialERD);

  // State for dialogs
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false);
  const [showEditNodeDialog, setShowEditNodeDialog] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for new node
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDescription, setNewNodeDescription] = useState('');
  const [newNodeColor, setNewNodeColor] = useState('#6B7280');

  // Form state for edit node with fields
  const [editNodeData, setEditNodeData] = useState(null);

  // Field form state
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showEditFieldDialog, setShowEditFieldDialog] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'varchar',
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    isNullable: true
  });

  // Load from localStorage on mount
  // useEffect(() => {
  //   const saved = localStorage.getItem('erd-diagram-data');
  //   if (saved) {
  //     try {
  //       const parsed = JSON.parse(saved);
  //       setErdData(parsed);
  //     } catch (err) {
  //       console.error('Failed to load saved ERD:', err);
  //     }
  //   }
  // }, []);

  useEffect(() => {
    if (initialErd) {
      setErdData(initialErd);
    }
  }, [initialErd]);

  // Handle node edit
  const handleNodeEdit = useCallback((nodeId) => {
    const node = erdData.nodes.find(n => n && n.id === nodeId);
    if (node) {
      setSelectedNodeId(nodeId);
      setEditNodeData({
        name: node.data.label,
        description: node.data.description || '',
        color: node.data.color || '#6B7280',
        fields: node.data.fields || []
      });
      setShowEditNodeDialog(true);
    }
  }, [erdData.nodes]);

  // Handle node delete
  const handleNodeDelete = useCallback((nodeId) => {
    const updatedERD = {
      ...erdData,
      nodes: erdData.nodes.filter(n => n && n.id !== nodeId),
      edges: erdData.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      metadata: {
        ...erdData.metadata,
        totalTables: erdData.metadata.totalTables - 1
      }
    };

    setErdData(updatedERD);
    setHasUnsavedChanges(true);
  }, [erdData]);

  // Define custom node types with handlers
  const nodeTypes = useMemo(() => ({
    default: (props) => (
      <ERDTableNode
        {...props}
        onEdit={readonly ? undefined : handleNodeEdit}
        onDelete={readonly ? undefined : handleNodeDelete}
      />
    ),
  }), [readonly, handleNodeEdit, handleNodeDelete]);

  // Initialize nodes and edges
  const initialNodes = useMemo(() => {
    if (!erdData?.nodes || !Array.isArray(erdData.nodes)) {
      return [];
    }

    return erdData.nodes.map(node => {
      if (!node.id || !node.data) {
        return null;
      }

      return {
        ...node,
        data: {
          label: node.data.label || 'Unnamed Table',
          description: node.data.description || '',
          fields: Array.isArray(node.data.fields) ? node.data.fields : [],
          color: node.data.color || '#6B7280',
          indexes: Array.isArray(node.data.indexes) ? node.data.indexes : [],
          constraints: Array.isArray(node.data.constraints) ? node.data.constraints : []
        }
      };
    }).filter(Boolean);
  }, [erdData]);

  const initialEdges = useMemo(() => {
    if (!erdData?.edges || !Array.isArray(erdData.edges)) {
      return [];
    }

    return erdData.edges.map(edge => {
      if (!edge.id || !edge.source || !edge.target) {
        return null;
      }

      return {
        ...edge,
        type: edge.type || 'smoothstep',
        animated: edge.animated || false,
        label: edge.label || '',
        style: edge.style || { strokeWidth: 2 }
      };
    }).filter(Boolean);
  }, [erdData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when ERD changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [erdData.nodes, setNodes, initialNodes]);

  // Update edges when ERD changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [erdData.edges, setEdges, initialEdges]);

  const handleNodesChange = useCallback((changes) => {
    if (readonly) return;

    onNodesChange(changes);

    const positionChanges = changes.filter(change =>
      change.type === 'position' && change.dragging === false && change.position
    );

    if (positionChanges.length > 0) {
      const updatedNodes = erdData.nodes
        .filter(node => node !== null && node !== undefined)
        .map(node => {
          const positionChange = positionChanges.find(change => change.id === node.id);
          if (positionChange) {
            return {
              ...node,
              position: positionChange.position
            };
          }
          return node;
        });

      setErdData({
        ...erdData,
        nodes: updatedNodes
      });
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange, erdData, readonly]);

  const onConnect = useCallback(
    (params) => {
      if (readonly) return;

      const newEdge = {
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep',
        label: 'FK',
        style: { strokeWidth: 2 }
      };

      setErdData({
        ...erdData,
        edges: [...erdData.edges, newEdge],
        metadata: {
          ...erdData.metadata,
          totalRelationships: erdData.metadata.totalRelationships + 1
        }
      });

      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges, erdData, readonly]
  );

  // Field management functions
  const handleAddField = useCallback(() => {
    setFieldForm({
      name: '',
      type: 'varchar',
      isPrimaryKey: false,
      isForeignKey: false,
      isUnique: false,
      isNullable: true
    });
    setShowAddFieldDialog(true);
  }, []);

  const handleEditField = useCallback((index) => {
    if (editNodeData) {
      setEditingFieldIndex(index);
      setFieldForm({ ...editNodeData.fields[index] });
      setShowEditFieldDialog(true);
    }
  }, [editNodeData]);

  const handleDeleteField = useCallback((index) => {
    if (editNodeData) {
      const updatedFields = editNodeData.fields.filter((_, i) => i !== index);
      setEditNodeData({ ...editNodeData, fields: updatedFields });
    }
  }, [editNodeData]);

  const handleSaveField = useCallback(() => {
    if (editNodeData) {
      if (showAddFieldDialog) {
        setEditNodeData({
          ...editNodeData,
          fields: [...editNodeData.fields, fieldForm]
        });
      } else if (showEditFieldDialog && editingFieldIndex !== null) {
        const updatedFields = [...editNodeData.fields];
        updatedFields[editingFieldIndex] = fieldForm;
        setEditNodeData({ ...editNodeData, fields: updatedFields });
      }
    }
    setShowAddFieldDialog(false);
    setShowEditFieldDialog(false);
    setEditingFieldIndex(null);
  }, [editNodeData, fieldForm, showAddFieldDialog, showEditFieldDialog, editingFieldIndex]);

  // Handle add new node
  const handleAddNode = useCallback(() => {
    if (readonly) return;

    const newNode = {
      id: `table-${Date.now()}`,
      type: 'default',
      position: screenToFlowPosition({ x: 300, y: 300 }),
      data: {
        label: newNodeName || 'New Table',
        description: newNodeDescription || '',
        fields: [],
        color: newNodeColor,
        indexes: [],
        constraints: []
      }
    };

    setErdData({
      ...erdData,
      nodes: [...erdData.nodes.filter(n => n !== null && n !== undefined), newNode],
      metadata: {
        ...erdData.metadata,
        totalTables: erdData.metadata.totalTables + 1
      }
    });

    setNewNodeName('');
    setNewNodeDescription('');
    setNewNodeColor('#6B7280');
    setShowAddNodeDialog(false);
    setHasUnsavedChanges(true);
  }, [newNodeName, newNodeDescription, newNodeColor, erdData, readonly, screenToFlowPosition]);

  // Handle update node
  const handleUpdateNode = useCallback(() => {
    if (readonly || !selectedNodeId || !editNodeData) return;

    const validNodes = erdData.nodes.filter(node => node !== null && node !== undefined);

    const updatedNodes = validNodes.map(node => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            label: editNodeData.name,
            description: editNodeData.description,
            color: editNodeData.color,
            fields: editNodeData.fields
          }
        };
      }
      return node;
    });

    const totalFieldsCount = updatedNodes.reduce((sum, node) => sum + (node.data.fields?.length || 0), 0);

    setErdData({
      ...erdData,
      nodes: updatedNodes,
      metadata: {
        ...erdData.metadata,
        totalFields: totalFieldsCount
      }
    });

    setShowEditNodeDialog(false);
    setEditNodeData(null);
    setSelectedNodeId(null);
    setHasUnsavedChanges(true);
  }, [selectedNodeId, editNodeData, erdData, readonly]);

  // NEW - Replace with this
  const handleSaveToStorage = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const cleanedERD = {
        ...erdData,
        nodes: erdData.nodes.filter(node => node !== null && node !== undefined)
      };

      // Call the onSave callback with updated ERD data
      await onSave(cleanedERD);

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save ERD:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [erdData, onSave]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2 }
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e5e7eb"
        />
        <Controls
          showZoom
          showFitView
          showInteractive
          position="top-left"
        />
        <MiniMap
          nodeColor={(node) => node.data.color || '#6B7280'}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb'
          }}
        />

        {/* Info Panel */}
        <Panel position="top-right" style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          maxWidth: '320px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 0, marginBottom: '12px' }}>
            {erdData.name}
          </h3>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Tables:</span>
              <span style={{ fontWeight: '600' }}>{erdData.metadata.totalTables}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Relationships:</span>
              <span style={{ fontWeight: '600' }}>{erdData.metadata.totalRelationships}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Fields:</span>
              <span style={{ fontWeight: '600' }}>{erdData.metadata.totalFields}</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Legend</div>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>🔑</span>
                <span>Primary Key</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>🔗</span>
                <span>Foreign Key</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⭐</span>
                <span>Unique</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!readonly && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                onClick={() => setShowAddNodeDialog(true)}
                variant="outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '16px' }}>➕</span>
                Add Table
              </Button>
              <Button
                onClick={handleSaveToStorage}
                disabled={isSaving || saveSuccess || !hasUnsavedChanges}
                style={{ width: '100%', justifyContent: 'center', background: saveSuccess ? '#10B981' : hasUnsavedChanges ? '#F59E0B' : '#3B82F6' }}
              >
                {saveSuccess ? (
                  <>
                    <span style={{ fontSize: '16px' }}>✓</span>
                    Saved!
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '16px' }}>💾</span>
                    {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'No Changes'}
                  </>
                )}
              </Button>
            </div>
          )}
        </Panel>
      </ReactFlow>

      {/* Add Node Dialog */}
      <Dialog open={showAddNodeDialog} onClose={() => setShowAddNodeDialog(false)} title="Add New Table">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Label htmlFor="table-name" style={{ display: 'block', marginBottom: '4px' }}>Table Name</Label>
            <Input
              id="table-name"
              value={newNodeName}
              onChange={setNewNodeName}
              placeholder="e.g., Users, Products"
            />
          </div>
          <div>
            <Label htmlFor="table-description" style={{ display: 'block', marginBottom: '4px' }}>Description</Label>
            <Input
              id="table-description"
              value={newNodeDescription}
              onChange={setNewNodeDescription}
              placeholder="Brief description of the table"
            />
          </div>
          <div>
            <Label htmlFor="table-color" style={{ display: 'block', marginBottom: '4px' }}>Color</Label>
            <Select value={newNodeColor} onChange={setNewNodeColor}>
              <option value="#6B7280">Gray</option>
              <option value="#3B82F6">Blue</option>
              <option value="#10B981">Green</option>
              <option value="#F59E0B">Orange</option>
              <option value="#EF4444">Red</option>
              <option value="#8B5CF6">Purple</option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setShowAddNodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode}>
              Add Table
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog open={showEditNodeDialog} onClose={() => setShowEditNodeDialog(false)} title="Edit Table">
        {editNodeData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Label htmlFor="edit-table-name" style={{ display: 'block', marginBottom: '4px' }}>Table Name</Label>
                <Input
                  id="edit-table-name"
                  value={editNodeData.name}
                  onChange={(val) => setEditNodeData({ ...editNodeData, name: val })}
                />
              </div>
              <div>
                <Label htmlFor="edit-table-color" style={{ display: 'block', marginBottom: '4px' }}>Color</Label>
                <Select
                  value={editNodeData.color}
                  onChange={(val) => setEditNodeData({ ...editNodeData, color: val })}
                >
                  <option value="#6B7280">Gray</option>
                  <option value="#3B82F6">Blue</option>
                  <option value="#10B981">Green</option>
                  <option value="#F59E0B">Orange</option>
                  <option value="#EF4444">Red</option>
                  <option value="#8B5CF6">Purple</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-table-description" style={{ display: 'block', marginBottom: '4px' }}>Description</Label>
              <Input
                id="edit-table-description"
                value={editNodeData.description}
                onChange={(val) => setEditNodeData({ ...editNodeData, description: val })}
              />
            </div>

            {/* Fields Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Label>Fields ({editNodeData.fields.length})</Label>
                <Button size="sm" variant="outline" onClick={handleAddField}>
                  ➕ Add Field
                </Button>
              </div>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {editNodeData.fields.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', margin: '16px 0' }}>
                    No fields added yet
                  </p>
                ) : (
                  editNodeData.fields.map((field, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      background: '#f9fafb',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          {field.isPrimaryKey && <span>🔑</span>}
                          {field.isForeignKey && <span>🔗</span>}
                          {field.isUnique && !field.isPrimaryKey && <span>⭐</span>}
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600' }}>
                            {field.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#888' }}>{field.type}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button size="sm" variant="ghost" onClick={() => handleEditField(index)}>
                          ✏️
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteField(index)}>
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setShowEditNodeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNode}>
                💾 Update Table
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add/Edit Field Dialog */}
      <Dialog
        open={showAddFieldDialog || showEditFieldDialog}
        onClose={() => {
          setShowAddFieldDialog(false);
          setShowEditFieldDialog(false);
          setEditingFieldIndex(null);
        }}
        title={showAddFieldDialog ? 'Add Field' : 'Edit Field'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label htmlFor="field-name" style={{ display: 'block', marginBottom: '4px' }}>Field Name</Label>
              <Input
                id="field-name"
                value={fieldForm.name}
                onChange={(val) => setFieldForm({ ...fieldForm, name: val })}
                placeholder="e.g., user_id, email"
              />
            </div>
            <div>
              <Label htmlFor="field-type" style={{ display: 'block', marginBottom: '4px' }}>Data Type</Label>
              <Select
                value={fieldForm.type}
                onChange={(val) => setFieldForm({ ...fieldForm, type: val })}
              >
                <option value="varchar">VARCHAR</option>
                <option value="text">TEXT</option>
                <option value="integer">INTEGER</option>
                <option value="bigint">BIGINT</option>
                <option value="uuid">UUID</option>
                <option value="boolean">BOOLEAN</option>
                <option value="timestamp">TIMESTAMP</option>
                <option value="timestamptz">TIMESTAMPTZ</option>
                <option value="date">DATE</option>
                <option value="decimal">DECIMAL</option>
                <option value="json">JSON</option>
                <option value="jsonb">JSONB</option>
              </Select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                id="primary-key"
                checked={fieldForm.isPrimaryKey}
                onChange={(checked) => setFieldForm({ ...fieldForm, isPrimaryKey: checked })}
              />
              <Label htmlFor="primary-key" style={{ fontWeight: 'normal', cursor: 'pointer' }}>Primary Key</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                id="foreign-key"
                checked={fieldForm.isForeignKey}
                onChange={(checked) => setFieldForm({ ...fieldForm, isForeignKey: checked })}
              />
              <Label htmlFor="foreign-key" style={{ fontWeight: 'normal', cursor: 'pointer' }}>Foreign Key</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                id="unique"
                checked={fieldForm.isUnique}
                onChange={(checked) => setFieldForm({ ...fieldForm, isUnique: checked })}
              />
              <Label htmlFor="unique" style={{ fontWeight: 'normal', cursor: 'pointer' }}>Unique</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                id="nullable"
                checked={fieldForm.isNullable}
                onChange={(checked) => setFieldForm({ ...fieldForm, isNullable: checked })}
              />
              <Label htmlFor="nullable" style={{ fontWeight: 'normal', cursor: 'pointer' }}>Nullable</Label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => {
              setShowAddFieldDialog(false);
              setShowEditFieldDialog(false);
              setEditingFieldIndex(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              {showAddFieldDialog ? 'Add Field' : 'Update Field'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
// NEW
const ERDDiagramViewer = ({ erd, readonly = false, onSave }) => {
  return (
    <ReactFlowProvider>
      <ERDDiagramViewerInner erd={erd} readonly={readonly} onSave={onSave} />
    </ReactFlowProvider>
  );
};

export default ERDDiagramViewer