"use client"

import React, { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  Server,
  Shield,
  Monitor,
  Cloud,
  Network,
  Zap,
  MessageSquare,
  Box,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Settings,
  Activity,
  FileText,
  Search,
  Archive,
  Radio,
  Package,
  Key,
  HardDrive,
  BarChart3,
  Bell,
  Clock,
  GitMerge,
  Users,
  Lock,
  Globe,
  GitPullRequest,
  GitBranch
} from "lucide-react"
import { ArchitectureNode, NodeAIExplanation } from '@/lib/types/architecture'
import { getNodeTypeColor, getNodeTypeIcon } from '@/lib/utils/architecture'
import { NodeExplanationTooltip } from '@/components/node-explanation-tooltip'

export interface ArchitectureNodeData {
  name: string
  description?: string
  icon?: string
  color?: string
  metadata?: Record<string, any>
  aiExplanation?: NodeAIExplanation
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onConfigure?: () => void
}

const iconComponents = {
  Database,
  Server,
  Shield,
  Monitor,
  Cloud,
  Network,
  Zap,
  MessageSquare,
  Box,
  Activity,
  FileText,
  Search,
  Archive,
  Radio,
  Package,
  Key,
  HardDrive,
  BarChart3,
  Bell,
  Clock,
  GitMerge,
  Users,
  Lock,
  Globe,
  GitPullRequest,
  GitBranch
}

// Global event to close all tooltips
const CLOSE_ALL_TOOLTIPS_EVENT = 'closeAllTooltips'

function ArchitectureNodeComponent({ data, selected, type, id }: NodeProps<ArchitectureNodeData>) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [nodeRect, setNodeRect] = useState<DOMRect | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const IconComponent = iconComponents[getNodeTypeIcon(type as ArchitectureNode['type']) as keyof typeof iconComponents] || Box
  const nodeColor = data.color || getNodeTypeColor(type as ArchitectureNode['type'])

  // Listen for global close event
  useEffect(() => {
    const handleCloseAll = (e: CustomEvent) => {
      // Only close if it's not this node opening
      if (e.detail?.nodeId !== id) {
        setShowTooltip(false)
      }
    }

    window.addEventListener(CLOSE_ALL_TOOLTIPS_EVENT as any, handleCloseAll as any)
    return () => {
      window.removeEventListener(CLOSE_ALL_TOOLTIPS_EVENT as any, handleCloseAll as any)
    }
  }, [id])

  // Handle node click to show tooltip
  const handleNodeClick = (e: React.MouseEvent) => {
    if (!data.aiExplanation) return

    e.stopPropagation()
    e.preventDefault()

    // Close all other tooltips first
    window.dispatchEvent(new CustomEvent(CLOSE_ALL_TOOLTIPS_EVENT, { detail: { nodeId: id } }))

    // Get node position and show this tooltip
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      setNodeRect(rect)
      setShowTooltip(true)
    }
  }

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation()
    switch (action) {
      case 'edit':
        data.onEdit?.()
        break
      case 'duplicate':
        data.onDuplicate?.()
        break
      case 'delete':
        data.onDelete?.()
        break
      case 'configure':
        data.onConfigure?.()
        break
    }
  }

  const getNodeTypeLabel = (nodeType: string) => {
    const labels = {
      'database': 'Database',
      'api-service': 'API Service',
      'authentication': 'Auth Service',
      'frontend': 'Frontend',
      'external-service': 'External',
      'load-balancer': 'Load Balancer',
      'cache': 'Cache',
      'queue': 'Message Queue',
      'api-gateway': 'API Gateway',
      'service-mesh': 'Service Mesh',
      'cdn': 'CDN',
      'monitoring': 'Monitoring',
      'logging': 'Logging',
      'search-engine': 'Search Engine',
      'data-warehouse': 'Data Warehouse',
      'streaming': 'Streaming',
      'container-registry': 'Container Registry',
      'secrets-manager': 'Secrets Manager',
      'backup-storage': 'Backup Storage',
      'analytics': 'Analytics',
      'ml-service': 'ML/AI Service',
      'notification-service': 'Notifications',
      'scheduler': 'Scheduler',
      'workflow-engine': 'Workflow Engine',
      'identity-provider': 'Identity Provider',
      'vpn': 'VPN',
      'firewall': 'Firewall',
      'dns': 'DNS',
      'certificate-manager': 'Certificates',
      'artifact-repository': 'Artifacts',
      'ci-cd': 'CI/CD',
      'testing-service': 'Testing'
    }
    return labels[nodeType as keyof typeof labels] || nodeType
  }

  // Check if this node has API endpoints
  const hasEndpoints = data.metadata?.endpoints && Array.isArray(data.metadata.endpoints) && data.metadata.endpoints.length > 0

  return (
    <>
      <div
        ref={nodeRef}
        style={{ width: hasEndpoints ? 320 : 256, height: 'auto' }}
        onClick={handleNodeClick}
      >
        <Card
          className={`w-full shadow-md hover:shadow-xl transition-all duration-200 bg-white border ${
            selected ? 'ring-2 ring-[#005BE3] border-[#005BE3]' : 'border-[rgba(55,50,47,0.12)] hover:border-[rgba(55,50,47,0.2)]'
          } ${data.aiExplanation ? 'cursor-pointer' : ''}`}
          style={{
            borderTopColor: nodeColor,
            borderTopWidth: '4px'
          }}
        >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white shadow-sm !pointer-events-auto"
        style={{ backgroundColor: nodeColor }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white shadow-sm !pointer-events-auto"
        style={{ backgroundColor: nodeColor }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-white shadow-sm !pointer-events-auto"
        style={{ backgroundColor: nodeColor }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white shadow-sm !pointer-events-auto"
        style={{ backgroundColor: nodeColor }}
        isConnectable={true}
      />

      <CardHeader className="pb-3 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div 
              className="w-9 h-9 rounded-md flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: nodeColor }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[15px] text-[#1d1d1f] truncate">{data.name}</h4>
              <Badge 
                variant="outline" 
                className="text-[11px] mt-1 h-5 px-2 border-[rgba(55,50,47,0.12)]"
                style={{ borderColor: nodeColor, color: nodeColor }}
              >
                {getNodeTypeLabel(type as string)}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleMenuAction('edit', e)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuAction('configure', e)}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleMenuAction('duplicate', e)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleMenuAction('delete', e)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {/* Show description for non-API nodes */}
          {!hasEndpoints && (
            <p className="text-[13px] text-gray-600 truncate">{data.description}</p>
          )}
          
          {/* Show API endpoint list if available */}
          {hasEndpoints && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-600">
                  {data.metadata.endpoints.length} Endpoint{data.metadata.endpoints.length > 1 ? 's' : ''}
                </span>
                {data.metadata.authEndpoints !== undefined && (
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      🔒 {data.metadata.authEndpoints}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      🌐 {data.metadata.publicEndpoints}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {data.metadata.endpoints.map((endpoint: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 p-1.5 bg-gray-50/80 rounded hover:bg-gray-100/80 transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 flex-shrink-0 font-semibold"
                      style={{
                        borderColor: nodeColor,
                        color: nodeColor,
                        backgroundColor: `${nodeColor}15`
                      }}
                    >
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <code className="text-[10px] text-[#1d1d1f] font-mono block break-all leading-tight">
                        {endpoint.path}
                      </code>
                      {endpoint.requiresAuth && (
                        <span className="text-[9px] text-orange-600 inline-block mt-0.5">
                          🔒 Auth
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show other metadata */}
          {data.metadata && !hasEndpoints && (
            <div className="space-y-1.5">
              {data.metadata.technology && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">Tech:</span>
                  <Badge variant="secondary" className="text-[11px] h-5">
                    {data.metadata.technology}
                  </Badge>
                </div>
              )}
              
              {data.metadata.port && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">Port:</span>
                  <span className="font-mono">{data.metadata.port}</span>
                </div>
              )}
              
              {data.metadata.tables && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">Tables:</span>
                  <span className="font-medium">{data.metadata.tables}</span>
                </div>
              )}
              
              {data.metadata.external && (
                <Badge variant="outline" className="text-[11px] w-full justify-center h-5">
                  External Service
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
      </div>

      {/* AI Explanation Tooltip */}
      {showTooltip && data.aiExplanation && nodeRect && (
        <NodeExplanationTooltip
          nodeName={data.name}
          nodeType={getNodeTypeLabel(type as string)}
          explanation={data.aiExplanation}
          onClose={() => setShowTooltip(false)}
          nodeRect={nodeRect}
        />
      )}
    </>
  )
}

export default memo(ArchitectureNodeComponent)