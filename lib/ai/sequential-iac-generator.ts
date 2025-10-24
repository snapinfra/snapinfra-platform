import { generateText } from 'ai'

// Sequential IaC generation with multi-step prompts for better consistency

export interface SequentialIaCOptions {
  targets: Array<'terraform' | 'aws-cdk' | 'kubernetes' | 'docker-compose' | 'helm' | 'azure-bicep' | 'gcp-terraform'>
  cloud?: 'aws' | 'gcp' | 'azure' | 'multi'
  environment?: 'development' | 'staging' | 'production'
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface GeneratedIaCFile {
  path: string
  content: string
  description?: string
}

export interface SequentialIaCResult {
  files: GeneratedIaCFile[]
  instructions: string
  dependencies: string[]
  success: boolean
  error?: string
  steps?: {
    namingConventions?: any
    networkInfra?: any
    database?: any
    compute?: any
    monitoring?: any
  }
}

interface Project {
  id: string
  name: string
  description: string
  schema: any[]
  endpoints?: any[]
  database: { type: string }
  architecture?: { nodes?: any[]; edges?: any[] }
}

// STEP 1: Define resource naming conventions
const STEP1_NAMING_PROMPT = `You are a senior DevOps engineer. Define naming conventions for infrastructure resources.

Output ONLY valid JSON:
{
  "projectPrefix": "string (kebab-case, e.g., myapp)",
  "namingConventions": {
    "terraform": {
      "resources": "snake_case (e.g., api_server, db_instance)",
      "variables": "snake_case (e.g., vpc_cidr, region)",
      "outputs": "snake_case (e.g., db_endpoint, api_url)"
    },
    "kubernetes": {
      "deployments": "kebab-case (e.g., api-deployment, db-service)",
      "labels": "kebab-case keys (e.g., app: myapp-api)"
    },
    "dockerCompose": {
      "services": "snake_case (e.g., api_server, postgres_db)"
    }
  },
  "resourceNames": {
    "database": "string (e.g., myapp-db)",
    "api": "string (e.g., myapp-api)",
    "cache": "string (e.g., myapp-cache)",
    "vpc": "string (e.g., myapp-vpc)"
  },
  "envVars": {
    "databaseUrl": "DATABASE_URL",
    "apiPort": "API_PORT",
    "nodeEnv": "NODE_ENV"
  }
}`

// STEP 2: Generate network infrastructure
const STEP2_NETWORK_PROMPT = `Generate network infrastructure (VPC, subnets, security groups) using the EXACT naming from step 1.

CRITICAL: Use the EXACT resource names defined in step 1.

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string",
      "content": "string (complete IaC code)",
      "description": "string"
    }
  ]
}`

// STEP 3: Generate database infrastructure
const STEP3_DATABASE_PROMPT = `Generate database infrastructure using the EXACT naming and network resources from previous steps.

CRITICAL:
- Reference network resources using EXACT names from step 1 and step 2
- Use database name from step 1

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string",
      "content": "string (complete IaC code)",
      "description": "string"
    }
  ]
}`

// STEP 4: Generate compute infrastructure
const STEP4_COMPUTE_PROMPT = `Generate compute infrastructure (containers, instances) using EXACT naming from previous steps.

CRITICAL:
- Reference database using EXACT name from step 1
- Reference network using EXACT names from step 2
- Use API service name from step 1

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string",
      "content": "string (complete IaC code)",
      "description": "string"
    }
  ]
}`

// STEP 5: Generate monitoring and config
const STEP5_MONITORING_PROMPT = `Generate monitoring, logging, and environment configuration using EXACT names from previous steps.

CRITICAL:
- Use environment variable names from step 1
- Reference resources using EXACT names from previous steps

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string",
      "content": "string (complete config)",
      "description": "string"
    }
  ]
}`

async function callAI(prompt: string, context: string, modelId: string): Promise<string> {
  const { groq } = await import('./groq-client')
  
  const { text } = await generateText({
    model: groq(modelId),
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: context }
    ],
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.9,
  })
  
  return text
}

function cleanJSON(text: string): string {
  let clean = text.trim()
  
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '')
  
  const jsonStart = clean.indexOf('{')
  const jsonEnd = clean.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd > jsonStart) clean = clean.substring(jsonStart, jsonEnd + 1)
  
  clean = clean.replace(/,\s*([\]}])/g, '$1')
  clean = clean.replace(/"\s*\n\s*"/g, '",\n"')
  
  // Fix unescaped control characters in strings
  clean = clean.replace(/"([^"]*)"/g, (match, content) => {
    let escaped = content.replace(/\\/g, '\\\\')
    escaped = escaped.replace(/[\x00-\x1F\x7F]/g, (char: string) => {
      const code = char.charCodeAt(0)
      if (code === 0x0A) return '\\n'
      if (code === 0x0D) return '\\r'
      if (code === 0x09) return '\\t'
      return '\\u' + ('0000' + code.toString(16)).slice(-4)
    })
    return '"' + escaped + '"'
  })
  
  return clean
}

export async function generateIaCSequential(
  project: Project,
  options: SequentialIaCOptions
): Promise<SequentialIaCResult> {
  try {
    const { AI_CONFIG } = await import('./groq-client')
    // Use supported Groq model (llama-3.1-8b-instant is fast and reliable)
    const modelId = options.model || AI_CONFIG.model || 'llama-3.1-8b-instant'
    
    const schemaDetails = JSON.stringify(project.schema, null, 2)
    const targetsStr = options.targets.join(', ')
    const cloud = options.cloud || 'aws'
    const env = options.environment || 'development'
    
    console.log('🚀 Step 1: Defining IaC naming conventions...')
    
    // STEP 1: Define naming
    const step1Context = `Project: ${project.name}
Description: ${project.description}
Cloud: ${cloud}
Environment: ${env}
Targets: ${targetsStr}
Database: ${project.database?.type}

Define consistent resource naming conventions.`

    const step1Response = await callAI(STEP1_NAMING_PROMPT, step1Context, modelId)
    let step1Data
    try {
      step1Data = JSON.parse(cleanJSON(step1Response))
    } catch (e) {
      console.error('Step 1 JSON parse error:', e)
      console.error('Raw response:', step1Response.substring(0, 500))
      throw new Error('Step 1: Failed to parse IaC naming conventions. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 1 complete: Naming conventions defined')
    console.log('   Project prefix:', step1Data.projectPrefix)
    console.log('   Database name:', step1Data.resourceNames.database)
    
    // STEP 2: Network infrastructure
    console.log('🚀 Step 2: Generating network infrastructure...')
    
    const step2Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Resource names (use EXACTLY these):
${JSON.stringify(step1Data.resourceNames, null, 2)}

Cloud: ${cloud}
Targets: ${targetsStr}

Generate network infrastructure (VPC, subnets, security groups).`

    let step2Data
    let step2Retries = 0
    const maxRetries = 1 // Reduce retries for faster generation
    
    while (step2Retries <= maxRetries) {
      try {
        const step2Response = await callAI(STEP2_NETWORK_PROMPT, step2Context, modelId)
        const cleaned = cleanJSON(step2Response)
        step2Data = JSON.parse(cleaned)
        
        // Validate response structure
        if (!step2Data.files || !Array.isArray(step2Data.files)) {
          throw new Error('Response missing required "files" array')
        }
        break // Success
      } catch (e) {
        step2Retries++
        console.error(`Step 2 attempt ${step2Retries} failed:`, e)
        
        if (step2Retries > maxRetries) {
          console.log('⚠️  Step 2 failed after retries, skipping network infrastructure')
          step2Data = { files: [] }
          break
        }
        console.log(`🔄 Retrying Step 2 (attempt ${step2Retries + 1}/${maxRetries + 1})...`)
      }
    }
    
    console.log('✅ Step 2 complete: Network infrastructure generated')
    
    // STEP 3: Database infrastructure
    console.log('🚀 Step 3: Generating database infrastructure...')
    
    const step3Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Database resource name (use EXACTLY this): ${step1Data.resourceNames.database}
Network resources generated in step 2 (reference these):
${step2Data.files.map((f: any) => f.path).join(', ')}

Database type: ${project.database?.type}
Schema:
${schemaDetails}

Generate database infrastructure.`

    let step3Data
    let step3Retries = 0
    
    while (step3Retries <= maxRetries) {
      try {
        const step3Response = await callAI(STEP3_DATABASE_PROMPT, step3Context, modelId)
        const cleaned = cleanJSON(step3Response)
        step3Data = JSON.parse(cleaned)
        
        // Validate response structure
        if (!step3Data.files || !Array.isArray(step3Data.files)) {
          throw new Error('Response missing required "files" array')
        }
        break // Success
      } catch (e) {
        step3Retries++
        console.error(`Step 3 attempt ${step3Retries} failed:`, e)
        
        if (step3Retries > maxRetries) {
          console.log('⚠️  Step 3 failed after retries, skipping database infrastructure')
          step3Data = { files: [] }
          break
        }
        console.log(`🔄 Retrying Step 3 (attempt ${step3Retries + 1}/${maxRetries + 1})...`)
      }
    }
    
    console.log('✅ Step 3 complete: Database infrastructure generated')
    
    // STEP 4: Compute infrastructure
    console.log('🚀 Step 4: Generating compute infrastructure...')
    
    const step4Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

API service name (use EXACTLY this): ${step1Data.resourceNames.api}
Database name (reference EXACTLY this): ${step1Data.resourceNames.database}
Network resources (reference these):
${step2Data.files.map((f: any) => f.path).join(', ')}

Endpoints to support: ${project.endpoints?.length || 0}

Generate compute infrastructure (containers, instances).`

    let step4Data
    let step4Retries = 0
    
    while (step4Retries <= maxRetries) {
      try {
        const step4Response = await callAI(STEP4_COMPUTE_PROMPT, step4Context, modelId)
        const cleaned = cleanJSON(step4Response)
        step4Data = JSON.parse(cleaned)
        
        // Validate response structure
        if (!step4Data.files || !Array.isArray(step4Data.files)) {
          throw new Error('Response missing required "files" array')
        }
        break // Success
      } catch (e) {
        step4Retries++
        console.error(`Step 4 attempt ${step4Retries} failed:`, e)
        
        if (step4Retries > maxRetries) {
          console.log('⚠️  Step 4 failed after retries, skipping compute infrastructure')
          step4Data = { files: [] }
          break
        }
        console.log(`🔄 Retrying Step 4 (attempt ${step4Retries + 1}/${maxRetries + 1})...`)
      }
    }
    
    console.log('✅ Step 4 complete: Compute infrastructure generated')
    
    // STEP 5: Monitoring and config
    console.log('🚀 Step 5: Generating monitoring and configuration...')
    
    const step5Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Environment variables (use EXACTLY these names):
${JSON.stringify(step1Data.envVars, null, 2)}

Resource names to reference:
${JSON.stringify(step1Data.resourceNames, null, 2)}

Generate monitoring, logging, and .env.example file.`

    let step5Data
    let step5Retries = 0
    
    while (step5Retries <= maxRetries) {
      try {
        const step5Response = await callAI(STEP5_MONITORING_PROMPT, step5Context, modelId)
        const cleaned = cleanJSON(step5Response)
        step5Data = JSON.parse(cleaned)
        
        // Validate response structure
        if (!step5Data.files || !Array.isArray(step5Data.files)) {
          throw new Error('Response missing required "files" array')
        }
        break // Success
      } catch (e) {
        step5Retries++
        console.error(`Step 5 attempt ${step5Retries} failed:`, e)
        
        if (step5Retries > maxRetries) {
          console.log('⚠️  Step 5 failed after retries, skipping monitoring config')
          step5Data = { files: [] }
          break
        }
        console.log(`🔄 Retrying Step 5 (attempt ${step5Retries + 1}/${maxRetries + 1})...`)
      }
    }
    
    console.log('✅ Step 5 complete: Monitoring and config generated')
    
    // Combine all successfully generated files
    const allFiles = [
      ...(step2Data?.files || []),
      ...(step3Data?.files || []),
      ...(step4Data?.files || []),
      ...(step5Data?.files || [])
    ]
    
    console.log(`✅ Generated ${allFiles.length} IaC files from successful steps`)
    
    // If no files were generated, throw error - no fallback template
    if (allFiles.length === 0) {
      throw new Error('All IaC generation steps failed. No infrastructure files were generated. Please try again or check the AI model configuration.')
    }
    
    // Generate instructions
    const instructions = `# ${project.name} - Infrastructure as Code

## Naming Conventions
${JSON.stringify(step1Data.namingConventions, null, 2)}

## Resource Names
${JSON.stringify(step1Data.resourceNames, null, 2)}

## Setup Instructions

1. Prerequisites:
   - Install required CLIs: ${options.targets.map(t => {
     if (t === 'terraform') return 'terraform'
     if (t === 'aws-cdk') return 'aws-cdk'
     if (t === 'kubernetes') return 'kubectl'
     return t
   }).join(', ')}

2. Configure credentials for ${cloud}

3. Deploy infrastructure:
   \`\`\`bash
   # Navigate to infrastructure directory
   cd infra/
   
   # Initialize and apply
   # (specific commands depend on target)
   \`\`\`

4. Update .env.example with outputs from deployment

## Consistency Notes
- All resources use the prefix: ${step1Data.projectPrefix}
- Database name: ${step1Data.resourceNames.database}
- API service: ${step1Data.resourceNames.api}
- Environment variables: ${JSON.stringify(step1Data.envVars)}`

    const dependencies = options.targets.map(t => {
      if (t === 'terraform') return 'terraform'
      if (t === 'aws-cdk') return '@aws-cdk/core'
      if (t === 'kubernetes') return 'kubectl'
      return t
    })
    
    console.log('🎉 All steps complete! Generated', allFiles.length, 'IaC files')
    
    return {
      files: allFiles,
      instructions,
      dependencies,
      success: true,
      steps: {
        namingConventions: step1Data,
        networkInfra: step2Data,
        database: step3Data,
        compute: step4Data,
        monitoring: step5Data
      }
    }
    
  } catch (error: any) {
    console.error('Sequential IaC generation error:', error)
    return {
      files: [],
      instructions: '',
      dependencies: [],
      success: false,
      error: error?.message || 'Sequential IaC generation failed'
    }
  }
}
