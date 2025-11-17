// lib/utils/lld-generator.ts
import { ArchitectureNode, ArchitectureEdge, SystemArchitecture, DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

// Layout configuration for detailed LLD spacing
const LLD_LAYOUT = {
  horizontalSpacing: 350,
  verticalSpacing: 180,
  startX: 100,
  startY: 100,
}

// Helper to calculate positions with better organization
function calculateLLDPosition(layer: number, indexInLayer: number, totalInLayer: number) {
  const x = LLD_LAYOUT.startX + (layer * LLD_LAYOUT.horizontalSpacing)
  const centerY = LLD_LAYOUT.startY + (totalInLayer - 1) * LLD_LAYOUT.verticalSpacing / 2
  const y = centerY + (indexInLayer * LLD_LAYOUT.verticalSpacing) - (totalInLayer - 1) * LLD_LAYOUT.verticalSpacing / 2
  return { x, y: Math.max(y, LLD_LAYOUT.startY) }
}

interface GroqLLDResponse {
  layers: {
    name: string
    color: string
    components: {
      id: string
      type: string
      name: string
      description: string
      technology: string
      methods?: string[]
      dependencies?: string[]
    }[]
  }[]
  connections: {
    source: string
    target: string
    label: string
    protocol: string
    dataFlow?: string
  }[]
  metadata: {
    complexity: string
    designPattern: string
    testCoverage: string
  }
}

// Create Groq provider instance
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

async function generateLLDWithGroq(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): Promise<GroqLLDResponse> {
  const systemPrompt = 'You are an expert software architect specializing in low-level design. Generate detailed component-level architectures with classes, modules, services, and their interactions. Focus on implementation details, design patterns, and code structure. Return ONLY valid JSON with no markdown or explanations.'
  
  // Extract detailed information
  const tables = schemaData.schemas?.map(s => ({
    name: s.name,
    fields: s.fields?.map(f => ({ name: f.name, type: f.type })) || []
  })) || []
  
  const endpointDetails = apiData.endpoints?.map(group => ({
    group: group.group,
    endpoints: group.endpoints?.map((ep: any) => ({
      method: ep.method,
      path: ep.path,
      description: ep.description
    })) || []
  })) || []
  
  const userPrompt = `Generate a detailed LOW-LEVEL DESIGN (LLD) for ${projectName}.

DATABASE TABLES (${tables.length} total):
${JSON.stringify(tables.slice(0, 8), null, 2)}

API ENDPOINTS (${endpointDetails.length} groups):
${JSON.stringify(endpointDetails.slice(0, 5), null, 2)}

CRITICAL LLD REQUIREMENTS:
1. Focus on IMPLEMENTATION DETAILS - classes, modules, services, repositories
2. Component names must reflect actual code structure (e.g., "UserRepository", "AuthenticationService", "OrderController")
3. Include specific methods for each component (e.g., ["createUser()", "validateEmail()", "hashPassword()"])
4. Show design patterns used (Repository, Factory, Strategy, Observer, etc.)
5. Include detailed data flow between components
6. Specify actual technologies and frameworks

Generate LLD with 7 layers (20-30 components total):

Layer 0 - CONTROLLERS (3-4 components):
- Controllers for each major API group
- Example: "UserController" with methods ["POST /users", "GET /users/:id", "PUT /users/:id"]
- Technology: Express.js / NestJS Controllers

Layer 1 - SERVICES/BUSINESS LOGIC (4-6 components):
- Service classes for business logic
- Example: "UserService" with methods ["createUser()", "validateUser()", "updateProfile()"]
- Include validation, transformation, orchestration services
- Technology: TypeScript Classes

Layer 2 - REPOSITORIES/DATA ACCESS (3-5 components):
- Repository pattern for each entity
- Example: "UserRepository" with methods ["findById()", "save()", "update()", "delete()"]
- Technology: TypeORM / Prisma Repositories

Layer 3 - MODELS/ENTITIES (3-5 components):
- Data models and DTOs
- Example: "User" entity with fields from database
- Include validation decorators and relationships
- Technology: TypeScript Interfaces / Classes

Layer 4 - MIDDLEWARE & UTILITIES (4-6 components):
- Authentication middleware
- Validation middleware
- Error handlers
- Logger utilities
- Cache helpers
- Technology: Express Middleware / Utility Classes

Layer 5 - EXTERNAL INTEGRATIONS (2-4 components):
- Third-party API clients
- Email service adapters
- Payment gateway integrations
- Technology: Axios / SDK Clients

Layer 6 - INFRASTRUCTURE (3-5 components):
- Database connections
- Cache clients
- Queue clients
- Configuration managers
- Technology: Connection Pools / Clients

NAMING EXAMPLES:
✅ GOOD LLD Names:
- "UserController" with methods ["POST /api/users", "GET /api/users/:id"]
- "AuthenticationService" with methods ["login()", "validateToken()", "refreshToken()"]
- "UserRepository" with methods ["findByEmail()", "save()", "updatePassword()"]
- "EmailNotificationAdapter" with methods ["sendWelcomeEmail()", "sendResetPassword()"]

❌ BAD LLD Names:
- "API Handler 1"
- "Service Component"
- "Data Layer"

CONNECTION DETAILS:
- Show METHOD CALLS between components
- Example: "UserController.createUser() → UserService.createUser() → UserRepository.save()"
- Include data transformations and validations

DESIGN PATTERNS TO SHOW:
- Repository Pattern for data access
- Service Layer for business logic
- Factory Pattern for object creation
- Strategy Pattern for algorithms
- Observer Pattern for events
- Dependency Injection throughout

RETURN ONLY VALID JSON:
{
  "layers": [
    {
      "name": "Controllers Layer",
      "color": "#E3F2FD",
      "components": [
        {
          "id": "user-controller-1",
          "type": "api-service",
          "name": "UserController",
          "description": "Handles user-related HTTP requests",
          "technology": "Express.js Controller",
          "methods": ["POST /users", "GET /users/:id", "PUT /users/:id", "DELETE /users/:id"],
          "dependencies": ["user-service-1", "auth-middleware-1"]
        }
      ]
    }
  ],
  "connections": [
    {
      "source": "user-controller-1",
      "target": "user-service-1",
      "label": "createUser(dto) → Promise<User>",
      "protocol": "Method Call",
      "dataFlow": "UserCreateDTO"
    }
  ],
  "metadata": {
    "complexity": "Detailed",
    "designPattern": "Layered Architecture + Repository Pattern",
    "testCoverage": "Unit + Integration Tests Required"
  }
}`

  try {
    console.log('📡 Calling Groq API for LLD generation...')
    
    const response = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 8000
    })

    console.log('✅ Groq API responded for LLD')
    
    // Clean markdown
    let cleanedText = response.text.trim()
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    // Parse
    const lldData: GroqLLDResponse = JSON.parse(cleanedText)
    
    // Validate
    if (!lldData.layers || !Array.isArray(lldData.layers) || lldData.layers.length === 0) {
      throw new Error('Invalid LLD layers')
    }

    const totalComponents = lldData.layers.reduce((sum, l) => sum + (l.components?.length || 0), 0)
    console.log(`📊 Generated ${totalComponents} LLD components`)
    
    if (totalComponents < 10) {
      throw new Error('Too few LLD components')
    }

    return lldData
    
  } catch (error) {
    console.error('❌ Groq LLD API error:', error)
    throw error
  }
}

function generateEnhancedLLDFallback(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): GroqLLDResponse {
  console.log('🔄 Generating enhanced LLD fallback...')
  
  const tables = schemaData.schemas || []
  const apiGroups = apiData.endpoints || []
  
  // Generate controllers for each API group
  const controllers = apiGroups.slice(0, 4).map((group: any, idx: number) => ({
    id: `${group.group.toLowerCase().replace(/\s+/g, '-')}-controller-${idx + 1}`,
    type: 'api-service',
    name: `${group.group}Controller`,
    description: `Handles ${group.group.toLowerCase()} HTTP requests`,
    technology: 'Express.js Controller',
    methods: (group.endpoints || []).slice(0, 5).map((ep: any) => `${ep.method} ${ep.path}`),
    dependencies: [`${group.group.toLowerCase().replace(/\s+/g, '-')}-service-${idx + 1}`]
  }))

  // Generate services for business logic
  const services = apiGroups.slice(0, 5).map((group: any, idx: number) => ({
    id: `${group.group.toLowerCase().replace(/\s+/g, '-')}-service-${idx + 1}`,
    type: 'api-service',
    name: `${group.group}Service`,
    description: `Business logic for ${group.group.toLowerCase()} operations`,
    technology: 'TypeScript Service Class',
    methods: [
      `create${group.group}()`,
      `get${group.group}ById()`,
      `update${group.group}()`,
      `delete${group.group}()`,
      `validate${group.group}Data()`
    ],
    dependencies: [`${group.group.toLowerCase().replace(/\s+/g, '-')}-repository-${idx + 1}`]
  }))

  // Generate repositories for data access
  const repositories = tables.slice(0, 4).map((table: any, idx: number) => ({
    id: `${table.name.toLowerCase().replace(/\s+/g, '-')}-repository-${idx + 1}`,
    type: 'database',
    name: `${table.name}Repository`,
    description: `Data access layer for ${table.name} table`,
    technology: 'TypeORM Repository',
    methods: [
      'findById(id)',
      'findAll(filters)',
      'save(entity)',
      'update(id, data)',
      'delete(id)',
      'findByCustomQuery()'
    ],
    dependencies: [`${table.name.toLowerCase().replace(/\s+/g, '-')}-entity-${idx + 1}`]
  }))

  // Generate entities/models
  const entities = tables.slice(0, 4).map((table: any, idx: number) => ({
    id: `${table.name.toLowerCase().replace(/\s+/g, '-')}-entity-${idx + 1}`,
    type: 'database',
    name: `${table.name}`,
    description: `Entity model with ${(table.fields || []).length} fields`,
    technology: 'TypeScript Class / Interface',
    methods: (table.fields || []).slice(0, 6).map((f: any) => f.name),
    dependencies: []
  }))

  return {
    layers: [
      {
        name: 'Controllers Layer',
        color: '#E3F2FD',
        components: controllers
      },
      {
        name: 'Services Layer',
        color: '#F3E5F5',
        components: services
      },
      {
        name: 'Repositories Layer',
        color: '#FFF3E0',
        components: repositories
      },
      {
        name: 'Models/Entities Layer',
        color: '#E8F5E9',
        components: entities
      },
      {
        name: 'Middleware Layer',
        color: '#FFF9C4',
        components: [
          {
            id: 'auth-middleware-1',
            type: 'authentication',
            name: 'AuthenticationMiddleware',
            description: 'JWT token validation',
            technology: 'Express Middleware',
            methods: ['validateToken()', 'extractUser()', 'checkPermissions()'],
            dependencies: []
          },
          {
            id: 'validation-middleware-1',
            type: 'api-service',
            name: 'ValidationMiddleware',
            description: 'Request validation using schemas',
            technology: 'Joi / Zod Validator',
            methods: ['validateBody()', 'validateParams()', 'validateQuery()'],
            dependencies: []
          },
          {
            id: 'error-handler-1',
            type: 'api-service',
            name: 'ErrorHandler',
            description: 'Centralized error handling',
            technology: 'Express Error Middleware',
            methods: ['handleError()', 'formatErrorResponse()', 'logError()'],
            dependencies: ['logger-util-1']
          },
          {
            id: 'logger-util-1',
            type: 'logging',
            name: 'LoggerUtility',
            description: 'Application logging',
            technology: 'Winston / Pino',
            methods: ['info()', 'error()', 'debug()', 'warn()'],
            dependencies: []
          }
        ]
      },
      {
        name: 'External Integrations',
        color: '#E0F2F1',
        components: [
          {
            id: 'email-adapter-1',
            type: 'notification-service',
            name: 'EmailServiceAdapter',
            description: 'Email sending integration',
            technology: 'SendGrid / AWS SES',
            methods: ['sendTransactional()', 'sendBulk()', 'sendTemplate()'],
            dependencies: []
          },
          {
            id: 'payment-client-1',
            type: 'external-service',
            name: 'PaymentGatewayClient',
            description: 'Payment processing',
            technology: 'Stripe SDK',
            methods: ['createCharge()', 'refund()', 'getBalance()'],
            dependencies: []
          },
          {
            id: 'storage-adapter-1',
            type: 'backup-storage',
            name: 'CloudStorageAdapter',
            description: 'File upload/download',
            technology: 'AWS S3 SDK',
            methods: ['uploadFile()', 'getFile()', 'deleteFile()'],
            dependencies: []
          }
        ]
      },
      {
        name: 'Infrastructure Layer',
        color: '#ECEFF1',
        components: [
          {
            id: 'db-connection-1',
            type: 'database',
            name: 'DatabaseConnection',
            description: 'PostgreSQL connection pool',
            technology: 'TypeORM / Prisma',
            methods: ['connect()', 'getConnection()', 'runMigrations()'],
            dependencies: []
          },
          {
            id: 'redis-client-1',
            type: 'cache',
            name: 'RedisCacheClient',
            description: 'Cache management',
            technology: 'ioredis',
            methods: ['get()', 'set()', 'del()', 'expire()'],
            dependencies: []
          },
          {
            id: 'queue-client-1',
            type: 'queue',
            name: 'MessageQueueClient',
            description: 'Async job processing',
            technology: 'Bull / RabbitMQ',
            methods: ['addJob()', 'processJobs()', 'retryFailed()'],
            dependencies: []
          },
          {
            id: 'config-manager-1',
            type: 'secrets-manager',
            name: 'ConfigurationManager',
            description: 'Environment configuration',
            technology: 'dotenv / Vault',
            methods: ['get()', 'set()', 'validate()'],
            dependencies: []
          }
        ]
      }
    ],
    connections: [
      // Controllers -> Services
      ...controllers.map((ctrl, idx) => ({
        source: ctrl.id,
        target: services[idx]?.id || services[0].id,
        label: `calls service methods`,
        protocol: 'Method Call',
        dataFlow: 'DTO objects'
      })),
      // Services -> Repositories
      ...services.map((svc, idx) => ({
        source: svc.id,
        target: repositories[idx]?.id || repositories[0].id,
        label: `data operations`,
        protocol: 'Method Call',
        dataFlow: 'Entity objects'
      })),
      // Repositories -> Entities
      ...repositories.map((repo, idx) => ({
        source: repo.id,
        target: entities[idx]?.id || entities[0].id,
        label: `maps to entity`,
        protocol: 'ORM Mapping',
        dataFlow: 'Database rows'
      })),
      // Middleware connections
      {
        source: controllers[0].id,
        target: 'auth-middleware-1',
        label: 'authenticate request',
        protocol: 'Middleware Chain',
        dataFlow: 'Request object'
      },
      {
        source: controllers[0].id,
        target: 'validation-middleware-1',
        label: 'validate input',
        protocol: 'Middleware Chain',
        dataFlow: 'Request body'
      },
      {
        source: 'error-handler-1',
        target: 'logger-util-1',
        label: 'log errors',
        protocol: 'Method Call',
        dataFlow: 'Error details'
      },
      // External integrations
      {
        source: services[0].id,
        target: 'email-adapter-1',
        label: 'send notifications',
        protocol: 'Method Call',
        dataFlow: 'Email data'
      },
      {
        source: services[0].id,
        target: 'storage-adapter-1',
        label: 'upload files',
        protocol: 'Method Call',
        dataFlow: 'File buffer'
      },
      // Infrastructure
      {
        source: repositories[0].id,
        target: 'db-connection-1',
        label: 'execute queries',
        protocol: 'SQL',
        dataFlow: 'Query objects'
      },
      {
        source: services[0].id,
        target: 'redis-client-1',
        label: 'cache operations',
        protocol: 'Redis Protocol',
        dataFlow: 'Serialized data'
      },
      {
        source: services[0].id,
        target: 'queue-client-1',
        label: 'enqueue jobs',
        protocol: 'AMQP',
        dataFlow: 'Job payload'
      }
    ],
    metadata: {
      complexity: 'Detailed',
      designPattern: 'Layered Architecture + Repository Pattern + Dependency Injection',
      testCoverage: 'Unit Tests Required for All Services'
    }
  }
}

function convertGroqLLDToArchitecture(
  groqLLD: GroqLLDResponse,
  projectName: string
): SystemArchitecture {
  const nodes: ArchitectureNode[] = []
  const edges: ArchitectureEdge[] = []

  console.log('🔄 Converting LLD to architecture format...')
  console.log(`Input: ${groqLLD.layers?.length || 0} layers`)

  if (!groqLLD.layers || groqLLD.layers.length === 0) {
    console.error('❌ No layers to process!')
    throw new Error('No layers in LLD data')
  }

  const validNodeTypes = [
    'cdn', 'frontend', 'mobile', 'api-gateway', 'load-balancer', 'authentication',
    'api-service', 'cache', 'queue', 'database', 'search-engine', 'backup-storage',
    'monitoring', 'logging', 'notification-service', 'analytics', 'ci-cd',
    'secrets-manager', 'container-registry', 'external-service'
  ]

  const normalizeType = (type: string): string => {
    const normalized = type.toLowerCase().replace(/\s+/g, '-')
    if (validNodeTypes.includes(normalized)) return normalized
    
    if (normalized.includes('controller')) return 'api-service'
    if (normalized.includes('service')) return 'api-service'
    if (normalized.includes('repository')) return 'database'
    if (normalized.includes('entity') || normalized.includes('model')) return 'database'
    if (normalized.includes('middleware')) return 'api-gateway'
    if (normalized.includes('util')) return 'api-service'
    if (normalized.includes('adapter') || normalized.includes('client')) return 'external-service'
    
    return 'api-service'
  }

  // Create nodes
  groqLLD.layers.forEach((layer, layerIndex) => {
    if (!layer.components || layer.components.length === 0) return

    console.log(`📦 LLD Layer ${layerIndex}: ${layer.name} (${layer.components.length} components)`)

    layer.components.forEach((component, idx) => {
      const position = calculateLLDPosition(layerIndex, idx, layer.components.length)
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
            layerIndex,
            methods: component.methods || [],
            dependencies: component.dependencies || []
          }
        }
      })
    })
  })

  // Create connections
  if (groqLLD.connections && Array.isArray(groqLLD.connections)) {
    groqLLD.connections.forEach((conn, index) => {
      const sourceExists = nodes.some(n => n.id === conn.source)
      const targetExists = nodes.some(n => n.id === conn.target)
      
      if (sourceExists && targetExists) {
        edges.push({
          id: `edge-${conn.source}-${conn.target}-${index}`,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          label: conn.label,
          data: { 
            protocol: conn.protocol,
            dataFlow: conn.dataFlow 
          }
        })
      }
    })
  }

  console.log(`✅ Created ${nodes.length} LLD nodes, ${edges.length} edges`)

  return {
    id: `lld-${Date.now()}`,
    name: `${projectName} - Low Level Design`,
    description: `Detailed component architecture with ${nodes.length} implementation components`,
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      aiGenerated: true,
      complexity: groqLLD.metadata?.complexity || 'Detailed',
      scalingStrategy: groqLLD.metadata?.designPattern || 'Layered Architecture',
      securityLevel: groqLLD.metadata?.testCoverage || 'Standard'
    }
  }
}

export async function generateLLDFromData(
  schemaData: DatabaseSchemaToArchitecture,
  apiData: ApiEndpointsToArchitecture,
  projectName: string
): Promise<SystemArchitecture> {
  console.log('🚀 LLD generation started')
  console.log(`  Tables: ${schemaData.schemas?.length || 0}`)
  console.log(`  API Groups: ${apiData.endpoints?.length || 0}`)
  
  try {
    const groqLLD = await generateLLDWithGroq(schemaData, apiData, projectName)
    return convertGroqLLDToArchitecture(groqLLD, projectName)
  } catch (error) {
    console.error('❌ Groq failed, using LLD fallback')
    const fallbackLLD = generateEnhancedLLDFallback(schemaData, apiData, projectName)
    return convertGroqLLDToArchitecture(fallbackLLD, projectName)
  }
}

function getNodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
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
    'container-registry': '#6B7280'
  }
  return colors[type] || '#6B7280'
}