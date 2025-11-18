import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedERD } from '@/lib/utils/erd-generator'
import { generateNodeExplanations } from '@/lib/ai/node-explanation-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schemas, projectName, description } = body

    if (!schemas || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schemas or projectName' },
        { status: 400 }
      )
    }

    console.log('🗺️ Generating ERD for project:', projectName)
    console.log('  Schemas:', schemas?.length || 0)

    const erd = await generateEnhancedERD(schemas, projectName, description)

    console.log('✅ ERD generated successfully')
    console.log('  Tables (Nodes):', erd.nodes.length)
    console.log('  Relationships (Edges):', erd.edges.length)

    // Generate AI explanations
    console.log('🤖 Generating AI explanations for ERD entities...')
    const nodesWithExplanations = await generateNodeExplanations({
      nodes: erd.nodes,
      projectContext: { name: projectName, description, schemas },
      diagramType: 'ERD',
    })

    const enhancedERD = { ...erd, nodes: nodesWithExplanations }
    console.log('✅ AI explanations generated successfully')

    return NextResponse.json({
      success: true,
      erd: {
        nodes: enhancedERD.nodes,
        edges: enhancedERD.edges,
        metadata: enhancedERD.metadata,
        aiInsights: (enhancedERD as any).aiInsights
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTables: enhancedERD.nodes.length,
        totalRelationships: enhancedERD.edges.length,
        totalFields: enhancedERD.metadata.totalFields
      }
    })

  } catch (error: any) {
    console.error('❌ ERD generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate ERD',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/generate-erd',
    method: 'POST',
    requiredFields: ['schemas', 'projectName'],
    description: 'Generates Entity Relationship Diagram from database schemas',
    responseFormat: {
      nodes: 'Array of table nodes for ReactFlow',
      edges: 'Array of relationship edges for ReactFlow',
      metadata: 'Diagram statistics'
    }
  })
}
