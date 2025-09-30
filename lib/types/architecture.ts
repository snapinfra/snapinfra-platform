export interface ArchitectureNode {
  id: string
  type: 'database' | 'api-service' | 'authentication' | 'frontend' | 'external-service' | 'load-balancer' | 'cache' | 'queue' |
        'api-gateway' | 'service-mesh' | 'cdn' | 'monitoring' | 'logging' | 'search-engine' | 'data-warehouse' |
        'streaming' | 'container-registry' | 'secrets-manager' | 'backup-storage' | 'analytics' | 'ml-service' |
        'notification-service' | 'scheduler' | 'workflow-engine' | 'identity-provider' | 'vpn' | 'firewall' |
        'dns' | 'certificate-manager' | 'artifact-repository' | 'ci-cd' | 'testing-service'
  position: { x: number; y: number }
  data: {
    name: string
    description?: string
    icon?: string
    color?: string
    metadata?: Record<string, any>
  }
}

export interface ArchitectureEdge {
  id: string
  source: string
  target: string
  type?: 'default' | 'smoothstep' | 'straight' | 'step'
  label?: string
  data?: {
    protocol?: 'HTTP' | 'HTTPS' | 'WebSocket' | 'gRPC' | 'TCP' | 'UDP'
    description?: string
    security?: 'JWT' | 'API Key' | 'OAuth' | 'Basic Auth' | 'None'
  }
}

export interface SystemArchitecture {
  id: string
  name: string
  description?: string
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
  metadata?: {
    createdAt: string
    updatedAt: string
    version: string
    tags?: string[]
  }
}

export interface ArchitectureTemplate {
  name: string
  description: string
  icon: string
  nodes: Omit<ArchitectureNode, 'id' | 'position'>[]
  edges: Omit<ArchitectureEdge, 'id' | 'source' | 'target'>[]
  category: 'web-app' | 'mobile-app' | 'microservices' | 'monolith' | 'serverless'
}

export interface DatabaseSchemaToArchitecture {
  schemas: any[]
  analysis: any
}

export interface ApiEndpointsToArchitecture {
  endpoints: any[]
  groups: string[]
}