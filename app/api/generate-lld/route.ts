// app/api/generate-lld/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateLLDFromData } from '@/lib/utils/lld-generator'
import { DatabaseSchemaToArchitecture, ApiEndpointsToArchitecture } from '@/lib/types/architecture'
import { generateNodeExplanations } from '@/lib/ai/node-explanation-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { schemas, endpoints, projectName, description, analysis } = body

    // Validate required fields
    if (!schemas || !endpoints || !projectName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: schemas, endpoints, or projectName' 
        },
        { status: 400 }
      )
    }

    console.log('🔧 Generating LLD for project:', projectName)
    console.log('  Schemas:', schemas?.length || 0)
    console.log('  API Groups:', endpoints?.length || 0)

    // Prepare data for LLD generation
    const schemaData: DatabaseSchemaToArchitecture = {
      schemas: schemas || [],
      analysis: analysis || {}
    }

    const apiData: ApiEndpointsToArchitecture = {
      endpoints: endpoints || [],
      groups: [...new Set((endpoints || []).map((group: any) => group.group))]
    }

    // Generate the low-level design
    const lld = await generateLLDFromData(
      schemaData,
      apiData,
      projectName
    )

    console.log('✅ LLD generated successfully')
    console.log('  Components:', lld.nodes.length)
    console.log('  Connections:', lld.edges.length)

    // Generate AI explanations for each node
    console.log('🤖 Generating AI explanations for LLD nodes...')
    const nodesWithExplanations = await generateNodeExplanations({
      nodes: lld.nodes,
      projectContext: {
        name: projectName,
        description: description,
        schemas: schemas,
        apiEndpoints: endpoints,
      },
      diagramType: 'LLD',
    })

    const enhancedLLD = {
      ...lld,
      nodes: nodesWithExplanations,
    }

    console.log('✅ AI explanations generated successfully')

    // Extract component statistics
    const componentsByLayer = enhancedLLD.nodes.reduce((acc: any, node: any) => {
      const layer = node.data.metadata?.layer || 'Unknown'
      acc[layer] = (acc[layer] || 0) + 1
      return acc
    }, {})

    const methodCount = enhancedLLD.nodes.reduce((sum: number, node: any) => {
      return sum + (node.data.metadata?.methods?.length || 0)
    }, 0)

    return NextResponse.json({
      success: true,
      lld: enhancedLLD,
      metadata: {
        generatedAt: new Date().toISOString(),
        componentsCount: enhancedLLD.nodes.length,
        connectionsCount: enhancedLLD.edges.length,
        methodsCount: methodCount,
        complexity: enhancedLLD.metadata?.complexity || 'Detailed',
        designPattern: enhancedLLD.metadata?.scalingStrategy || 'Layered Architecture',
        componentsByLayer
      }
    })

  } catch (error: any) {
    console.error('❌ LLD generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate low-level design',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/generate-lld',
    method: 'POST',
    requiredFields: ['schemas', 'endpoints', 'projectName'],
    description: 'Generates detailed low-level design with controllers, services, repositories, and implementation details'
  })
}