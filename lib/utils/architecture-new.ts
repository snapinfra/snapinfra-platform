import { ArchitectureNode, ArchitectureEdge, SystemArchitecture, DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

// Layout configuration for clean hierarchical spacing
const LAYOUT = {
  horizontalSpacing: 400,
  verticalSpacing: 200,
  startX: 100,
  startY: 100,
}

// Helper to calculate positions in layers - with better vertical centering
function calculatePosition(layer: number, indexInLayer: number, totalInLayer: number) {
  const x = LAYOUT.startX + (layer * LAYOUT.horizontalSpacing)
  const centerY = LAYOUT.startY + (totalInLayer - 1) * LAYOUT.verticalSpacing / 2
  const y = centerY + (indexInLayer * LAYOUT.verticalSpacing) - (totalInLayer - 1) * LAYOUT.verticalSpacing / 2
  return { x, y: Math.max(y, LAYOUT.startY) }
}

interface GroqArchitectureResponse {
  layers: {
    name: string
    color: string
    components: {
      id: string
      type: string
      name: string
      description: string
      technology: string
    }[]
  }[]
  connections: {
    source: string
    target: string
    label: string
    protocol: string
  }[]
  metadata: {
    complexity: string
    scalingStrategy: string
    securityLevel: string
  }
}

// Create Groq provider instance with API key
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

async function generateArchitectureWithGroq(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): Promise<GroqArchitectureResponse> {
  const systemPrompt = 'You are an expert system architect. Generate comprehensive production-ready architectures with 18-25 components across 6 layers using ACTUAL project data. Component names and descriptions MUST reference actual database tables and API endpoint groups. Return ONLY valid JSON with no markdown or explanations.'
  
  // Extract key information
  const tableNames = schemaData.schemas?.slice(0, 10).map(s => s.name).join(', ') || ''
  const tableCount = schemaData.schemas?.length || 0
  const endpointGroups = apiData.endpoints?.map(e => ({
    name: e.group,
    count: e.endpoints?.length || 0,
    methods: [...new Set(e.endpoints?.map((ep: any) => ep.method))].join('/')
  })) || []
  
  const userPrompt = `You are an expert system architect. Analyze the following project data and generate a COMPREHENSIVE, production-ready system architecture with 15-25 components.

PROJECT: ${projectName}

DATABASE SCHEMA (${tableCount} tables):
Tables: ${tableNames}${tableCount > 10 ? ' and more...' : ''}

Detailed Schema:
${JSON.stringify(schemaData.schemas?.slice(0, 10).map(s => ({
  name: s.name,
  comment: s.comment,
  fields: s.fields?.slice(0, 5).map(f => ({ 
    name: f.name, 
    type: f.type
  }))
})) || [], null, 2)}

API ENDPOINTS (${apiData.endpoints?.length || 0} groups, ${apiData.endpoints?.reduce((sum: number, g: any) => sum + (g.endpoints?.length || 0), 0) || 0} total endpoints):
${JSON.stringify(endpointGroups, null, 2)}

CRITICAL REQUIREMENTS:
1. Component names MUST use actual endpoint group names (e.g., "${endpointGroups[0]?.name || 'User'} Service" not "API Service 1")
2. Component descriptions MUST reference actual tables and endpoint counts (e.g., "Manages ${tableNames.split(',')[0]} table via ${endpointGroups[0]?.count || 0} ${endpointGroups[0]?.methods || 'CRUD'} endpoints")
3. Connection labels MUST be specific (e.g., "POST/GET ${endpointGroups[0]?.name || 'User'} Operations" not "Query")
4. Database description MUST list actual tables: "${tableNames}"

Generate architecture with 6 layers. Each layer must have:
- Layer 0 (Client): 2-3 components (CDN, ${projectName} Frontend, Mobile)
- Layer 1 (Gateway): 2-3 components (Load Balancer routing to ${endpointGroups.length} services, API Gateway, Auth if needed)
- Layer 2 (Application): 5-7 components (${endpointGroups.map(g => g.name).slice(0, 3).join(', ')} Services, Cache, Queue, WebSocket)
- Layer 3 (Data): 2-4 components (${schemaData.analysis?.databaseRecommendations?.[0]?.name || 'PostgreSQL'} with ${tableCount} tables, Search, Storage, Replica)
- Layer 4 (Infrastructure): 3-4 components (Monitoring, Logging, Notifications, Analytics)
- Layer 5 (DevOps): 3-4 components (CI/CD, Secrets, Backup, Registry)

COMPONENT NAMING EXAMPLES:
✅ GOOD: "${endpointGroups[0]?.name || 'User'} Service" with description "Handles ${endpointGroups[0]?.count || 5} ${endpointGroups[0]?.methods || 'CRUD'} endpoints for ${endpointGroups[0]?.name?.toLowerCase() || 'user'} management"
❌ BAD: "API Service 1" with description "Handles API operations"

CONNECTION LABELING EXAMPLES:
✅ GOOD: "source": "${(endpointGroups[0]?.name || 'user').toLowerCase()}-service-1", "label": "${endpointGroups[0]?.methods || 'CRUD'} ${endpointGroups[0]?.name || 'User'} Data"
❌ BAD: "source": "api-service-1", "label": "Query"

IMPORTANT: 
- Component IDs must be kebab-case based on actual names (e.g., "${(endpointGroups[0]?.name || 'user').toLowerCase().replace(/\s+/g, '-')}-service-1")
- Component types must be one of: cdn, frontend, mobile, api-gateway, load-balancer, authentication, api-service, cache, queue, database, search-engine, backup-storage, monitoring, logging, notification-service, analytics, ci-cd, secrets-manager, container-registry
- Connections MUST use exact component IDs

RETURN ONLY VALID JSON:
{
  "layers": [...],
  "connections": [...],
  "metadata": {
    "complexity": "Moderate",
    "scalingStrategy": "Horizontal",
    "securityLevel": "Standard"
  }
}`

  try {
    console.log('📡 Calling Groq API with enhanced prompts...')
    
    const response = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 6000
    })

    console.log('✅ Groq API responded')
    
    // Clean markdown
    let cleanedText = response.text.trim()
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    // Parse
    const architectureData: GroqArchitectureResponse = JSON.parse(cleanedText)
    
    // Validate
    if (!architectureData.layers || !Array.isArray(architectureData.layers) || architectureData.layers.length === 0) {
      throw new Error('Invalid layers')
    }

    const totalComponents = architectureData.layers.reduce((sum, l) => sum + (l.components?.length || 0), 0)
    console.log(`📊 Generated ${totalComponents} components with context-aware labels`)
    
    if (totalComponents < 10) {
      throw new Error('Too few components')
    }

    return architectureData
    
  } catch (error) {
    console.error('❌ Groq API error:', error)
    throw error
  }
}

function generateEnhancedFallback(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): GroqArchitectureResponse {
  console.log('🔄 Generating enhanced fallback architecture with context-aware labels...')
  
  const hasAuth = apiData.endpoints?.some((group: any) => 
    group.endpoints?.some((ep: any) => ep.auth === true)
  ) || false
  
  const dbName = schemaData.analysis?.databaseRecommendations?.[0]?.name || 'PostgreSQL'
  
  // Get actual table names for database description
  const tableNames = schemaData.schemas?.slice(0, 5).map(s => s.name).join(', ') || 'tables'
  const tableCount = schemaData.schemas?.length || 0
  
  // Generate API services based on actual endpoint groups
  const apiServices = (apiData.endpoints || []).slice(0, 5).map((group: any, idx: number) => {
    const groupName = group.group || 'API'
    const endpointCount = group.endpoints?.length || 0
    const hasPostEndpoints = group.endpoints?.some((ep: any) => ep.method === 'POST')
    const hasGetEndpoints = group.endpoints?.some((ep: any) => ep.method === 'GET')
    
    // Create meaningful description based on endpoints
    let description = `Manages ${groupName.toLowerCase()} operations`
    if (endpointCount > 0) {
      description = `${endpointCount} endpoint${endpointCount > 1 ? 's' : ''} for ${groupName.toLowerCase()}`
      if (hasPostEndpoints && hasGetEndpoints) {
        description += ' (CRUD operations)'
      } else if (hasPostEndpoints) {
        description += ' (Create/Update)'
      } else if (hasGetEndpoints) {
        description += ' (Read operations)'
      }
    }
    
    return {
      id: `${groupName.toLowerCase().replace(/\s+/g, '-')}-service-${idx + 1}`,
      type: 'api-service',
      name: `${groupName} Service`,
      description,
      technology: 'Node.js + Express'
    }
  })

  // Ensure at least 3 API services with meaningful defaults
  const defaultServices = ['Core', 'Utility', 'Integration']
  while (apiServices.length < 3) {
    const serviceName = defaultServices[apiServices.length] || 'Business'
    apiServices.push({
      id: `${serviceName.toLowerCase()}-service-${apiServices.length + 1}`,
      type: 'api-service',
      name: `${serviceName} Service`,
      description: `${serviceName} logic operations`,
      technology: 'Node.js + Express'
    })
  }

  return {
    layers: [
      {
        name: 'Client Layer',
        color: '#F0F9FF',
        components: [
          {
            id: 'cdn-1',
            type: 'cdn',
            name: 'CDN',
            description: `Static assets for ${projectName}`,
            technology: 'CloudFlare'
          },
          {
            id: 'frontend-1',
            type: 'frontend',
            name: `${projectName} Web App`,
            description: `Main web application (${apiData.endpoints?.length || 0} API integrations)`,
            technology: 'React + TypeScript'
          },
          {
            id: 'mobile-1',
            type: 'mobile',
            name: `${projectName} Mobile`,
            description: 'iOS & Android client',
            technology: 'React Native'
          }
        ]
      },
      {
        name: 'Gateway Layer',
        color: '#F0FDF4',
        components: [
          {
            id: 'load-balancer-1',
            type: 'load-balancer',
            name: 'Application Load Balancer',
            description: `Traffic distribution across ${apiServices.length} services`,
            technology: 'AWS ALB'
          },
          {
            id: 'api-gateway-1',
            type: 'api-gateway',
            name: 'API Gateway',
            description: `Routes ${apiData.endpoints?.reduce((sum: number, g: any) => sum + (g.endpoints?.length || 0), 0) || 0} endpoints`,
            technology: 'Kong Gateway'
          },
          ...(hasAuth ? [{
            id: 'auth-1',
            type: 'authentication' as const,
            name: 'Auth Service',
            description: 'JWT + OAuth2 authentication',
            technology: 'Auth0 / JWT'
          }] : [])
        ]
      },
      {
        name: 'Application Layer',
        color: '#FAF5FF',
        components: [
          ...apiServices,
          {
            id: 'cache-1',
            type: 'cache',
            name: 'Redis Cache',
            description: `Caching for ${apiServices.length} services`,
            technology: 'Redis 7.x'
          },
          {
            id: 'queue-1',
            type: 'queue',
            name: 'Message Queue',
            description: 'Async job processing & events',
            technology: 'RabbitMQ'
          },
          {
            id: 'websocket-1',
            type: 'api-service',
            name: 'WebSocket Service',
            description: 'Real-time notifications & updates',
            technology: 'Socket.io'
          }
        ]
      },
      {
        name: 'Data Layer',
        color: '#FEF2F2',
        components: [
          {
            id: 'database-1',
            type: 'database',
            name: `${dbName} Primary`,
            description: `${tableCount} tables: ${tableNames}${tableCount > 5 ? ', ...' : ''}`,
            technology: `${dbName} 15`
          },
          {
            id: 'search-1',
            type: 'search-engine',
            name: 'Search Engine',
            description: `Full-text search across ${tableCount} tables`,
            technology: 'Elasticsearch 8.x'
          },
          {
            id: 'storage-1',
            type: 'backup-storage',
            name: 'Object Storage',
            description: 'Document & media storage',
            technology: 'AWS S3'
          },
          {
            id: 'replica-1',
            type: 'database',
            name: `${dbName} Replica`,
            description: 'Read-only replica for scaling',
            technology: `${dbName} Streaming`
          }
        ]
      },
      {
        name: 'Infrastructure',
        color: '#FFF7ED',
        components: [
          {
            id: 'monitoring-1',
            type: 'monitoring',
            name: 'Monitoring',
            description: `System monitoring for ${apiServices.length} services`,
            technology: 'Datadog'
          },
          {
            id: 'logging-1',
            type: 'logging',
            name: 'Logging',
            description: 'Centralized log aggregation',
            technology: 'ELK Stack'
          },
          {
            id: 'notification-1',
            type: 'notification-service',
            name: 'Notifications',
            description: 'Email, SMS & Push alerts',
            technology: 'AWS SNS'
          },
          {
            id: 'analytics-1',
            type: 'analytics',
            name: 'Analytics',
            description: 'User behavior tracking',
            technology: 'Google Analytics'
          }
        ]
      },
      {
        name: 'DevOps & Security',
        color: '#F9FAFB',
        components: [
          {
            id: 'cicd-1',
            type: 'ci-cd',
            name: 'CI/CD Pipeline',
            description: `Automated deployment for ${apiServices.length} services`,
            technology: 'GitHub Actions'
          },
          {
            id: 'secrets-1',
            type: 'secrets-manager',
            name: 'Secrets Manager',
            description: 'API keys & credential management',
            technology: 'HashiCorp Vault'
          },
          {
            id: 'backup-1',
            type: 'backup-storage',
            name: 'Backup Storage',
            description: `Automated backups for ${tableCount} tables`,
            technology: 'S3 Glacier'
          },
          {
            id: 'registry-1',
            type: 'container-registry',
            name: 'Container Registry',
            description: 'Docker image repository',
            technology: 'Docker Hub'
          }
        ]
      }
    ],
    connections: [
      // Client -> Gateway
      { source: 'cdn-1', target: 'frontend-1', label: 'Static Assets (JS/CSS/Images)', protocol: 'HTTPS' },
      { source: 'frontend-1', target: 'load-balancer-1', label: 'API Requests', protocol: 'HTTPS' },
      { source: 'mobile-1', target: 'load-balancer-1', label: 'Mobile API Calls', protocol: 'HTTPS' },
      { source: 'load-balancer-1', target: 'api-gateway-1', label: 'Route & Balance', protocol: 'HTTP/2' },
      
      // Gateway -> Application (with specific service routing)
      ...(hasAuth ? [
        { source: 'api-gateway-1', target: 'auth-1', label: 'Authentication Check', protocol: 'HTTP' },
        { source: 'auth-1', target: apiServices[0].id, label: 'Auth Token', protocol: 'JWT' }
      ] : []),
      ...apiServices.map((s, idx) => {
        const group = apiData.endpoints?.[idx]
        const endpointInfo = group ? `${group.endpoints?.length || 0} endpoints` : 'API routes'
        return {
          source: 'api-gateway-1',
          target: s.id,
          label: endpointInfo,
          protocol: 'REST/HTTP'
        }
      }),
      
      // Application -> Cache (with specific cache usage)
      ...apiServices.map((s, idx) => ({
        source: s.id,
        target: 'cache-1',
        label: `${apiData.endpoints?.[idx]?.group || 'Data'} Cache`,
        protocol: 'Redis Protocol'
      })),
      { source: apiServices[0].id, target: 'queue-1', label: 'Async Jobs & Events', protocol: 'AMQP' },
      { source: 'websocket-1', target: 'queue-1', label: 'Real-time Events', protocol: 'AMQP' },
      
      // Application -> Data (with table-specific queries)
      ...apiServices.map((s, idx) => {
        const group = apiData.endpoints?.[idx]
        const methods = group?.endpoints?.map((ep: any) => ep.method).filter((m: any, i: number, a: any[]) => a.indexOf(m) === i).join('/') || 'CRUD'
        return {
          source: s.id,
          target: 'database-1',
          label: `${methods} Operations`,
          protocol: 'SQL'
        }
      }),
      { source: 'database-1', target: 'search-1', label: `Sync ${tableCount} Tables`, protocol: 'Logstash' },
      { source: 'database-1', target: 'replica-1', label: 'WAL Replication', protocol: 'Streaming' },
      { source: apiServices[0].id, target: 'storage-1', label: 'File Upload/Download', protocol: 'S3 API' },
      
      // Infrastructure
      ...apiServices.map(s => ({
        source: s.id,
        target: 'monitoring-1',
        label: 'Performance Metrics',
        protocol: 'StatsD'
      })),
      ...apiServices.map(s => ({
        source: s.id,
        target: 'logging-1',
        label: 'Application Logs',
        protocol: 'Syslog'
      })),
      { source: 'api-gateway-1', target: 'notification-1', label: 'Alerts & Notifications', protocol: 'SNS' },
      { source: 'frontend-1', target: 'analytics-1', label: 'User Analytics', protocol: 'HTTPS' },
      
      // DevOps
      { source: 'database-1', target: 'backup-1', label: 'Automated Backups', protocol: 'S3 API' },
      { source: apiServices[0].id, target: 'secrets-1', label: 'Config & Secrets', protocol: 'Vault API' },
      { source: 'cicd-1', target: apiServices[0].id, label: 'Deploy Services', protocol: 'SSH/Docker' },
      { source: 'cicd-1', target: 'registry-1', label: 'Push Images', protocol: 'Docker Registry' }
    ],
    metadata: {
      complexity: apiServices.length >= 4 ? 'Complex' : 'Moderate',
      scalingStrategy: 'Horizontal with Auto-scaling',
      securityLevel: hasAuth ? 'Enterprise (OAuth2 + JWT)' : 'Standard (HTTPS only)'
    }
  }
}

function convertGroqResponseToArchitecture(
  groqArch: GroqArchitectureResponse,
  projectName: string
): SystemArchitecture {
  const nodes: ArchitectureNode[] = []
  const edges: ArchitectureEdge[] = []

  console.log('🔄 Converting to architecture format...')
  console.log(`Input: ${groqArch.layers?.length || 0} layers`)

  if (!groqArch.layers || groqArch.layers.length === 0) {
    console.error('❌ No layers to process!')
    throw new Error('No layers in architecture data')
  }

  // Valid node types for React Flow
  const validNodeTypes = [
    'cdn', 'frontend', 'mobile', 'api-gateway', 'load-balancer', 'authentication',
    'api-service', 'cache', 'queue', 'database', 'search-engine', 'backup-storage',
    'monitoring', 'logging', 'notification-service', 'analytics', 'ci-cd',
    'secrets-manager', 'container-registry', 'external-service', 'data-warehouse',
    'ml-service', 'scheduler', 'streaming', 'service-mesh', 'workflow-engine'
  ]

  // Normalize component type
  const normalizeType = (type: string): string => {
    const normalized = type.toLowerCase().replace(/\s+/g, '-')
    if (validNodeTypes.includes(normalized)) {
      return normalized
    }
    
    // Try to map common variations
    if (normalized.includes('repository') || normalized.includes('repo')) return 'container-registry'
    if (normalized.includes('auth')) return 'authentication'
    if (normalized.includes('gateway')) return 'api-gateway'
    if (normalized.includes('balancer')) return 'load-balancer'
    if (normalized.includes('service')) return 'api-service'
    if (normalized.includes('web') || normalized.includes('app')) return 'frontend'
    
    console.warn(`⚠️ Unknown type "${type}", defaulting to api-service`)
    return 'api-service'
  }

  // Create individual component nodes (NO BACKGROUND LAYERS)
  groqArch.layers.forEach((layer, layerIndex) => {
    if (!layer.components || layer.components.length === 0) {
      console.warn(`⚠️ Layer ${layerIndex} has no components`)
      return
    }

    console.log(`📦 Layer ${layerIndex}: ${layer.name} (${layer.components.length} components)`)

    // Create each component as a standalone node with proper positioning
    layer.components.forEach((component, idx) => {
      const position = calculatePosition(layerIndex, idx, layer.components.length)
      const normalizedType = normalizeType(component.type)
      
      nodes.push({
        id: component.id,
        type: normalizedType as any,
        position,
        data: {
          name: component.name,
          description: component.description,
          color: getNodeTypeColor(normalizedType as any),
          metadata: { 
            technology: component.technology,
            layer: layer.name,
            layerIndex
          }
        }
      })
    })
  })

  // Create connections with validation
  if (groqArch.connections && Array.isArray(groqArch.connections)) {
    groqArch.connections.forEach((conn, index) => {
      const sourceExists = nodes.some(n => n.id === conn.source)
      const targetExists = nodes.some(n => n.id === conn.target)
      
      if (sourceExists && targetExists) {
        edges.push({
          id: `edge-${conn.source}-${conn.target}-${index}`,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          label: conn.label,
          data: { protocol: conn.protocol }
        })
      } else {
        console.warn(`⚠️ Skipping edge ${conn.source} -> ${conn.target} (source exists: ${sourceExists}, target exists: ${targetExists})`)
      }
    })
  }

  // If no edges were created, generate basic connections between layers
  if (edges.length === 0) {
    console.warn('⚠️ No valid edges, generating fallback connections')
    
    // Group nodes by layer
    const nodesByLayer: { [key: number]: ArchitectureNode[] } = {}
    nodes.forEach(node => {
      const layerIndex = node.data.metadata?.layerIndex ?? 0
      if (!nodesByLayer[layerIndex]) nodesByLayer[layerIndex] = []
      nodesByLayer[layerIndex].push(node)
    })

    // Connect sequential layers
    const layerIndices = Object.keys(nodesByLayer).map(Number).sort((a, b) => a - b)
    for (let i = 0; i < layerIndices.length - 1; i++) {
      const currentLayerNodes = nodesByLayer[layerIndices[i]]
      const nextLayerNodes = nodesByLayer[layerIndices[i + 1]]
      
      // Connect first node of current layer to first node of next layer
      if (currentLayerNodes.length > 0 && nextLayerNodes.length > 0) {
        edges.push({
          id: `edge-layer-${i}-to-${i + 1}`,
          source: currentLayerNodes[0].id,
          target: nextLayerNodes[0].id,
          type: 'smoothstep',
          label: 'Data Flow',
          data: { protocol: 'HTTP' }
        })
      }
    }
  }

  console.log(`✅ Created ${nodes.length} nodes, ${edges.length} edges`)

  return {
    id: `arch-${Date.now()}`,
    name: `${projectName} System Architecture`,
    description: `${groqArch.metadata?.complexity || 'Moderate'} architecture with ${nodes.length} components`,
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0.0',
      aiGenerated: true,
      complexity: groqArch.metadata?.complexity || 'Moderate',
      scalingStrategy: groqArch.metadata?.scalingStrategy || 'Hybrid',
      securityLevel: groqArch.metadata?.securityLevel || 'Standard'
    }
  }
}

export async function generateArchitectureFromData(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): Promise<SystemArchitecture> {
  console.log('🚀 Architecture generation started with context-aware labeling')
  console.log(`  Tables: ${schemaData.schemas?.length || 0}`)
  console.log(`  API Groups: ${apiData.endpoints?.length || 0}`)
  console.log(`  Total Endpoints: ${apiData.endpoints?.reduce((sum: number, g: any) => sum + (g.endpoints?.length || 0), 0) || 0}`)
  
  try {
    const groqArchitecture = await generateArchitectureWithGroq(schemaData, apiData, projectName)
    return convertGroqResponseToArchitecture(groqArchitecture, projectName)
  } catch (error) {
    console.error('❌ Groq failed, using context-aware fallback')
    const fallbackArch = generateEnhancedFallback(schemaData, apiData, projectName)
    return convertGroqResponseToArchitecture(fallbackArch, projectName)
  }
}

export function getNodeTypeColor(type: ArchitectureNode['type']): string {
  const colors = {
    'database': '#EF4444',
    'api-service': '#8B5CF6',
    'authentication': '#F59E0B',
    'frontend': '#3B82F6',
    'mobile': '#06B6D4',
    'external-service': '#6B7280',
    'load-balancer': '#10B981',
    'cache': '#DC2626',
    'queue': '#F97316',
    'api-gateway': '#059669',
    'cdn': '#0891B2',
    'monitoring': '#EA580C',
    'logging': '#CA8A04',
    'search-engine': '#B45309',
    'notification-service': '#8B5CF6',
    'secrets-manager': '#374151',
    'backup-storage': '#4B5563',
    'analytics': '#7C3AED',
    'ci-cd': '#059669',
    'container-registry': '#6B7280',
    'data-warehouse': '#7C2D12',
    'ml-service': '#EC4899',
    'scheduler': '#0D9488',
    'streaming': '#BE185D',
    'service-mesh': '#7C3AED',
    'workflow-engine': '#0F766E',
    'identity-provider': '#B91C1C',
    'vpn': '#9A3412',
    'firewall': '#DC2626',
    'dns': '#2563EB',
    'certificate-manager': '#16A34A',
    'artifact-repository': '#6B7280',
    'testing-service': '#7C2D12'
  }
  return colors[type] || '#6B7280'
}

export const architectureTemplates = []