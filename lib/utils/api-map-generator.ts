// lib/utils/api-map-generator.ts
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export interface APIEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  group: string
  requiresAuth: boolean
  requestBody?: Record<string, string>
  responseType?: string
  statusCodes: number[]
  position: { x: number; y: number }
}

export interface APIGroup {
  id: string
  name: string
  endpoints: APIEndpoint[]
  color: string
  position: { x: number; y: number }
  endpointPaths?: string[] // List of API paths for quick reference
  description?: string // Enhanced description with endpoint details
  formattedEndpoints?: string // Formatted string with line breaks for display
}

export interface APIFlow {
  id: string
  source: string
  target: string
  method: string
  label: string
}

export interface APIEndpointsMap {
  id: string
  name: string
  groups: APIGroup[]
  flows: APIFlow[]
  metadata: {
    totalEndpoints: number
    totalGroups: number
    authEndpoints: number
    publicEndpoints: number
    createdAt: string
  }
}

const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
})

const API_LAYOUT = {
  groupWidth: 320,
  endpointHeight: 80,
  horizontalSpacing: 450,
  verticalSpacing: 120,
  startX: 100,
  startY: 100,
}

function getMethodColor(method: string): string {
  const colors = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
    PATCH: '#8B5CF6',
  }
  return colors[method as keyof typeof colors] || '#6B7280'
}

function getGroupColor(groupName: string): string {
  const colors = {
    auth: '#F59E0B',
    user: '#3B82F6',
    task: '#8B5CF6',
    product: '#10B981',
    order: '#EF4444',
    category: '#06B6D4',
    admin: '#EC4899',
  }
  
  const key = Object.keys(colors).find(k => groupName.toLowerCase().includes(k))
  return key ? colors[key as keyof typeof colors] : '#6B7280'
}

function calculateGroupPosition(index: number, totalGroups: number): { x: number; y: number } {
  const groupsPerRow = Math.ceil(Math.sqrt(totalGroups))
  const row = Math.floor(index / groupsPerRow)
  const col = index % groupsPerRow
  
  return {
    x: API_LAYOUT.startX + (col * API_LAYOUT.horizontalSpacing),
    y: API_LAYOUT.startY + (row * API_LAYOUT.verticalSpacing * 3)
  }
}

export async function generateAPIMapFromEndpoints(
  endpoints: any[],
  projectName: string
): Promise<APIEndpointsMap> {
  console.log('🗺️ Generating API Endpoints Map...')
  console.log(`  Endpoint Groups: ${endpoints.length}`)
  
  const groups: APIGroup[] = []
  const flows: APIFlow[] = []
  let totalEndpoints = 0
  let authEndpoints = 0
  let publicEndpoints = 0

  endpoints.forEach((endpointGroup, groupIndex) => {
    const groupPosition = calculateGroupPosition(groupIndex, endpoints.length)
    const groupColor = getGroupColor(endpointGroup.group)
    
    const apiEndpoints: APIEndpoint[] = (endpointGroup.endpoints || []).map((ep: any, epIndex: number) => {
      totalEndpoints++
      if (ep.auth) authEndpoints++
      else publicEndpoints++
      
      // Create enhanced description with actual API path and details
      const enhancedDescription = ep.description 
        ? `${ep.description} - ${ep.method} ${ep.path}${ep.auth ? ' (Auth Required)' : ''}`
        : `${ep.method} ${ep.path}${ep.auth ? ' (Auth Required)' : ''}`
      
      return {
        id: `endpoint-${endpointGroup.group.toLowerCase().replace(/\s+/g, '-')}-${epIndex}`,
        method: ep.method,
        path: ep.path,
        description: enhancedDescription,
        group: endpointGroup.group,
        requiresAuth: ep.auth || false,
        requestBody: ep.body || undefined,
        responseType: ep.response || 'JSON',
        statusCodes: [200, 400, 401, 500],
        position: {
          x: groupPosition.x,
          y: groupPosition.y + (epIndex * API_LAYOUT.endpointHeight)
        }
      }
    })

    // Create enhanced group description with endpoint count and all paths listed
    const endpointPaths = apiEndpoints.map(ep => `${ep.method} ${ep.path}`)
    
    // Create a detailed description for the group
    const groupDescription = `${endpointGroup.group} - ${apiEndpoints.length} endpoint${apiEndpoints.length > 1 ? 's' : ''}`
    
    // Create formatted endpoints string for display in the node
    const formattedEndpoints = endpointPaths.map((path, idx) => 
      `${idx + 1}. ${path}`
    ).join('\n')

    groups.push({
      id: `group-${endpointGroup.group.toLowerCase().replace(/\s+/g, '-')}`,
      name: endpointGroup.group,
      endpoints: apiEndpoints,
      color: groupColor,
      position: groupPosition,
      endpointPaths: endpointPaths,
      description: groupDescription,
      formattedEndpoints: formattedEndpoints
    })
  })

  // Generate flows between related endpoints with enhanced descriptions
  groups.forEach((group, index) => {
    if (index > 0) {
      const prevGroup = groups[index - 1]
      const flowDescription = `${prevGroup.name} → ${group.name}: API workflow connection`
      
      flows.push({
        id: `flow-${index}`,
        source: groups[index - 1].id,
        target: group.id,
        method: 'HTTP',
        label: flowDescription
      })
    }
  })

  console.log(`✅ API Map generated with ${totalEndpoints} endpoints across ${groups.length} groups`)
  
  // Log sample group data for debugging
  if (groups.length > 0) {
    console.log('📋 Sample Group Data:', {
      groupName: groups[0].name,
      endpointCount: groups[0].endpoints.length,
      endpointPaths: groups[0].endpointPaths,
      sampleEndpoint: groups[0].endpoints[0]
    })
  }

  return {
    id: `api-map-${Date.now()}`,
    name: `${projectName} - API Endpoints Map`,
    groups,
    flows,
    metadata: {
      totalEndpoints,
      totalGroups: groups.length,
      authEndpoints,
      publicEndpoints,
      createdAt: new Date().toISOString()
    }
  }
}

export async function generateEnhancedAPIMap(
  endpoints: any[],
  projectName: string,
  schemas?: any[]
): Promise<APIEndpointsMap> {
  try {
    // Extract actual endpoint paths for AI context
    const endpointSummary = endpoints.map(group => ({
      group: group.group,
      endpoints: group.endpoints.map((ep: any) => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        auth: ep.auth
      }))
    }))

    const systemPrompt = `You are an API architect. Analyze the given endpoints and provide insights about API design, security, and best practices. Return as JSON.`
    
    const userPrompt = `Analyze these API endpoints for ${projectName}:
${JSON.stringify(endpointSummary, null, 2)}

Consider the actual endpoint paths and their relationships. Provide:
1. REST compliance issues (reference specific endpoints by path)
2. Security recommendations (mention specific endpoints that need attention)
3. Missing endpoints (suggest paths that would complement the existing API)
4. Rate limiting suggestions (which endpoints need it most)
5. Versioning strategy (note current versioning pattern from paths)

Return as JSON: { restIssues: [], securityRecommendations: [], missingEndpoints: [], rateLimiting: string, versioning: string }`

    const response = await generateText({
      model: groqProvider('llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      maxTokens: 2000
    })

    console.log('✅ AI analysis completed for API Map')
    
    const apiMap = await generateAPIMapFromEndpoints(endpoints, projectName)
    
    try {
      let aiInsights = response.text.trim()
      if (aiInsights.startsWith('```')) {
        aiInsights = aiInsights.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      }
      const insights = JSON.parse(aiInsights)
      ;(apiMap as any).aiInsights = insights
      console.log('✅ AI insights parsed and attached to API Map')
    } catch (e) {
      console.warn('Could not parse AI insights for API Map')
    }
    
    return apiMap
    
  } catch (error) {
    console.error('❌ Enhanced API Map generation failed:', error)
    return generateAPIMapFromEndpoints(endpoints, projectName)
  }
}