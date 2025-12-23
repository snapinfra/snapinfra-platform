// app/api/generate-erd/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedERD } from '@/lib/utils/erd-generator'
import { generateNodeExplanations } from '@/lib/ai/node-explanation-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schemas, projectName, description } = body

    console.log('📥 ERD Generation Request Received')
    console.log('  Project Name:', projectName)
    console.log('  Description:', description)
    console.log('  Schemas Count:', schemas?.length || 0)
    
    // Detailed schema logging for debugging
    if (schemas && Array.isArray(schemas)) {
      schemas.forEach((schema, idx) => {
        console.log(`\n  Schema ${idx + 1}:`)
        console.log(`    - Name: ${schema?.name || 'MISSING'}`)
        console.log(`    - Fields: ${schema?.fields?.length || 0}`)
        console.log(`    - Has fields array: ${Array.isArray(schema?.fields)}`)
        
        if (schema?.fields && Array.isArray(schema.fields)) {
          console.log(`    - Field names: ${schema.fields.map((f: any) => f?.name || 'UNNAMED').join(', ')}`)
        }
      })
    }
    
    console.log('─'.repeat(60))

    // Validation
    if (!schemas || !projectName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: {
            hasSchemas: !!schemas,
            isArray: Array.isArray(schemas),
            schemasCount: schemas?.length || 0,
            hasProjectName: !!projectName
          }
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(schemas)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schemas must be an array',
          receivedType: typeof schemas
        },
        { status: 400 }
      )
    }

    if (schemas.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schemas array is empty'
        },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed')
    console.log('🗺️ Starting ERD generation...')

    // Generate ERD
    const erd = await generateEnhancedERD(schemas, projectName, description)

    console.log('✅ ERD generated successfully')
    console.log(`  Tables (Nodes): ${erd.nodes.length}`)
    console.log(`  Relationships (Edges): ${erd.edges.length}`)
    console.log(`  Total Fields: ${erd.metadata.totalFields}`)

    // Validate ERD structure before sending
    if (!erd.nodes || erd.nodes.length === 0) {
      console.error('❌ Generated ERD has no nodes!')
      return NextResponse.json(
        {
          success: false,
          error: 'ERD generation produced no tables',
          details: 'All schemas were filtered out during validation'
        },
        { status: 500 }
      )
    }

    // Generate AI explanations (optional, non-blocking)
    let nodesWithExplanations = erd.nodes
    
    if (typeof generateNodeExplanations === 'function') {
      try {
        console.log('🤖 Generating AI explanations for ERD entities...')
        nodesWithExplanations = await generateNodeExplanations({
          nodes: erd.nodes,
          projectContext: { name: projectName, description, schemas },
          diagramType: 'ERD',
        })
        console.log('✅ AI explanations generated successfully')
      } catch (explanationError) {
        console.warn('⚠️ Failed to generate AI explanations:', explanationError)
        console.warn('⚠️ Continuing without explanations')
        // Continue with nodes without explanations
      }
    }

    const enhancedERD = { ...erd, nodes: nodesWithExplanations }

    // Log final output for debugging
    console.log('\n📤 Sending Response:')
    console.log(`  Nodes: ${enhancedERD.nodes.length}`)
    console.log(`  Edges: ${enhancedERD.edges.length}`)
    console.log(`  Sample node IDs: ${enhancedERD.nodes.slice(0, 3).map(n => n.id).join(', ')}`)

    return NextResponse.json({
      success: true,
      erd: {
        id: enhancedERD.id,
        name: enhancedERD.name,
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
    console.error('Stack trace:', error.stack)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate ERD',
        errorType: error.constructor.name,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
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
    requiredFields: {
      schemas: 'Array of database schema objects',
      projectName: 'String - name of the project'
    },
    optionalFields: {
      description: 'String - project description'
    },
    schemaFormat: {
      name: 'String (required)',
      fields: 'Array (required) - must have at least one field',
      indexes: 'Array (optional)',
      constraints: 'Array (optional)',
      description: 'String (optional)',
      comment: 'String (optional)'
    },
    fieldFormat: {
      name: 'String (required)',
      type: 'String (optional, defaults to VARCHAR)',
      primary: 'Boolean (optional)',
      unique: 'Boolean (optional)',
      nullable: 'Boolean (optional, defaults to true)',
      references: 'Object (optional) - { table: String, field: String }'
    },
    responseFormat: {
      success: 'Boolean',
      erd: {
        id: 'String',
        name: 'String',
        nodes: 'Array - ReactFlow compatible nodes',
        edges: 'Array - ReactFlow compatible edges',
        metadata: 'Object - diagram statistics'
      }
    },
    example: {
      schemas: [
        {
          name: 'users',
          fields: [
            { name: 'id', type: 'INTEGER', primary: true },
            { name: 'email', type: 'VARCHAR', unique: true },
            { name: 'name', type: 'VARCHAR' }
          ]
        }
      ],
      projectName: 'My Database'
    }
  })
}