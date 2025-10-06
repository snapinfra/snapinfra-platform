import { ArchitectureNode, ArchitectureEdge, SystemArchitecture, DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'

// Layout configuration for clean hierarchical spacing
const LAYOUT = {
  horizontalSpacing: 400,  // Space between layers
  verticalSpacing: 250,    // Space between nodes in same layer (increased for better visibility)
  startX: 150,
  startY: 150,             // Increased start Y position
}

// Helper to calculate positions in layers
function calculatePosition(layer: number, indexInLayer: number, totalInLayer: number) {
  const x = LAYOUT.startX + (layer * LAYOUT.horizontalSpacing)
  const centerY = LAYOUT.startY + (totalInLayer - 1) * LAYOUT.verticalSpacing / 2
  const y = centerY + (indexInLayer * LAYOUT.verticalSpacing) - (totalInLayer - 1) * LAYOUT.verticalSpacing / 2
  return { x, y }
}

export function generateArchitectureFromData(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): SystemArchitecture {
  const nodes: ArchitectureNode[] = []
  const edges: ArchitectureEdge[] = []

  // Organize nodes by layers (left to right)
  const layerNodes: ArchitectureNode[][] = [[], [], [], [], [], []]

  // === LAYER 0: Client Layer (CDN + Frontend) ===
  layerNodes[0].push({
    id: 'cdn-1',
    type: 'cdn',
    position: { x: 0, y: 0 },
    data: {
      name: 'CDN',
      description: 'Content delivery',
      color: '#0891B2',
      metadata: { technology: 'CloudFront' }
    }
  })

  layerNodes[0].push({
    id: 'frontend-1',
    type: 'frontend',
    position: { x: 0, y: 0 },
    data: {
      name: `${projectName} App`,
      description: 'Web application',
      color: '#3B82F6',
      metadata: { technology: 'React' }
    }
  })

  // === LAYER 1: Gateway Layer ===
  layerNodes[1].push({
    id: 'api-gateway-1',
    type: 'api-gateway',
    position: { x: 0, y: 0 },
    data: {
      name: 'API Gateway',
      description: 'Request routing',
      color: '#059669',
      metadata: { technology: 'Kong' }
    }
  })

  // Authentication
  const hasAuthEndpoints = apiData.endpoints.some((group: any) => 
    group.group.toLowerCase().includes('auth')
  )

  if (hasAuthEndpoints) {
    layerNodes[1].push({
      id: 'auth-service-1',
      type: 'authentication',
      position: { x: 0, y: 0 },
      data: {
        name: 'Auth Service',
        description: 'Authentication',
        color: '#F59E0B',
        metadata: { technology: 'JWT' }
      }
    })
  }

  // === LAYER 2: API Services ===
  const apiGroups = [...new Set(apiData.endpoints.map((group: any) => group.group))].slice(0, 4) // Limit to 4 services
  
  apiGroups.forEach((group) => {
    const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
    layerNodes[2].push({
      id: nodeId,
      type: 'api-service',
      position: { x: 0, y: 0 },
      data: {
        name: `${group} API`,
        description: `${group} operations`,
        color: '#8B5CF6',
        metadata: { technology: 'Node.js' }
      }
    })
  })

  // Add Cache to Layer 2 if needed
  const needsCache = schemaData.analysis?.scalingInsights?.expectedLoad === 'High'
  if (needsCache) {
    layerNodes[2].push({
      id: 'cache-1',
      type: 'cache',
      position: { x: 0, y: 0 },
      data: {
        name: 'Redis Cache',
        description: 'App caching',
        color: '#DC2626',
        metadata: { technology: 'Redis' }
      }
    })
  }

  // === LAYER 3: Data Layer ===
  layerNodes[3].push({
    id: 'database-1',
    type: 'database',
    position: { x: 0, y: 0 },
    data: {
      name: `${schemaData.analysis?.databaseRecommendations?.[0]?.name || 'PostgreSQL'}`,
      description: `${schemaData.schemas.length} tables`,
      color: '#EF4444',
      metadata: { technology: 'PostgreSQL' }
    }
  })

  // Search engine if multiple tables
  if (schemaData.schemas.length >= 3) {
    layerNodes[3].push({
      id: 'search-engine-1',
      type: 'search-engine',
      position: { x: 0, y: 0 },
      data: {
        name: 'Search Engine',
        description: 'Full-text search',
        color: '#B45309',
        metadata: { technology: 'Elasticsearch' }
      }
    })
  }

  // === LAYER 4: Infrastructure Services ===
  layerNodes[4].push({
    id: 'monitoring-1',
    type: 'monitoring',
    position: { x: 0, y: 0 },
    data: {
      name: 'Monitoring',
      description: 'Metrics & APM',
      color: '#EA580C',
      metadata: { technology: 'Datadog' }
    }
  })

  layerNodes[4].push({
    id: 'logging-1',
    type: 'logging',
    position: { x: 0, y: 0 },
    data: {
      name: 'Logging',
      description: 'Log aggregation',
      color: '#CA8A04',
      metadata: { technology: 'ELK' }
    }
  })

  layerNodes[4].push({
    id: 'notification-service-1',
    type: 'notification-service',
    position: { x: 0, y: 0 },
    data: {
      name: 'Notifications',
      description: 'Multi-channel messaging',
      color: '#8B5CF6',
      metadata: { technology: 'SNS' }
    }
  })

  // === LAYER 5: DevOps & Security ===
  layerNodes[5].push({
    id: 'ci-cd-1',
    type: 'ci-cd',
    position: { x: 0, y: 0 },
    data: {
      name: 'CI/CD',
      description: 'Deployment pipeline',
      color: '#059669',
      metadata: { technology: 'GitHub Actions' }
    }
  })

  layerNodes[5].push({
    id: 'secrets-manager-1',
    type: 'secrets-manager',
    position: { x: 0, y: 0 },
    data: {
      name: 'Secrets',
      description: 'Config management',
      color: '#374151',
      metadata: { technology: 'Vault' }
    }
  })

  layerNodes[5].push({
    id: 'backup-storage-1',
    type: 'backup-storage',
    position: { x: 0, y: 0 },
    data: {
      name: 'Backups',
      description: 'Disaster recovery',
      color: '#4B5563',
      metadata: { technology: 'S3' }
    }
  })

  // Calculate final positions for all nodes
  layerNodes.forEach((layer, layerIndex) => {
    layer.forEach((node, nodeIndex) => {
      node.position = calculatePosition(layerIndex, nodeIndex, layer.length)
      nodes.push(node)
    })
  })

  // === CREATE EDGES ===

  // Layer 0 to Layer 1
  edges.push({
    id: 'cdn-to-frontend',
    source: 'cdn-1',
    target: 'frontend-1',
    type: 'smoothstep',
    label: 'Assets',
    data: { protocol: 'HTTPS' }
  })

  edges.push({
    id: 'frontend-to-gateway',
    source: 'frontend-1',
    target: 'api-gateway-1',
    type: 'smoothstep',
    label: 'API Requests',
    data: { protocol: 'HTTPS' }
  })

  // Layer 1 to Layer 2 (Gateway to APIs)
  apiGroups.forEach((group) => {
    const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
    edges.push({
      id: `gateway-to-${nodeId}`,
      source: 'api-gateway-1',
      target: nodeId,
      type: 'smoothstep',
      label: 'Route',
      data: { protocol: 'HTTP' }
    })

    // Auth to APIs
    if (hasAuthEndpoints) {
      edges.push({
        id: `auth-to-${nodeId}`,
        source: 'auth-service-1',
        target: nodeId,
        type: 'smoothstep',
        label: 'Verify',
        data: { protocol: 'JWT' }
      })
    }

    // APIs to Database
    edges.push({
      id: `${nodeId}-to-db`,
      source: nodeId,
      target: 'database-1',
      type: 'smoothstep',
      label: 'Query',
      data: { protocol: 'SQL' }
    })

    // APIs to Cache
    if (needsCache) {
      edges.push({
        id: `${nodeId}-to-cache`,
        source: nodeId,
        target: 'cache-1',
        type: 'smoothstep',
        label: 'Cache',
        data: { protocol: 'TCP' }
      })
    }

    // APIs to Monitoring
    edges.push({
      id: `${nodeId}-to-monitoring`,
      source: nodeId,
      target: 'monitoring-1',
      type: 'smoothstep',
      label: 'Metrics',
      data: { protocol: 'HTTPS' }
    })

    // APIs to Logging
    edges.push({
      id: `${nodeId}-to-logging`,
      source: nodeId,
      target: 'logging-1',
      type: 'smoothstep',
      label: 'Logs',
      data: { protocol: 'HTTPS' }
    })

    // APIs to Secrets
    edges.push({
      id: `${nodeId}-to-secrets`,
      source: nodeId,
      target: 'secrets-manager-1',
      type: 'smoothstep',
      label: 'Config',
      data: { protocol: 'HTTPS' }
    })
  })

  // Database connections
  if (schemaData.schemas.length >= 3) {
    edges.push({
      id: 'db-to-search',
      source: 'database-1',
      target: 'search-engine-1',
      type: 'smoothstep',
      label: 'Sync',
      data: { protocol: 'HTTP' }
    })
  }

  edges.push({
    id: 'db-to-backup',
    source: 'database-1',
    target: 'backup-storage-1',
    type: 'smoothstep',
    label: 'Backup',
    data: { protocol: 'Encrypted' }
  })

  return {
    id: `arch-${Date.now()}`,
    name: `${projectName} System Architecture`,
    description: `Clean architecture for ${projectName}`,
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0.0',
    }
  }
}

export function getNodeTypeColor(type: ArchitectureNode['type']): string {
  const colors = {
    'database': '#EF4444',
    'api-service': '#8B5CF6',
    'authentication': '#F59E0B',
    'frontend': '#3B82F6',
    'external-service': '#6B7280',
    'load-balancer': '#10B981',
    'cache': '#DC2626',
    'queue': '#F97316',
    'api-gateway': '#059669',
    'service-mesh': '#7C3AED',
    'cdn': '#0891B2',
    'monitoring': '#EA580C',
    'logging': '#CA8A04',
    'search-engine': '#B45309',
    'data-warehouse': '#7C2D12',
    'streaming': '#BE185D',
    'container-registry': '#1F2937',
    'secrets-manager': '#374151',
    'backup-storage': '#4B5563',
    'analytics': '#7C3AED',
    'ml-service': '#EC4899',
    'notification-service': '#8B5CF6',
    'scheduler': '#0D9488',
    'workflow-engine': '#0F766E',
    'identity-provider': '#B91C1C',
    'vpn': '#9A3412',
    'firewall': '#DC2626',
    'dns': '#2563EB',
    'certificate-manager': '#16A34A',
    'artifact-repository': '#6B7280',
    'ci-cd': '#059669',
    'testing-service': '#7C2D12'
  }
  return colors[type] || '#6B7280'
}

export function getNodeTypeIcon(type: ArchitectureNode['type']): string {
  const icons = {
    'database': 'Database',
    'api-service': 'Server',
    'authentication': 'Shield',
    'frontend': 'Monitor',
    'external-service': 'Cloud',
    'load-balancer': 'Network',
    'cache': 'Zap',
    'queue': 'MessageSquare',
    'api-gateway': 'Network',
    'service-mesh': 'GitBranch',
    'cdn': 'Globe',
    'monitoring': 'Activity',
    'logging': 'FileText',
    'search-engine': 'Search',
    'data-warehouse': 'Archive',
    'streaming': 'Radio',
    'container-registry': 'Package',
    'secrets-manager': 'Key',
    'backup-storage': 'HardDrive',
    'analytics': 'BarChart3',
    'ml-service': 'Brain',
    'notification-service': 'Bell',
    'scheduler': 'Clock',
    'workflow-engine': 'GitMerge',
    'identity-provider': 'Users',
    'vpn': 'Lock',
    'firewall': 'Shield',
    'dns': 'Globe',
    'certificate-manager': 'Certificate',
    'artifact-repository': 'Package2',
    'ci-cd': 'GitPullRequest',
    'testing-service': 'TestTube'
  }
  return icons[type] || 'Box'
}

export const architectureTemplates = [
  {
    name: 'Simple Web App',
    description: 'Frontend + API + Database',
    icon: 'Globe',
    category: 'web-app' as const,
    nodes: [],
    edges: []
  }
]
