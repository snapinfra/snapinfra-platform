import { NextResponse } from 'next/server'
import { generateIaC } from '@/lib/ai/iac-generator'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { project, options } = body || {}

    if (!project) {
      return NextResponse.json({ success: false, error: 'Missing project payload' }, { status: 400 })
    }

    const result = await generateIaC(project, {
      targets: options?.targets || ['terraform', 'aws-cdk', 'docker-compose'],
      cloud: options?.cloud || 'aws',
      environment: options?.environment || 'development',
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    })

    return NextResponse.json({ success: result.success, data: result, error: result.error })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate IaC' }, { status: 500 })
  }
}
