import { NextResponse } from 'next/server'
import { generateIaC } from '@/lib/ai/iac-generator'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { project, options } = body || {}

    if (!project) {
      console.error('❌ No project provided in request')
      return NextResponse.json({ success: false, error: 'No project provided' }, { status: 400 })
    }

    console.log('📦 IaC Project data received:', {
      hasProject: !!project,
      projectName: project.name,
      hasSchema: !!project.schema,
      schemaType: Array.isArray(project.schema) ? 'array' : typeof project.schema,
      schemaLength: Array.isArray(project.schema) ? project.schema.length : 'N/A'
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
      return NextResponse.json({ success: false, error: 'Project must have at least one table' }, { status: 400 })
    }

    const targets = options?.targets || ['terraform', 'aws-cdk', 'docker-compose']
    const cloud = options?.cloud || 'aws'
    const environment = options?.environment || 'development'

    console.log('🎯 Starting single-call IaC generation...')
    console.log('   Project:', project.name)
    console.log('   Tables:', project.schema.length)
    console.log('   Targets:', targets.join(', '))
    console.log('   Cloud:', cloud)

    const result = await generateIaC(project, {
      targets,
      cloud,
      environment,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    if (result.success) {
      console.log('✅ Single-call IaC generation complete!')
      console.log('   Files generated:', result.files.length)
    } else {
      console.error('❌ IaC generation failed:', result.error)
    }

    return NextResponse.json({ success: result.success, data: result, error: result.error })
  } catch (error: any) {
    console.error('❌ IaC generation error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate IaC' }, { status: 500 })
  }
}
