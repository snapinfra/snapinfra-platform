import { ArchitectureNode, ArchitectureEdge, SystemArchitecture, DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'

// Layout configuration for better spacing
const LAYOUT = {
  horizontalSpacing: 350,
  verticalSpacing: 250,
  layerWidth: 300,
  startX: 100,
  startY: 100,
}

// Helper function to calculate positions in a hierarchical layout
function calculateLayeredPosition(layer: number, indexInLayer: number, totalInLayer: number) {
  const x = LAYOUT.startX + (layer * LAYOUT.horizontalSpacing)
  const centerOffset = (totalInLayer - 1) * LAYOUT.verticalSpacing / 2
  const y = LAYOUT.startY + (indexInLayer * LAYOUT.verticalSpacing) - centerOffset
  return { x, y: Math.max(y, LAYOUT.startY) }
}

export function generateArchitectureFromData(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): SystemArchitecture {
  const nodes: ArchitectureNode[] = []
  const edges: ArchitectureEdge[] = []
  
  // Track nodes by layer for better organization
  const layers: { [key: number]: ArchitectureNode[] } = {}

  // LAYER 0: CDN and Frontend (Entry points)
  const layer0: ArchitectureNode[] = []
  
  // CDN
  layer0.push({
    id: 'cdn-1',
    type: 'cdn',
    position: { x: 0, y: 0 }, // Will be recalculated
    data: {
      name: 'CDN',
      description: 'Global content delivery',
      color: '#0891B2',
      metadata: {
        technology: 'CloudFlare/CloudFront',
      }
    }
  })
  
  // Frontend
  layer0.push({
    id: 'frontend-1',
    type: 'frontend',
    position: { x: 0, y: 0 },
    data: {
      name: `${projectName} Frontend`,
      description: 'React/Next.js Application',
      color: '#3B82F6',
      metadata: {
        technology: 'React/Next.js',
      }
    }
  })
  
  // LAYER 1: API Gateway and Load Balancer
  const layer1: ArchitectureNode[] = []
  
  layer1.push({
    id: 'api-gateway-1',
    type: 'api-gateway',
    position: { x: 0, y: 0 },
    data: {
      name: 'API Gateway',
      description: 'API management',
      color: '#059669',
      metadata: {
        technology: 'Kong/AWS Gateway',
      }
    }
  })

  // Connect frontend to API gateway
  edges.push({
    id: 'frontend-to-gateway',
    source: 'frontend-1',
    target: 'api-gateway-1',
    type: 'smoothstep',
    label: 'HTTPS',
    data: {
      protocol: 'HTTPS',
      security: 'OAuth 2.0'
    }
  })

  // Create load balancer for high-scale architectures
  if (apiData.endpoints.length > 15 || schemaData.analysis?.scalingInsights?.expectedLoad === 'High') {
    nodes.push({
      id: 'load-balancer-1',
      type: 'load-balancer',
      position: { x: 500, y: 100 },
      data: {
        name: 'Load Balancer',
        description: 'High-availability traffic distribution',
        color: '#10B981',
        metadata: {
          technology: 'AWS ALB/HAProxy',
          features: ['Health Checks', 'SSL Termination', 'Auto Scaling']
        }
      }
    })

    // Connect API gateway to load balancer
    edges.push({
      id: 'gateway-to-lb',
      source: 'api-gateway-1',
      target: 'load-balancer-1',
      type: 'smoothstep',
      label: 'Internal',
      data: {
        protocol: 'HTTP',
        security: 'Internal Network'
      }
    })
  }

  // Create API service nodes based on endpoint groups
  const apiGroups = [...new Set(apiData.endpoints.map((group: any) => group.group))]
  apiGroups.forEach((group, index) => {
    const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
    nodes.push({
      id: nodeId,
      type: 'api-service',
      position: { x: 400 + (index % 2) * 300, y: 150 + Math.floor(index / 2) * 200 },
      data: {
        name: `${group} Service`,
        description: `Handles ${group.toLowerCase()} operations`,
        color: '#8B5CF6',
        metadata: {
          technology: 'Node.js/Express',
          endpoints: apiData.endpoints.find((g: any) => g.group === group)?.endpoints || []
        }
      }
    })

    // Connect to load balancer or API gateway
    const sourceId = nodes.find(n => n.type === 'load-balancer')?.id || 'api-gateway-1'
    edges.push({
      id: `${sourceId}-to-${nodeId}`,
      source: sourceId,
      target: nodeId,
      type: 'smoothstep',
      label: 'REST API',
      data: {
        protocol: 'HTTPS',
        security: 'JWT'
      }
    })
  })

  // Create authentication service if auth endpoints exist
  const hasAuthEndpoints = apiData.endpoints.some((group: any) => 
    group.group.toLowerCase().includes('auth') || 
    group.endpoints.some((ep: any) => ep.path.includes('auth') || ep.path.includes('login'))
  )

  if (hasAuthEndpoints) {
    nodes.push({
      id: 'auth-service-1',
      type: 'authentication',
      position: { x: 100, y: 400 },
      data: {
        name: 'Authentication Service',
        description: 'JWT-based authentication',
        color: '#F59E0B',
        metadata: {
          technology: 'JWT/OAuth',
          features: ['Login', 'Register', 'Password Reset']
        }
      }
    })

    // Connect auth service to API services
    apiGroups.forEach(group => {
      const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
      edges.push({
        id: `auth-to-${nodeId}`,
        source: 'auth-service-1',
        target: nodeId,
        type: 'smoothstep',
        label: 'Verify JWT',
        data: {
          protocol: 'HTTP',
          security: 'JWT'
        }
      })
    })
  }

  // Create database node
  const recommendedDb = schemaData.analysis?.databaseRecommendations?.[0]?.name || 'PostgreSQL'
  const schemas = Array.isArray(schemaData.schemas) ? schemaData.schemas : []
  const totalFields = schemas.reduce((acc: number, schema: any) => acc + (schema.fields?.length || 0), 0)
  
  nodes.push({
    id: 'database-1',
    type: 'database',
    position: { x: 700, y: 400 },
    data: {
      name: `${recommendedDb} Database`,
      description: `${schemas.length} tables, ${totalFields} fields`,
      color: '#EF4444',
      metadata: {
        technology: recommendedDb,
        tables: schemas.length,
        estimatedSize: schemaData.analysis?.scalingInsights?.expectedLoad || 'Medium'
      }
    }
  })

  // Connect API services to database
  apiGroups.forEach(group => {
    const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
    edges.push({
      id: `${nodeId}-to-db`,
      source: nodeId,
      target: 'database-1',
      type: 'smoothstep',
      label: 'SQL',
      data: {
        protocol: 'TCP',
        security: 'Connection Pooling + SSL'
      }
    })
  })

  // Add Enterprise Infrastructure Components
  
  // CDN for static assets
  nodes.push({
    id: 'cdn-1',
    type: 'cdn',
    position: { x: 50, y: 50 },
    data: {
      name: 'CDN',
      description: 'Global content delivery network for static assets',
      color: '#0891B2',
      metadata: {
        technology: 'CloudFlare/AWS CloudFront',
        features: ['Edge Caching', 'DDoS Protection', 'Geographic Distribution']
      }
    }
  })

  edges.push({
    id: 'cdn-to-frontend',
    source: 'cdn-1',
    target: 'frontend-1',
    type: 'smoothstep',
    label: 'Static Assets',
    data: {
      protocol: 'HTTPS',
      security: 'SSL'
    }
  })

  // Monitoring and Observability
  nodes.push({
    id: 'monitoring-1',
    type: 'monitoring',
    position: { x: 900, y: 50 },
    data: {
      name: 'Monitoring & APM',
      description: 'Application performance monitoring and metrics',
      color: '#EA580C',
      metadata: {
        technology: 'Datadog/New Relic/Prometheus',
        features: ['Real-time Metrics', 'Alerting', 'Distributed Tracing', 'SLO Monitoring']
      }
    }
  })

  // Logging System
  nodes.push({
    id: 'logging-1',
    type: 'logging',
    position: { x: 900, y: 200 },
    data: {
      name: 'Centralized Logging',
      description: 'Log aggregation and analysis platform',
      color: '#CA8A04',
      metadata: {
        technology: 'ELK Stack/Splunk/Datadog Logs',
        features: ['Log Aggregation', 'Search & Analysis', 'Real-time Processing']
      }
    }
  })

  // Connect all services to monitoring and logging
  const serviceNodes = nodes.filter(n => ['api-service', 'authentication', 'database'].includes(n.type))
  serviceNodes.forEach(serviceNode => {
    edges.push({
      id: `${serviceNode.id}-to-monitoring`,
      source: serviceNode.id,
      target: 'monitoring-1',
      type: 'smoothstep',
      label: 'Metrics',
      data: {
        protocol: 'HTTPS',
        description: 'Performance metrics and health data'
      }
    })
    
    edges.push({
      id: `${serviceNode.id}-to-logging`,
      source: serviceNode.id,
      target: 'logging-1',
      type: 'smoothstep',
      label: 'Logs',
      data: {
        protocol: 'HTTPS',
        description: 'Application and system logs'
      }
    })
  })

  // Add Security and DevOps Infrastructure
  
  // Secrets Manager
  nodes.push({
    id: 'secrets-manager-1',
    type: 'secrets-manager',
    position: { x: 1100, y: 300 },
    data: {
      name: 'Secrets Manager',
      description: 'Centralized secrets and configuration management',
      color: '#374151',
      metadata: {
        technology: 'AWS Secrets Manager/HashiCorp Vault',
        features: ['Secret Rotation', 'Access Control', 'Audit Logging', 'Encryption']
      }
    }
  })

  // Backup Storage
  nodes.push({
    id: 'backup-storage-1',
    type: 'backup-storage',
    position: { x: 900, y: 500 },
    data: {
      name: 'Backup & Disaster Recovery',
      description: 'Automated backups and disaster recovery system',
      color: '#4B5563',
      metadata: {
        technology: 'AWS S3/Azure Backup',
        features: ['Automated Backups', 'Point-in-time Recovery', 'Cross-region Replication']
      }
    }
  })

  // CI/CD Pipeline
  nodes.push({
    id: 'ci-cd-1',
    type: 'ci-cd',
    position: { x: 1100, y: 150 },
    data: {
      name: 'CI/CD Pipeline',
      description: 'Continuous integration and deployment automation',
      color: '#059669',
      metadata: {
        technology: 'GitHub Actions/Jenkins/GitLab CI',
        features: ['Automated Testing', 'Deployment Automation', 'Security Scanning', 'Rollback']
      }
    }
  })

  // Container Registry
  nodes.push({
    id: 'container-registry-1',
    type: 'container-registry',
    position: { x: 1300, y: 150 },
    data: {
      name: 'Container Registry',
      description: 'Container image storage and management',
      color: '#1F2937',
      metadata: {
        technology: 'AWS ECR/Docker Hub/Harbor',
        features: ['Image Scanning', 'Vulnerability Detection', 'Access Control']
      }
    }
  })

  // Connect CI/CD to container registry
  edges.push({
    id: 'ci-cd-to-registry',
    source: 'ci-cd-1',
    target: 'container-registry-1',
    type: 'smoothstep',
    label: 'Images',
    data: {
      protocol: 'HTTPS',
      description: 'Push/pull container images'
    }
  })

  // Connect database to backup storage
  edges.push({
    id: 'db-to-backup',
    source: 'database-1',
    target: 'backup-storage-1',
    type: 'smoothstep',
    label: 'Backups',
    data: {
      protocol: 'Encrypted',
      description: 'Automated database backups'
    }
  })

  // Connect services to secrets manager
  serviceNodes.forEach(serviceNode => {
    edges.push({
      id: `${serviceNode.id}-to-secrets`,
      source: serviceNode.id,
      target: 'secrets-manager-1',
      type: 'smoothstep',
      label: 'Config',
      data: {
        protocol: 'HTTPS',
        description: 'Retrieve secrets and configuration'
      }
    })
  })

  // Create cache if recommended
  const needsCache = schemaData.analysis?.scalingInsights?.cachingStrategy === 'Redis' ||
    schemaData.analysis?.scalingInsights?.expectedLoad === 'High'
    
  if (needsCache) {
    nodes.push({
      id: 'cache-1',
      type: 'cache',
      position: { x: 500, y: 500 },
      data: {
        name: 'Redis Cache',
        description: 'Application-level caching',
        color: '#DC2626',
        metadata: {
          technology: 'Redis',
          strategy: schemaData.analysis?.scalingInsights?.cachingStrategy || 'Application-level'
        }
      }
    })

    // Connect API services to cache
    apiGroups.forEach(group => {
      const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
      edges.push({
        id: `${nodeId}-to-cache`,
        source: nodeId,
        target: 'cache-1',
        type: 'smoothstep',
        label: 'Cache',
        data: {
          protocol: 'TCP'
        }
      })
    })
  }

  // Add Advanced Enterprise Components
  
  // Search Engine for complex queries
  if (schemaData.schemas.length >= 3) {
    nodes.push({
      id: 'search-engine-1',
      type: 'search-engine',
      position: { x: 500, y: 600 },
      data: {
        name: 'Search Engine',
        description: 'Full-text search and advanced query capabilities',
        color: '#B45309',
        metadata: {
          technology: 'Elasticsearch/Solr/AWS OpenSearch',
          features: ['Full-text Search', 'Faceted Search', 'Auto-complete', 'Analytics']
        }
      }
    })

    edges.push({
      id: 'db-to-search',
      source: 'database-1',
      target: 'search-engine-1',
      type: 'smoothstep',
      label: 'Data Sync',
      data: {
        protocol: 'HTTP',
        description: 'Synchronized search indexing'
      }
    })
  }

  // Data Warehouse for analytics
  if (schemaData.schemas.length >= 4) {
    nodes.push({
      id: 'data-warehouse-1',
      type: 'data-warehouse',
      position: { x: 700, y: 600 },
      data: {
        name: 'Data Warehouse',
        description: 'Analytics and business intelligence platform',
        color: '#7C2D12',
        metadata: {
          technology: 'Amazon Redshift/BigQuery/Snowflake',
          features: ['OLAP Queries', 'Historical Data', 'ETL Pipelines', 'BI Reports']
        }
      }
    })

    edges.push({
      id: 'db-to-warehouse',
      source: 'database-1',
      target: 'data-warehouse-1',
      type: 'smoothstep',
      label: 'ETL',
      data: {
        protocol: 'Batch Processing',
        description: 'Scheduled data replication'
      }
    })
  }

  // Analytics Service
  nodes.push({
    id: 'analytics-1',
    type: 'analytics',
    position: { x: 900, y: 600 },
    data: {
      name: 'Analytics Platform',
      description: 'Real-time analytics and reporting',
      color: '#7C3AED',
      metadata: {
        technology: 'Google Analytics/Mixpanel/Amplitude',
        features: ['User Analytics', 'Event Tracking', 'Conversion Funnels', 'A/B Testing']
      }
    }
  })

  // ML Service for advanced use cases
  if (apiData.endpoints.some((group: any) => 
    group.endpoints.some((ep: any) => 
      ep.path.includes('recommend') || 
      ep.path.includes('predict') || 
      ep.path.includes('classify') ||
      ep.description.toLowerCase().includes('machine learning')
    )
  )) {
    nodes.push({
      id: 'ml-service-1',
      type: 'ml-service',
      position: { x: 1100, y: 600 },
      data: {
        name: 'ML/AI Platform',
        description: 'Machine learning models and AI services',
        color: '#EC4899',
        metadata: {
          technology: 'AWS SageMaker/Google AI Platform/Azure ML',
          features: ['Model Training', 'Inference API', 'Model Versioning', 'A/B Testing']
        }
      }
    })

    // Connect API services to ML service
    apiGroups.forEach(group => {
      const nodeId = `api-${group.toLowerCase().replace(/\s+/g, '-')}`
      edges.push({
        id: `${nodeId}-to-ml`,
        source: nodeId,
        target: 'ml-service-1',
        type: 'smoothstep',
        label: 'ML API',
        data: {
          protocol: 'HTTPS',
          description: 'Machine learning predictions'
        }
      })
    })
  }

  // Notification Service for enterprise communications
  nodes.push({
    id: 'notification-service-1',
    type: 'notification-service',
    position: { x: 1300, y: 400 },
    data: {
      name: 'Notification Hub',
      description: 'Multi-channel notification and messaging service',
      color: '#8B5CF6',
      metadata: {
        technology: 'AWS SNS/Twilio/SendGrid',
        features: ['Email', 'SMS', 'Push Notifications', 'Webhook Delivery']
      }
    }
  })

  // Scheduler for background tasks
  nodes.push({
    id: 'scheduler-1',
    type: 'scheduler',
    position: { x: 1300, y: 550 },
    data: {
      name: 'Task Scheduler',
      description: 'Distributed task scheduling and background jobs',
      color: '#0D9488',
      metadata: {
        technology: 'Celery/AWS Step Functions/Kubernetes CronJobs',
        features: ['Cron Jobs', 'Distributed Tasks', 'Retry Logic', 'Job Monitoring']
      }
    }
  })

  // Create external services based on API endpoints
  const externalServices: string[] = []
  apiData.endpoints.forEach((group: any) => {
    group.endpoints.forEach((endpoint: any) => {
      if (endpoint.path.includes('upload') || endpoint.path.includes('media')) {
        if (!externalServices.includes('S3 Storage')) {
          externalServices.push('S3 Storage')
        }
      }
      if (endpoint.path.includes('email') || endpoint.path.includes('notification')) {
        if (!externalServices.includes('Email Service')) {
          externalServices.push('Email Service')
        }
      }
      if (endpoint.path.includes('payment') || endpoint.path.includes('stripe')) {
        if (!externalServices.includes('Payment Gateway')) {
          externalServices.push('Payment Gateway')
        }
      }
    })
  })

  externalServices.forEach((service, index) => {
    const serviceId = `external-${service.toLowerCase().replace(/\s+/g, '-')}`
    nodes.push({
      id: serviceId,
      type: 'external-service',
      position: { x: 1000, y: 100 + index * 150 },
      data: {
        name: service,
        description: `External ${service.toLowerCase()}`,
        color: '#6B7280',
        metadata: {
          external: true,
          provider: service.includes('S3') ? 'AWS' : service.includes('Email') ? 'SendGrid' : 'Stripe'
        }
      }
    })

    // Connect relevant API services to external services
    if (service.includes('Storage')) {
      const mediaApiNode = nodes.find(n => n.data.name.toLowerCase().includes('media') || 
        n.data.metadata?.endpoints?.some((ep: any) => ep.path.includes('upload')))
      if (mediaApiNode) {
        edges.push({
          id: `${mediaApiNode.id}-to-${serviceId}`,
          source: mediaApiNode.id,
          target: serviceId,
          type: 'smoothstep',
          label: 'File Upload',
          data: {
            protocol: 'HTTPS',
            security: 'API Key'
          }
        })
      }
    }
  })

  return {
    id: `arch-${Date.now()}`,
    name: `${projectName} System Architecture`,
    description: `Generated architecture for ${projectName} based on database schema and API endpoints`,
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      tags: ['generated', 'web-app']
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
    'ml-service': 'Zap',
    'notification-service': 'Bell',
    'scheduler': 'Clock',
    'workflow-engine': 'GitMerge',
    'identity-provider': 'Users',
    'vpn': 'Lock',
    'firewall': 'Shield',
    'dns': 'Globe',
    'certificate-manager': 'Key',
    'artifact-repository': 'Package',
    'ci-cd': 'GitPullRequest',
    'testing-service': 'Activity'
  }
  return icons[type] || 'Box'
}

export const architectureTemplates = [
  {
    name: 'Simple Web App',
    description: 'Frontend + API + Database',
    icon: 'Globe',
    category: 'web-app' as const,
    nodes: [
      {
        type: 'frontend' as const,
        data: { name: 'Frontend App', description: 'React/Next.js', color: '#3B82F6' }
      },
      {
        type: 'api-service' as const,
        data: { name: 'API Server', description: 'Node.js/Express', color: '#8B5CF6' }
      },
      {
        type: 'database' as const,
        data: { name: 'Database', description: 'PostgreSQL', color: '#EF4444' }
      }
    ],
    edges: []
  },
  {
    name: 'Microservices',
    description: 'Distributed service architecture',
    icon: 'Network',
    category: 'microservices' as const,
    nodes: [
      {
        type: 'frontend' as const,
        data: { name: 'Frontend', color: '#3B82F6' }
      },
      {
        type: 'load-balancer' as const,
        data: { name: 'Load Balancer', color: '#10B981' }
      },
      {
        type: 'api-service' as const,
        data: { name: 'User Service', color: '#8B5CF6' }
      },
      {
        type: 'api-service' as const,
        data: { name: 'Order Service', color: '#8B5CF6' }
      },
      {
        type: 'database' as const,
        data: { name: 'Database', color: '#EF4444' }
      }
    ],
    edges: []
  }
]