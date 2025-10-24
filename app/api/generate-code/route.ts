import { NextRequest, NextResponse } from 'next/server'
import { generateCodeSequential } from '@/lib/ai/sequential-code-generator'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { project, framework = 'express', language = 'typescript', includeAuth = false, includeTests = false, options } = body || {}

    // Detailed validation with helpful error messages
    if (!project) {
      console.error('❌ No project provided in request')
      return NextResponse.json({ success: false, error: 'No project provided' }, { status: 400 })
    }

    console.log('📦 Project data received:', {
      hasProject: !!project,
      projectName: project.name,
      hasSchema: !!project.schema,
      schemaType: Array.isArray(project.schema) ? 'array' : typeof project.schema,
      schemaLength: Array.isArray(project.schema) ? project.schema.length : 'N/A',
      schemaKeys: project.schema ? Object.keys(project.schema).slice(0, 5) : 'N/A'
    })

    if (!project.schema) {
      console.error('❌ Project has no schema property')
      return NextResponse.json({ success: false, error: 'Project schema is missing. Please ensure your project has database tables defined.' }, { status: 400 })
    }

    if (!Array.isArray(project.schema)) {
      console.error('❌ Project schema is not an array:', typeof project.schema)
      return NextResponse.json({ success: false, error: 'Project schema must be an array of tables' }, { status: 400 })
    }

    if (project.schema.length === 0) {
      console.error('❌ Project schema is empty')
      return NextResponse.json({ success: false, error: 'Project must have at least one table in schema' }, { status: 400 })
    }

    console.log('🎯 Starting sequential code generation...')
    console.log('   Project:', project.name)
    console.log('   Tables:', project.schema.length)
    console.log('   Framework:', framework)

    const result = await generateCodeSequential(project, {
      framework,
      language,
      includeAuth,
      includeTests,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    if (result.success) {
      console.log('✅ Sequential code generation complete!')
      console.log('   Files generated:', result.files.length)
      console.log('   Steps completed:', Object.keys(result.steps || {}).length)
    } else {
      console.error('❌ Sequential code generation failed:', result.error)
    }

    return NextResponse.json({ success: result.success, data: result, error: result.error })
  } catch (error: any) {
    console.error('❌ Code generation error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate code' }, { status: 500 })
  }
}
