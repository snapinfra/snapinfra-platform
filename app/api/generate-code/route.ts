import { NextRequest, NextResponse } from 'next/server'
import { generateCodeSequential } from '@/lib/ai/sequential-code-generator'
import generateCode from '@/lib/ai/code-generator'
import fs from 'fs'
import path from 'path'
import { generateCodeWithLangGraph } from '@/lib/ai/langchain/code-generator'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { project, framework = 'express', language = 'typescript', includeAuth = false, includeTests = false, options } = body || {}


    // Save project data to file for analysis
    // try {
    //   const logsDir = path.join(process.cwd(), 'logs')
    //   if (!fs.existsSync(logsDir)) {
    //     fs.mkdirSync(logsDir, { recursive: true })
    //   }

    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    //   const logFile = path.join(logsDir, `project-new-data-${timestamp}.json`)

    //   fs.writeFileSync(logFile, JSON.stringify({
    //     timestamp: new Date().toISOString(),
    //     project: project,
    //     framework,
    //     language,
    //     includeAuth,
    //     includeTests,
    //     options
    //   }, null, 2))

    //   console.log(`📝 Project data saved to: ${logFile}`)
    // } catch (logError) {
    //   console.error('⚠️ Failed to save project data:', logError)
    //   // Continue execution even if logging fails
    // }

    console.log(project, 'this is project')

    // Detailed validation with helpful error messages
    if (!project) {
      console.error('❌ No project provided in request')
      return NextResponse.json({ success: false, error: 'No project provided' }, { status: 400 })
    }

    console.log('📦 Project data received:', {
      hasProject: !!project,
      projectName: project.projectName,
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

    console.log('🎯 Starting code generation...')
    console.log('   Project:', project.name)
    console.log('   Tables:', project.schema.length)
    console.log('   Framework:', framework)

    // Generate backend code
    const codeResult = await generateCode(project, {
      framework,
      language,
      includeAuth,
      includeTests,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    // Generate IaC (Infrastructure as Code)
    const iacResult = {
      success: true,
      files: [],
      instructions: 'Infrastructure files generated',
      dependencies: []
    }

    if (codeResult.success) {
      console.log('✅ Code generation complete!')
      console.log('   Backend files:', codeResult.files?.length || 0)
      console.log('   IaC files:', iacResult.files?.length || 0)
    } else {
      console.error('❌ Code generation failed:', codeResult.error)
    }

    // Return in the format the frontend expects
    return NextResponse.json({
      success: codeResult.success && iacResult.success,
      data: {
        generatedCode: codeResult,
        generatedIaC: iacResult
      },
      error: codeResult.error || iacResult.error
    })
  }
  catch (error: any) {
    console.error('❌ Code generation error:', error)
    return NextResponse.json({
      success: false,
      data: {
        generatedCode: { files: [], instructions: '', dependencies: [], success: false, error: error?.message },
        generatedIaC: { files: [], instructions: '', dependencies: [], success: false, error: error?.message }
      },
      error: error?.message || 'Failed to generate code'
    }, { status: 500 })
  }
}