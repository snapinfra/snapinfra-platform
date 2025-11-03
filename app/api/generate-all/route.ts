import { NextRequest, NextResponse } from 'next/server'
import generateCode from '@/lib/ai/code-generator'
import { generateIntelligentSchema } from '@/lib/iac/ai-schema-designer'
import { HybridTemplateRenderer } from '@/lib/iac/template-renderer'
import { AIEnhancementEngine } from '@/lib/iac/ai-enhancement-engine'
import type { AISchemaContext } from '@/lib/iac/schema-types'
import { generatePipeline } from '@/lib/cicd/pipeline-generator'
import { calculateCost } from '@/lib/cost/cost-calculator'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { project, framework = 'express', language = 'typescript', includeAuth = false, includeTests = false, options } = body || {}

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

    console.log('🚀 Starting unified code generation (Backend + IaC)...')
    console.log('   Project:', project.name)
    console.log('   Tables:', project.schema.length)
    console.log('   Framework:', framework)

    const results: any = {
      backend: null,
      iac: null
    }

    console.log('\n============================================================')
    console.log('📝 PHASE 1: BACKEND CODE GENERATION')
    console.log('============================================================\n')

    try {
      const backendResult = await generateCode(project, {
        framework,
        language,
        includeAuth,
        includeTests,
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      })

      if (backendResult.success) {
        console.log('✅ Backend code generation complete!')
        console.log('   Files generated:', backendResult.files.length)
        results.backend = backendResult
      } else {
        console.error('❌ Backend code generation failed:', backendResult.error)
        results.backend = { success: false, error: backendResult.error, files: [], instructions: '', dependencies: [] }
      }
    } catch (error: any) {
      console.error('❌ Backend code generation error:', error)
      results.backend = { success: false, error: error?.message || 'Backend generation failed', files: [], instructions: '', dependencies: [] }
    }

    console.log('\n============================================================')
    console.log('🏗️  PHASE 2: INFRASTRUCTURE AS CODE GENERATION')
    console.log('============================================================\n')

    try {
      const context: AISchemaContext = {
        project: {
          name: project.name,
          description: project.description,
          schema: project.schema,
          endpoints: project.endpoints,
          database: project.database,
          architecture: project.architecture
        },
        userPreferences: options?.preferences || {
          cost: options?.costPreference || 'balanced',
          scale: options?.scalePreference || 'startup',
          compliance: options?.compliance || []
        },
        architectureHints: options?.architectureHints,
        budget: options?.budget
      }

      console.log('🧠 Step 1: AI analyzing and designing infrastructure schema...')
      
      const schemaResult = await generateIntelligentSchema(context)
      
      console.log('✅ Schema generated successfully!')
      console.log('   Resources:', Object.keys(schemaResult.schema.resources).length)
      console.log('   Estimated Cost: $', schemaResult.estimatedMonthlyCost.min, '-', schemaResult.estimatedMonthlyCost.max, '/month')

      console.log('🏗️  Step 2: Generating IaC files from templates...')
      
      const renderer = new HybridTemplateRenderer()
      const targets = options?.iacTargets || ['terraform', 'docker-compose']
      
      let allFiles: any[] = []
      let instructions = ''
      
      for (const target of targets) {
        console.log(`📝 Rendering ${target}...`)
        
        try {
          const files = await renderer.render(schemaResult.schema, {
            target: target as any,
            environment: options?.environment || 'development',
            enableAIEnhancements: options?.enableAIEnhancements !== false,
            includeComments: true,
            includeMonitoring: true
          })
          
          allFiles.push(...files)
          console.log(`✅ Generated ${files.length} ${target} files`)
        } catch (error: any) {
          console.error(`❌ Error generating ${target}:`, error.message)
        }
      }
      
      if (allFiles.length === 0) {
        throw new Error('No IaC files could be generated')
      }
      
      const validation = await renderer.validate(allFiles)
      if (!validation.valid) {
        console.warn('⚠️  Some files failed validation:', validation.errors)
      }
      
      instructions = generateInstructions(schemaResult.schema, targets, options?.environment)

      console.log('✅ IaC files generated successfully!')
      console.log('   Files:', allFiles.length)
      console.log('   Validation:', validation.valid ? 'PASSED' : 'WARNINGS')
      
      let pipelineResult = null
      if (options?.generatePipeline !== false) {
        console.log('🔧 Step 3: Generating CI/CD pipeline...')
        
        try {
          const pipelineConfig = {
            provider: options?.pipelineProvider || 'github-actions',
            target: targets[0] || 'terraform',
            projectName: project.name,
            environment: options?.environment || 'development',
            features: {
              enableTesting: options?.enableTesting !== false,
              enableLinting: options?.enableLinting !== false,
              enableSecurity: options?.enableSecurity !== false,
              enableCaching: true,
              enableNotifications: false
            }
          }
          
          pipelineResult = generatePipeline(pipelineConfig)
          console.log('✅ Pipeline generated:', pipelineResult.fileName)
        } catch (error: any) {
          console.error('⚠️  Pipeline generation failed:', error.message)
        }
      }
      
      let costEstimate = null
      if (options?.calculateCost !== false) {
        console.log('💰 Step 4: Calculating infrastructure costs...')
        
        try {
          const provider = options?.cloudProvider || 'aws'
          costEstimate = calculateCost(schemaResult.schema, provider)
          
          console.log('✅ Cost calculated')
          console.log('   Monthly:', `$${costEstimate.monthly.toFixed(2)}`)
          console.log('   Yearly:', `$${costEstimate.yearly.toFixed(2)}`)
        } catch (error: any) {
          console.error('⚠️  Cost calculation failed:', error.message)
        }
      }
      
      let aiEnhancements = null
      if (options?.enableAIEnhancements !== false) {
        console.log('🎨 Step 5: AI analyzing for enhancements...')
        
        try {
          const enhancer = new AIEnhancementEngine()
          const enhancementResult = await enhancer.enhanceInfrastructure(
            allFiles,
            schemaResult.schema,
            {
              focusAreas: options?.enhancementFocus || ['security', 'cost', 'monitoring'],
              budget: options?.budget,
              compliance: options?.preferences?.compliance,
              autoApply: options?.autoApplyEnhancements === true
            }
          )
          
          aiEnhancements = enhancementResult
          
          console.log('✅ AI Enhancement complete!')
          console.log('   Total suggestions:', enhancementResult.summary.total)
          console.log('   Auto-applicable:', enhancementResult.autoApplicable.length)
          console.log('   Requires review:', enhancementResult.requiresReview.length)
          
          if (options?.autoApplyEnhancements && enhancementResult.autoApplicable.length > 0) {
            console.log('🔧 Auto-applying safe enhancements...')
            allFiles = await enhancer.applyEnhancements(allFiles, enhancementResult.autoApplicable)
          }
        } catch (error: any) {
          console.error('⚠️  AI enhancement failed:', error.message)
        }
      }

      results.iac = {
        success: true,
        schema: schemaResult.schema,
        reasoning: schemaResult.reasoning,
        recommendations: schemaResult.recommendations,
        analysis: schemaResult.analysis,
        estimatedCost: schemaResult.estimatedMonthlyCost,
        files: allFiles,
        instructions,
        dependencies: getDependencies(targets),
        validation: {
          valid: validation.valid,
          warnings: validation.warnings,
          errors: validation.errors
        },
        enhancements: aiEnhancements ? {
          total: aiEnhancements.summary.total,
          byCategory: aiEnhancements.summary.byCategory,
          estimatedImpact: aiEnhancements.summary.estimatedImpact,
          suggestions: aiEnhancements.requiresReview,
          autoApplied: options?.autoApplyEnhancements ? aiEnhancements.autoApplicable : []
        } : null,
        pipeline: pipelineResult,
        cost: costEstimate
      }

    } catch (error: any) {
      console.error('❌ Infrastructure generation error:', error)
      results.iac = { success: false, error: error?.message || 'IaC generation failed', files: [], instructions: '', dependencies: [] }
    }

    console.log('\n============================================================')
    console.log('✅ UNIFIED CODE GENERATION COMPLETE!')
    console.log('============================================================')
    console.log('📊 Backend Code:', results.backend.success ? `✅ ${results.backend.files.length} files` : '❌ Failed')
    console.log('📊 Infrastructure:', results.iac.success ? `✅ ${results.iac.files.length} files` : '❌ Failed')
    console.log('============================================================\n')

    return NextResponse.json({ 
      success: results.backend.success && results.iac.success, 
      data: {
        generatedCode: results.backend,
        generatedIaC: results.iac,
        summary: {
          totalFiles: (results.backend.files?.length || 0) + (results.iac.files?.length || 0),
          backendFiles: results.backend.files?.length || 0,
          iacFiles: results.iac.files?.length || 0,
          backendSuccess: results.backend.success,
          iacSuccess: results.iac.success
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Unified generation error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to generate code' }, { status: 500 })
  }
}

function generateInstructions(schema: any, targets: string[], environment?: string): string {
  let instructions = `# Deployment Instructions for ${schema.project.name}\n\n`
  
  if (targets.includes('terraform')) {
    instructions += `## Terraform Deployment\n\n`
    instructions += `1. Initialize Terraform:\n   \`\`\`bash\n   cd infra/terraform\n   terraform init\n   \`\`\`\n\n`
    instructions += `2. Review the plan:\n   \`\`\`bash\n   terraform plan\n   \`\`\`\n\n`
    instructions += `3. Apply the configuration:\n   \`\`\`bash\n   terraform apply\n   \`\`\`\n\n`
  }
  
  if (targets.includes('docker-compose')) {
    instructions += `## Docker Compose Deployment\n\n`
    instructions += `1. Copy environment file:\n   \`\`\`bash\n   cp .env.example .env\n   \`\`\`\n\n`
    instructions += `2. Edit .env with your values\n\n`
    instructions += `3. Start services:\n   \`\`\`bash\n   docker-compose up -d\n   \`\`\`\n\n`
    instructions += `4. Check status:\n   \`\`\`bash\n   docker-compose ps\n   \`\`\`\n\n`
  }
  
  return instructions
}

function getDependencies(targets: string[]): string[] {
  const deps: string[] = []
  
  if (targets.includes('terraform')) {
    deps.push('Terraform >= 1.0')
    deps.push('AWS CLI configured')
  }
  
  if (targets.includes('docker-compose')) {
    deps.push('Docker >= 20.10')
    deps.push('Docker Compose >= 2.0')
  }
  
  return deps
}
