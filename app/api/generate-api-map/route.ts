import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedAPIMap } from '@/lib/utils/api-map-generator'
import { generateNodeExplanations } from '@/lib/ai/node-explanation-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoints, projectName, schemas, description } = body

    if (!endpoints || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: endpoints or projectName' },
        { status: 400 }
      )
    }

    console.log('🗺️ Generating API Map for project:', projectName)
    console.log('  Endpoint Groups:', endpoints?.length || 0)

    const apiMap = await generateEnhancedAPIMap(endpoints, projectName, schemas)

    console.log('✅ API Map generated successfully')
    console.log('  Groups:', apiMap.groups.length)
    console.log('  Total Endpoints:', apiMap.metadata.totalEndpoints)

    // Generate AI explanations for nodes (if apiMap has nodes)
    let enhancedAPIMap = apiMap
    if (apiMap.nodes && apiMap.nodes.length > 0) {
      console.log('🤖 Generating AI explanations for API Map nodes...')
      const nodesWithExplanations = await generateNodeExplanations({
        nodes: apiMap.nodes,
        projectContext: { name: projectName, description, schemas, apiEndpoints: endpoints },
        diagramType: 'APIMap',
      })
      enhancedAPIMap = { ...apiMap, nodes: nodesWithExplanations }
      console.log('✅ AI explanations generated successfully')
    }

    return NextResponse.json({
      success: true,
      apiMap: enhancedAPIMap,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalEndpoints: enhancedAPIMap.metadata.totalEndpoints,
        totalGroups: enhancedAPIMap.metadata.totalGroups,
        authEndpoints: enhancedAPIMap.metadata.authEndpoints,
        publicEndpoints: enhancedAPIMap.metadata.publicEndpoints
      }
    })

  } catch (error: any) {
    console.error('❌ API Map generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate API Map',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/generate-api-map',
    method: 'POST',
    requiredFields: ['endpoints', 'projectName'],
    description: 'Generates API Endpoints Map with routes, methods, and authentication'
  })
}