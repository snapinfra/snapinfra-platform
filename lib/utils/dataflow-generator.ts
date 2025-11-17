// lib/utils/dataflow-generator.ts
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export interface DataFlowNode {
  id: string
  type: 'external-entity' | 'process' | 'data-store' | 'data-flow'
  position: { x: number; y: number }
  data: {
    label: string
    description: string
    color: string
    metadata?: {
      technology?: string
      dataTypes?: string[]
      operations?: string[]
    }
  }
}

export interface DataFlowEdge {
  id: string
  source: string
  target: string
  label: string
  type: 'smoothstep' | 'step' | 'default'
  animated?: boolean
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
  data?: {
    dataType?: string
    isEncrypted?: boolean
    isBidirectional?: boolean
  }
}

export interface DataFlowDiagram {
  id: string
  name: string
  nodes: DataFlowNode[]
  edges: DataFlowEdge[]
  metadata: {
    totalNodes: number
    totalFlows: number
    encryptedFlows: number
    createdAt: string
  }
}

const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || ''
})

// Enhanced layout configuration for better ReactFlow visualization
const DFD_LAYOUT = {
  horizontalSpacing: 450,
  verticalSpacing: 200,
  startX: 50,
  startY: 50,
  layerConfig: {
    'external-entity': { x: 0, spacing: 250 },
    'gateway': { x: 500, spacing: 200 },
    'process': { x: 1000, spacing: 180 },
    'data-store': { x: 1500, spacing: 180 },
    'external-service': { x: 2000, spacing: 200 }
  }
}

function getNodeColor(type: string): string {
  const colors = {
    'external-entity': '#3B82F6', // Blue
    'process': '#8B5CF6',         // Purple
    'data-store': '#EF4444',      // Red
    'gateway': '#10B981'          // Green
  }
  return colors[type as keyof typeof colors] || '#6B7280'
}

function calculateLayeredPosition(
  layerType: string, 
  indexInLayer: number, 
  totalInLayer: number
): { x: number; y: number } {
  const layerConfig = DFD_LAYOUT.layerConfig[layerType as keyof typeof DFD_LAYOUT.layerConfig]
  
  if (!layerConfig) {
    return { 
      x: DFD_LAYOUT.startX, 
      y: DFD_LAYOUT.startY + (indexInLayer * DFD_LAYOUT.verticalSpacing) 
    }
  }

  // Center nodes vertically within their layer
  const totalHeight = (totalInLayer - 1) * layerConfig.spacing
  const startY = DFD_LAYOUT.startY + (totalHeight > 800 ? 0 : (800 - totalHeight) / 2)
  
  return {
    x: layerConfig.x,
    y: startY + (indexInLayer * layerConfig.spacing)
  }
}

export async function generateDataFlowFromSystem(
  schemas: any[],
  endpoints: any[],
  projectName: string
): Promise<DataFlowDiagram> {
  console.log('🗺️ Generating Enhanced Data Flow Diagram...')
  console.log(`  Tables: ${schemas.length}, Endpoint Groups: ${endpoints.length}`)
  
  const nodes: DataFlowNode[] = []
  const edges: DataFlowEdge[] = []
  let encryptedFlows = 0

  // === LAYER 0: External Entities (Clients) ===
  const externalEntities = [
    {
      id: 'client-web',
      label: 'Web Client',
      description: 'Browser-based users accessing the application',
      operations: ['Browse', 'Create Tasks', 'Manage Data']
    },
    {
      id: 'client-mobile',
      label: 'Mobile App',
      description: 'Mobile users with iOS/Android apps',
      operations: ['View Tasks', 'Quick Actions', 'Notifications']
    },
    {
      id: 'client-admin',
      label: 'Admin Panel',
      description: 'System administrators managing the platform',
      operations: ['Configure', 'Monitor', 'User Management']
    }
  ]

  externalEntities.forEach((entity, idx) => {
    nodes.push({
      id: entity.id,
      type: 'external-entity',
      position: calculateLayeredPosition('external-entity', idx, externalEntities.length),
      data: {
        label: entity.label,
        description: entity.description,
        color: getNodeColor('external-entity'),
        metadata: {
          technology: 'HTTP/HTTPS Client',
          operations: entity.operations
        }
      }
    })
  })

  // === LAYER 1: Gateway Layer ===
  const gatewayNodes = [
    {
      id: 'load-balancer',
      label: 'Load Balancer',
      description: 'Distributes incoming traffic across services',
      technology: 'Nginx / AWS ALB'
    },
    {
      id: 'api-gateway',
      label: 'API Gateway',
      description: 'Central entry point for all API requests',
      technology: 'Express.js / Kong'
    },
    {
      id: 'auth-service',
      label: 'Authentication Service',
      description: 'Handles user authentication and JWT validation',
      technology: 'JWT / OAuth2'
    }
  ]

  gatewayNodes.forEach((gw, idx) => {
    nodes.push({
      id: gw.id,
      type: 'process',
      position: calculateLayeredPosition('gateway', idx, gatewayNodes.length),
      data: {
        label: gw.label,
        description: gw.description,
        color: getNodeColor('gateway'),
        metadata: {
          technology: gw.technology,
          operations: ['Route', 'Validate', 'Authenticate']
        }
      }
    })
  })

  // === LAYER 2: Business Logic / API Services ===
  const endpointServices = endpoints.slice(0, 6).map((group, idx) => {
    const serviceId = `service-${group.group.toLowerCase().replace(/\s+/g, '-')}`
    const endpointMethods = group.endpoints.map((ep: any) => ep.method).filter((v: any, i: any, a: any) => a.indexOf(v) === i)
    
    nodes.push({
      id: serviceId,
      type: 'process',
      position: calculateLayeredPosition('process', idx, Math.min(endpoints.length, 6)),
      data: {
        label: `${group.group} Service`,
        description: `Handles ${group.group.toLowerCase()} business logic`,
        color: getNodeColor('process'),
        metadata: {
          technology: 'Node.js / TypeScript',
          operations: endpointMethods,
          dataTypes: ['JSON', 'REST API']
        }
      }
    })

    return serviceId
  })

  // === LAYER 3: Data Storage Layer ===
  const mainTables = schemas.slice(0, 6)
  const dataStores: string[] = []

  mainTables.forEach((schema, idx) => {
    const storeId = `db-${schema.name.toLowerCase()}`
    dataStores.push(storeId)
    
    nodes.push({
      id: storeId,
      type: 'data-store',
      position: calculateLayeredPosition('data-store', idx, mainTables.length),
      data: {
        label: `${schema.name} Table`,
        description: schema.comment || `Stores ${schema.name.toLowerCase()} records`,
        color: getNodeColor('data-store'),
        metadata: {
          technology: 'PostgreSQL',
          operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
          dataTypes: schema.fields.slice(0, 3).map((f: any) => f.type)
        }
      }
    })
  })

  // === LAYER 4: External Services ===
  const externalServices = [
    {
      id: 'cache-redis',
      label: 'Redis Cache',
      description: 'High-speed caching layer for frequently accessed data',
      technology: 'Redis'
    },
    {
      id: 'file-storage',
      label: 'File Storage',
      description: 'Cloud storage for uploads and static files',
      technology: 'AWS S3 / CloudFlare R2'
    },
    {
      id: 'notification-service',
      label: 'Notification Service',
      description: 'Sends email and push notifications',
      technology: 'SendGrid / FCM'
    }
  ]

  externalServices.forEach((svc, idx) => {
    nodes.push({
      id: svc.id,
      type: 'data-store',
      position: calculateLayeredPosition('external-service', idx, externalServices.length),
      data: {
        label: svc.label,
        description: svc.description,
        color: '#F59E0B', // Orange for external services
        metadata: {
          technology: svc.technology,
          operations: ['GET', 'SET', 'PUBLISH']
        }
      }
    })
  })

  // === CREATE EDGES (Data Flows) ===

  // External entities -> Load Balancer
  externalEntities.forEach((entity, idx) => {
    edges.push({
      id: `flow-${entity.id}-lb`,
      source: entity.id,
      target: 'load-balancer',
      label: 'HTTPS Request',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 2 },
      data: {
        dataType: 'JSON',
        isEncrypted: true,
        isBidirectional: true
      }
    })
    encryptedFlows++
  })

  // Load Balancer -> API Gateway
  edges.push({
    id: 'flow-lb-gateway',
    source: 'load-balancer',
    target: 'api-gateway',
    label: 'Routed Traffic',
    type: 'smoothstep',
    style: { stroke: '#3B82F6', strokeWidth: 2 }
  })

  // API Gateway -> Auth Service
  edges.push({
    id: 'flow-gateway-auth',
    source: 'api-gateway',
    target: 'auth-service',
    label: 'Auth Check',
    type: 'smoothstep',
    style: { stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '5,5' },
    data: {
      dataType: 'JWT Token',
      isEncrypted: true
    }
  })
  encryptedFlows++

  // API Gateway -> Services
  endpointServices.forEach((serviceId, idx) => {
    edges.push({
      id: `flow-gateway-${serviceId}`,
      source: 'api-gateway',
      target: serviceId,
      label: `API Calls`,
      type: 'smoothstep',
      style: { stroke: '#8B5CF6', strokeWidth: 2 }
    })
  })

  // Services -> Databases
  endpointServices.forEach((serviceId, idx) => {
    if (dataStores[idx]) {
      edges.push({
        id: `flow-${serviceId}-db`,
        source: serviceId,
        target: dataStores[idx],
        label: 'SQL Queries',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#EF4444', strokeWidth: 2 },
        data: {
          dataType: 'SQL',
          isBidirectional: true
        }
      })
    }
  })

  // Services -> Cache
  if (endpointServices[0]) {
    edges.push({
      id: 'flow-service-cache',
      source: endpointServices[0],
      target: 'cache-redis',
      label: 'Cache Operations',
      type: 'smoothstep',
      style: { stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '3,3' },
      data: {
        dataType: 'Key-Value',
        isBidirectional: true
      }
    })
  }

  // Services -> File Storage
  if (endpointServices[0]) {
    edges.push({
      id: 'flow-service-files',
      source: endpointServices[0],
      target: 'file-storage',
      label: 'Upload/Download',
      type: 'smoothstep',
      style: { stroke: '#06B6D4', strokeWidth: 2 },
      data: {
        dataType: 'Binary',
        isEncrypted: true
      }
    })
    encryptedFlows++
  }

  // Services -> Notifications
  if (endpointServices[1]) {
    edges.push({
      id: 'flow-service-notifications',
      source: endpointServices[1],
      target: 'notification-service',
      label: 'Send Alerts',
      type: 'smoothstep',
      style: { stroke: '#EC4899', strokeWidth: 2 },
      data: {
        dataType: 'Message',
        isEncrypted: true
      }
    })
    encryptedFlows++
  }

  console.log('✅ Data Flow Diagram Generated')
  console.log(`  Nodes: ${nodes.length}, Edges: ${edges.length}, Encrypted: ${encryptedFlows}`)

  return {
    id: `dfd-${Date.now()}`,
    name: `${projectName} - Data Flow Diagram`,
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalFlows: edges.length,
      encryptedFlows,
      createdAt: new Date().toISOString()
    }
  }
}

export async function generateEnhancedDataFlow(
  schemas: any[],
  endpoints: any[],
  projectName: string
): Promise<DataFlowDiagram> {
  try {
    const systemPrompt = `You are a data flow architect. Analyze the system and identify:
1. Critical data bottlenecks
2. Security vulnerabilities in data transmission
3. Caching opportunities
4. Data transformation points
5. High-traffic endpoints

Return as valid JSON only.`
    
    const userPrompt = `Analyze data flow for "${projectName}":

Database Tables: ${schemas.slice(0, 5).map((s: any) => s.name).join(', ')}
API Endpoints: ${endpoints.slice(0, 5).map((e: any) => `${e.group} (${e.endpoints?.length || 0} endpoints)`).join(', ')}

Provide JSON response with this structure:
{
  "bottlenecks": ["description of bottleneck 1", "description 2"],
  "securityIssues": ["issue 1", "issue 2"],
  "cachingOpportunities": ["opportunity 1", "opportunity 2"],
  "transformationPoints": ["point 1", "point 2"]
}`

    const response = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      maxTokens: 1500
    })

    const dfd = await generateDataFlowFromSystem(schemas, endpoints, projectName)
    
    // Parse AI insights
    try {
      let aiInsights = response.text.trim()
      // Remove markdown code blocks if present
      aiInsights = aiInsights.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
      const insights = JSON.parse(aiInsights)
      ;(dfd as any).aiInsights = insights
      console.log('✅ AI insights added to Data Flow Diagram')
    } catch (e) {
      console.warn('⚠️ Could not parse AI insights, using base DFD')
    }
    
    return dfd
    
  } catch (error) {
    console.error('❌ Enhanced Data Flow generation failed:', error)
    // Fallback to basic generation
    return generateDataFlowFromSystem(schemas, endpoints, projectName)
  }
}