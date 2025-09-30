"use client"

import React, { memo } from 'react'
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
import { ArchitectureNode } from '@/lib/types/architecture'
import { getNodeTypeColor, getNodeTypeIcon } from '@/lib/utils/architecture'

export interface ArchitectureNodeData {
  name: string
  description?: string
  icon?: string
  color?: string
  metadata?: Record<string, any>
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

function ArchitectureNodeComponent({ data, selected, type }: NodeProps<ArchitectureNodeData>) {
  const IconComponent = iconComponents[getNodeTypeIcon(type as ArchitectureNode['type']) as keyof typeof iconComponents]
  const nodeColor = data.color || getNodeTypeColor(type as ArchitectureNode['type'])

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

  return (
    <Card
      className={`w-48 sm:w-56 shadow-lg transition-all duration-200 bg-white border-2 ${
        selected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        borderTopColor: nodeColor,
        borderTopWidth: '4px'
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white"
        style={{ backgroundColor: nodeColor }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white"
        style={{ backgroundColor: nodeColor }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-white"
        style={{ backgroundColor: nodeColor }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-white"
        style={{ backgroundColor: nodeColor }}
      />

      <CardHeader className="pb-3 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: nodeColor }}
            >
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{data.name}</h4>
              <Badge 
                variant="outline" 
                className="text-xs mt-1"
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
          <p className="text-xs text-gray-600 truncate">{data.description}</p>
          
          {data.metadata && (
            <div className="space-y-1">
              {data.metadata.technology && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tech:</span>
                  <Badge variant="secondary" className="text-xs">
                    {data.metadata.technology}
                  </Badge>
                </div>
              )}
              
              {data.metadata.port && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Port:</span>
                  <span className="font-mono">{data.metadata.port}</span>
                </div>
              )}
              
              {data.metadata.tables && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tables:</span>
                  <span className="font-medium">{data.metadata.tables}</span>
                </div>
              )}
              
              {data.metadata.endpoints && Array.isArray(data.metadata.endpoints) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Endpoints:</span>
                  <span className="font-medium">{data.metadata.endpoints.length}</span>
                </div>
              )}
              
              {data.metadata.external && (
                <Badge variant="outline" className="text-xs w-full justify-center">
                  External Service
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(ArchitectureNodeComponent)