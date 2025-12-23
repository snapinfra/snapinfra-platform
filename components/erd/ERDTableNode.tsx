// components/erd/ERDTableNode.tsx
import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ERDField } from '@/lib/utils/erd-generator'
import { Edit, Trash2 } from 'lucide-react'

interface ERDTableNodeData {
  label: string
  description: string
  fields: ERDField[]
  color: string
  indexes: string[]
  constraints: string[]
  onEdit?: () => void
  onDelete?: () => void
}

const ERDTableNode = ({ data, selected }: NodeProps<ERDTableNodeData>) => {
  const { label, description, fields = [], color, indexes = [], constraints = [], onEdit, onDelete } = data

  // Fallback if no data
  if (!label) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 min-w-[280px]">
        <div className="text-red-700 font-semibold">Error: Missing table data</div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border-2 transition-all duration-200 ${
        selected ? 'ring-4 ring-blue-300 shadow-xl' : ''
      }`}
      style={{
        borderColor: color || '#6B7280',
        minWidth: '280px',
        maxWidth: '400px'
      }}
    >
      {/* Table Header */}
      <div
        className="px-4 py-3 rounded-t-lg text-white font-bold text-sm"
        style={{ backgroundColor: color || '#6B7280' }}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">{fields.length} fields</span>
            {/* Edit and Delete buttons */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1 ml-2">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Edit table"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Are you sure you want to delete the "${label}" table?`)) {
                        onDelete()
                      }
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Delete table"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {description && (
          <div className="text-xs mt-1 opacity-90 font-normal line-clamp-2">
            {description}
          </div>
        )}
      </div>

      {/* Fields Section */}
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {fields.length > 0 ? (
          <div className="space-y-1">
            {fields.map((field, idx) => (
              <div
                key={`${field.name}-${idx}`}
                className={`flex items-start justify-between px-2 py-1.5 rounded text-xs hover:bg-gray-50 ${
                  field.isPrimaryKey ? 'bg-yellow-50' : ''
                } ${field.isForeignKey ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Field Icons */}
                  {field.isPrimaryKey && (
                    <span className="text-yellow-600 font-bold flex-shrink-0" title="Primary Key">
                      🔑
                    </span>
                  )}
                  {field.isForeignKey && (
                    <span className="text-blue-600 flex-shrink-0" title="Foreign Key">
                      🔗
                    </span>
                  )}
                  {field.isUnique && !field.isPrimaryKey && (
                    <span className="text-purple-600 flex-shrink-0" title="Unique">
                      ⭐
                    </span>
                  )}
                  
                  {/* Field Name */}
                  <span
                    className={`font-mono truncate ${
                      field.isPrimaryKey ? 'font-bold text-gray-900' : 'text-gray-700'
                    }`}
                    title={field.name}
                  >
                    {field.name}
                  </span>
                </div>

                {/* Field Type */}
                <span
                  className="text-gray-500 font-mono ml-2 flex-shrink-0"
                  title={field.type}
                >
                  {field.type.length > 15 ? field.type.substring(0, 12) + '...' : field.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-xs italic py-2">No fields defined</div>
        )}

        {/* Indexes Section */}
        {indexes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
              <span>📊</span> Indexes ({indexes.length})
            </div>
            <div className="space-y-1">
              {indexes.map((index, idx) => (
                <div
                  key={`idx-${idx}`}
                  className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded"
                >
                  {index}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints Section */}
        {constraints.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
              <span>🔒</span> Constraints ({constraints.length})
            </div>
            <div className="space-y-1">
              {constraints.map((constraint, idx) => (
                <div
                  key={`constraint-${idx}`}
                  className="text-xs text-gray-600 px-2 py-1 bg-gray-50 rounded"
                >
                  {constraint}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3"
        style={{ background: color || '#6B7280' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3"
        style={{ background: color || '#6B7280' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ background: color || '#6B7280' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ background: color || '#6B7280' }}
      />
    </div>
  )
}

export default memo(ERDTableNode)