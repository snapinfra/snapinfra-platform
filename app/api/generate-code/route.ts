import { NextRequest, NextResponse } from 'next/server'
import { generateCode } from '@/lib/ai/code-generator'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { project, framework = 'express', language = 'typescript', includeAuth = false, includeTests = false, options } = body || {}

    if (!project || !project.schema || project.schema.length === 0) {
      return NextResponse.json({ success: false, error: 'Project must have at least one table in schema' }, { status: 400 })
    }

    const result = await generateCode(project, {
      framework,
      language,
      includeAuth,
      includeTests,
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    return NextResponse.json({ success: result.success, data: result, error: result.error })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate code' }, { status: 500 })
  }
}
