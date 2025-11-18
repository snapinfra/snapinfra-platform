import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedDataFlow } from '@/lib/utils/dataflow-generator'
import { generateNodeExplanations } from '@/lib/ai/node-explanation-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schemas, endpoints, projectName, description } = body

    if (!schemas || !endpoints || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schemas, endpoints, or projectName' },
        { status: 400 }
      )
    }

    console.log('🗺️ Generating Data Flow Diagram for project:', projectName)
    console.log('  Schemas:', schemas?.length || 0)
    console.log('  Endpoint Groups:', endpoints?.length || 0)

    const dataFlow = await generateEnhancedDataFlow(schemas, endpoints, projectName)

    console.log('✅ Data Flow Diagram generated successfully')
    console.log('  Nodes:', dataFlow.nodes.length)
    console.log('  Flows:', dataFlow.edges.length)

    // Generate AI explanations
    console.log('🤖 Generating AI explanations for DataFlow nodes...')
    const nodesWithExplanations = await generateNodeExplanations({
      nodes: dataFlow.nodes,
      projectContext: { name: projectName, description, schemas, apiEndpoints: endpoints },
      diagramType: 'DataFlow',
    })

    const enhancedDataFlow = { ...dataFlow, nodes: nodesWithExplanations }
    console.log('✅ AI explanations generated successfully')

    return NextResponse.json({
      success: true,
      dataFlow: enhancedDataFlow,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalNodes: enhancedDataFlow.metadata.totalNodes,
        totalFlows: enhancedDataFlow.metadata.totalFlows,
        encryptedFlows: enhancedDataFlow.metadata.encryptedFlows
      }
    })

  } catch (error: any) {
    console.error('❌ Data Flow generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate Data Flow Diagram',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/generate-dataflow',
    method: 'POST',
    requiredFields: ['schemas', 'endpoints', 'projectName'],
    description: 'Generates Data Flow Diagram showing how data moves through the system'
  })
}