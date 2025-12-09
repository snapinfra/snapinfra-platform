import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

// --- Types ---

export interface DataFlowNode {
  id: string
  type: 'external-entity' | 'process' | 'data-store' | 'gateway'
  position: { x: number; y: number }
  data: {
    label: string
    description: string
    color: string
    nodeType: string
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
  label?: string
  type: 'smoothstep' | 'step' | 'default'
  animated?: boolean
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
  markerEnd?: {
    type: string
    color?: string
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
  aiInsights?: {
    bottlenecks: string[]
    securityIssues: string[]
    cachingOpportunities: string[]
    transformationPoints: string[]
  }
}

// --- Configuration ---

const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || ''
})

const LAYOUT = {
  layers: {
    externalEntity: { x: 0, spacing: 200 },
    gateway: { x: 400, spacing: 250 },
    service: { x: 900, spacing: 200 },
    database: { x: 1400, spacing: 200 },
    external: { x: 1400, spacing: 400 } // Align with DBs but offset vertically if needed
  },
  startY: 50
}

function getNodeColor(type: string): string {
  const colors = {
    'external-entity': '#3B82F6', // Blue
    'gateway': '#10B981',         // Green
    'process': '#8B5CF6',         // Purple
    'data-store': '#EF4444',      // Red
    'external-service': '#F59E0B' // Amber
  }
  return colors[type as keyof typeof colors] || '#6B7280'
}

function calculatePosition(
  layer: keyof typeof LAYOUT.layers,
  index: number,
  total: number
): { x: number; y: number } {
  const config = LAYOUT.layers[layer]
  // Center the layer vertically based on total items
  const totalHeight = (total - 1) * config.spacing
  const centerY = LAYOUT.startY + Math.max(0, (600 - totalHeight) / 2)

  return {
    x: config.x,
    y: centerY + (index * config.spacing)
  }
}

// --- Generation Logic ---

/**
 * Creates the base nodes for the system. 
 * This runs regardless of AI availability to ensure the UI always has content.
 */
function createBaseNodes(schemas: any[], endpoints: any[]) {
  const nodes: DataFlowNode[] = []

  // 1. External Entities (Clients)
  const externalEntities = [
    { id: 'client-web', label: 'Web Browser', desc: 'React Client', ops: ['HTTPS'] },
    { id: 'client-mobile', label: 'Mobile App', desc: 'iOS/Android', ops: ['HTTPS'] }
  ]

  externalEntities.forEach((entity, idx) => {
    nodes.push({
      id: entity.id,
      type: 'external-entity',
      position: calculatePosition('externalEntity', idx, externalEntities.length),
      data: {
        label: entity.label,
        description: entity.desc,
        color: getNodeColor('external-entity'),
        nodeType: 'external-entity',
        metadata: { technology: 'Client', operations: entity.ops }
      }
    })
  })

  // 2. Gateways
  const gateways = [
    { id: 'api-gateway', label: 'API Gateway', desc: 'Load Balancer / Ingress', tech: 'Nginx/Kong' },
    { id: 'auth-service', label: 'Auth Service', desc: 'Identity Provider', tech: 'OAuth2' }
  ]

  gateways.forEach((gw, idx) => {
    nodes.push({
      id: gw.id,
      type: 'gateway',
      position: calculatePosition('gateway', idx, gateways.length),
      data: {
        label: gw.label,
        description: gw.description,
        color: getNodeColor('gateway'),
        nodeType: 'gateway',
        metadata: { technology: gw.tech, operations: ['Route', 'Verify'] }
      }
    })
  })

  // 3. Services (From Endpoints)
  // If no endpoints provided, create a default one
  const safeEndpoints = endpoints.length > 0 ? endpoints : [{ group: 'Core', endpoints: [{ method: 'ALL' }] }]

  const services = safeEndpoints.slice(0, 6).map((group, idx) => {
    const safeName = group.group || `Service-${idx}`
    const serviceId = `svc-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

    nodes.push({
      id: serviceId,
      type: 'process',
      position: calculatePosition('service', idx, Math.min(safeEndpoints.length, 6)),
      data: {
        label: `${safeName} Service`,
        description: `Handles ${safeName} logic`,
        color: getNodeColor('process'),
        nodeType: 'process',
        metadata: {
          technology: 'Node.js',
          operations: group.endpoints?.map((e: any) => e.method).slice(0, 3) || ['REST']
        }
      }
    })
    return serviceId
  })

  // 4. Data Stores (From Schemas)
  // If no schemas, create a default one
  const safeSchemas = schemas.length > 0 ? schemas : [{ name: 'MainDB', fields: [] }]

  const databases = safeSchemas.slice(0, 6).map((schema, idx) => {
    const safeName = schema.name || `DB-${idx}`
    const dbId = `db-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

    nodes.push({
      id: dbId,
      type: 'data-store',
      position: calculatePosition('database', idx, Math.min(safeSchemas.length, 6)),
      data: {
        label: safeName,
        description: 'Relational Data Store',
        color: getNodeColor('data-store'),
        nodeType: 'data-store',
        metadata: {
          technology: 'Postgres',
          dataTypes: schema.fields?.slice(0, 3).map((f: any) => f.type) || ['mixed']
        }
      }
    })
    return dbId
  })

  // 5. External Services (Static)
  const externalSvcs = [
    { id: 'ext-email', label: 'Email Provider', desc: 'SendGrid/SES' },
    { id: 'ext-cache', label: 'Redis Cache', desc: 'Session Store' }
  ]

  externalSvcs.forEach((svc, idx) => {
    nodes.push({
      id: svc.id,
      type: 'data-store', // Using data-store shape for external svcs usually works well
      position: calculatePosition('external', idx, externalSvcs.length),
      data: {
        label: svc.label,
        description: svc.desc,
        color: getNodeColor('external-service'),
        nodeType: 'external-service',
        metadata: { technology: 'SaaS', operations: ['API'] }
      }
    })
  })

  return { nodes, serviceIds: services, dbIds: databases }
}

/**
 * Generates a fallback set of edges if AI fails.
 * Connects layers sequentially: Client -> Gateway -> Service -> (DB + Cache)
 */
function createFallbackEdges(nodes: DataFlowNode[]) {
  const edges: DataFlowEdge[] = []

  const getNodesByType = (t: string) => nodes.filter(n => n.type === t || n.data.nodeType === t)

  const clients = getNodesByType('external-entity')
  const gateways = getNodesByType('gateway')
  const services = getNodesByType('process')
  const stores = getNodesByType('data-store')
  const external = getNodesByType('external-service')

  // 1. Clients -> Main Gateway
  const mainGateway = gateways.find(g => g.id === 'api-gateway') || gateways[0]
  if (mainGateway) {
    clients.forEach(client => {
      edges.push({
        id: `e-${client.id}-${mainGateway.id}`,
        source: client.id,
        target: mainGateway.id,
        label: 'HTTPS',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#9CA3AF', strokeWidth: 2 }
      })
    })
  }

  // 2. Gateway -> Services
  if (mainGateway) {
    services.forEach(svc => {
      edges.push({
        id: `e-${mainGateway.id}-${svc.id}`,
        source: mainGateway.id,
        target: svc.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#10B981', strokeWidth: 2 }
      })
    })
  }

  // 3. Gateway <-> Auth
  const authService = gateways.find(g => g.id === 'auth-service')
  if (mainGateway && authService) {
    edges.push({
      id: `e-${mainGateway.id}-${authService.id}`,
      source: mainGateway.id,
      target: authService.id,
      label: 'Validate',
      type: 'smoothstep',
      style: { strokeDasharray: '5,5', stroke: '#F59E0B' }
    })
  }

  // 4. Services -> Databases (Heuristic: Connect Svc to DB if they share a name part, else Round Robin)
  services.forEach((svc, idx) => {
    // Try to find a matching DB
    const svcName = svc.data.label.toLowerCase()
    let targetDB = stores.find(db => svcName.includes(db.data.label.toLowerCase()))

    // Fallback: Connect to DB at same index, or first DB
    if (!targetDB && stores.length > 0) {
      targetDB = stores[idx % stores.length]
    }

    if (targetDB) {
      edges.push({
        id: `e-${svc.id}-${targetDB.id}`,
        source: svc.id,
        target: targetDB.id,
        label: 'Query',
        type: 'smoothstep',
        style: { stroke: '#EF4444' }
      })
    }
  })

  // 5. Services -> Cache (First service usually connects to cache)
  const cache = external.find(e => e.id.includes('cache'))
  if (services.length > 0 && cache) {
    edges.push({
      id: `e-${services[0].id}-${cache.id}`,
      source: services[0].id,
      target: cache.id,
      label: 'Cache Hit/Miss',
      type: 'smoothstep',
      style: { strokeDasharray: '5,5', stroke: '#F59E0B' }
    })
  }

  return edges
}

export async function generateEnhancedDataFlow(
  schemas: any[],
  endpoints: any[],
  projectName: string
): Promise<DataFlowDiagram> {
  console.log('🗺️ Generating Enhanced Data Flow...')

  // 1. Generate Nodes Deterministically (This ensures visual consistency)
  const { nodes } = createBaseNodes(schemas, endpoints)

  // 2. Prepare Context for AI
  const nodeSummary = nodes.map(n => ({
    id: n.id,
    label: n.data.label,
    type: n.data.nodeType
  }))

  const systemPrompt = `
You are a Senior System Architect designing data flow connections for a software system.

CRITICAL RULES FOR EDGE CONNECTIONS:
1. ALL External Entities (clients) → API Gateway (use id 'api-gateway')
2. API Gateway → Auth Service (use id 'auth-service') for token validation
3. API Gateway → ALL Process/Service nodes (these handle business logic)
4. Each Service node → Matching Database node (match by name similarity)
   - Example: 'svc-user' connects to 'db-user'
   - Example: 'svc-orders' connects to 'db-orders'
5. At least ONE Service → Cache (id contains 'cache') for session/data caching
6. Services that send notifications → Email service (id contains 'email')
7. Auth Service → User Database for credential verification

CONNECTION PATTERNS:
- Client to Gateway: label "HTTPS Request"
- Gateway to Service: label "Route"
- Service to Database: label "Query/Update"
- Service to Cache: label "Cache Read/Write"
- Service to Email: label "Send Notification"
- Gateway to Auth: label "Verify Token"

OUTPUT FORMAT (strict JSON):
{
  "edges": [
    {"source": "exact-node-id", "target": "exact-node-id", "label": "Action"},
    ...
  ],
  "insights": {
    "bottlenecks": ["Specific bottleneck observations"],
    "cachingOpportunities": ["Specific caching suggestions"],
    "securityIssues": ["Security concerns if any"],
    "transformationPoints": ["Data transformation notes"]
  }
}

ENSURE: Every node should have at least one connection. Use EXACT node IDs from the provided list.
`

  const userPrompt = `
System: ${projectName}

Available Nodes:
${JSON.stringify(nodeSummary, null, 2)}

Create a complete, logical data flow by connecting:
1. All clients to api-gateway
2. api-gateway to all services
3. Each service to its corresponding database (match names)
4. Auth flows and external service integrations
5. Provide specific architectural insights based on the actual node names and types present
`

  let edges: DataFlowEdge[] = []
  let insights = {
    bottlenecks: [] as string[],
    securityIssues: [] as string[],
    cachingOpportunities: [] as string[],
    transformationPoints: [] as string[]
  }

  try {
    const response = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Low temp for strict JSON
      responseFormat: { type: 'json' } // Enforce JSON mode if supported or parsed manually
    })

    // Parse AI Response
    let aiText = response.text.trim()
    // Cleanup markdown code blocks if present
    // ... continuing from previous code ...
    if (aiText.startsWith('```')) {
      aiText = aiText.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '')
    }

    const aiData = JSON.parse(aiText)

    // Process Edges from AI
    if (aiData.edges && Array.isArray(aiData.edges)) {
      edges = aiData.edges.map((e: any) => {
        // Look up nodes to apply consistent styling based on connection type
        const sourceNode = nodes.find(n => n.id === e.source)
        const targetNode = nodes.find(n => n.id === e.target)

        // Default styling
        let strokeColor = '#9CA3AF' // Gray
        let isDashed = false
        let isAnimated = true

        // Apply Heuristic Styling based on Node Types
        if (sourceNode?.type === 'gateway') {
          strokeColor = '#10B981' // Green (Success/Flow)
        } else if (targetNode?.type === 'data-store') {
          strokeColor = '#EF4444' // Red (Database ops)
        } else if (targetNode?.type === 'external-service') {
          strokeColor = '#F59E0B' // Amber (External/Async)
          isDashed = true
          isAnimated = false
        } else if (sourceNode?.type === 'external-entity') {
          strokeColor = '#3B82F6' // Blue (Client traffic)
        }

        return {
          id: `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label || 'Connects',
          type: 'smoothstep',
          animated: isAnimated,
          style: {
            stroke: strokeColor,
            strokeWidth: 2,
            strokeDasharray: isDashed ? '5,5' : undefined
          },
          markerEnd: {
            type: 'arrowclosed',
            color: strokeColor
          },
          data: {
            isEncrypted: e.label === 'HTTPS',
            dataType: 'JSON'
          }
        } as DataFlowEdge
      })
    }

    // Process Insights
    if (aiData.insights) {
      insights = { ...insights, ...aiData.insights }
    }

  } catch (error) {
    console.warn('⚠️ AI Edge Generation failed, falling back to heuristic engine.', error)

    // Fallback: Use the deterministic edge generator
    edges = createFallbackEdges(nodes)

    // Add a specific insight noting that AI failed
    insights.bottlenecks.push('Diagram generated using fallback heuristics due to AI timeout/error.')
  }

  // 3. Construct Final Diagram
  return {
    id: `dfd-${Date.now()}`,
    name: `${projectName} Data Flow`,
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalFlows: edges.length,
      encryptedFlows: edges.filter(e => e.label === 'HTTPS' || e.data?.isEncrypted).length,
      createdAt: new Date().toISOString()
    },
    aiInsights: insights
  }
}