import { generateText } from 'ai'

// Sequential code generation with multi-step prompts for better consistency

export interface SequentialCodeGenOptions {
  framework: 'express' | 'fastify' | 'nest' | 'koa'
  language: 'typescript' | 'javascript'
  includeAuth?: boolean
  includeTests?: boolean
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface GeneratedCodeFile {
  path: string
  content: string
  description?: string
}

export interface SequentialCodeGenResult {
  files: GeneratedCodeFile[]
  instructions: string
  dependencies: string[]
  success: boolean
  error?: string
  steps?: {
    namingConventions?: any
    sharedFiles?: any
    models?: any
    services?: any
    routes?: any
  }
}

interface Project {
  id: string
  name: string
  description: string
  schema: any[]
  endpoints?: any[]
  database: { type: string }
}

// STEP 1: Define naming conventions and file structure
const STEP1_NAMING_PROMPT = `You are a senior architect. Define naming conventions for a backend project.

Output ONLY valid JSON with this structure:
{
  "projectName": "string (kebab-case)",
  "baseDirectory": "string (e.g., backend/, api/)",
  "namingConventions": {
    "modelNaming": "PascalCase singular (e.g., User, Product)",
    "tableNaming": "snake_case plural (e.g., users, products)",
    "serviceName": "camelCase with 'Service' suffix (e.g., userService, productService)",
    "routeFileName": "kebab-case (e.g., user.routes.ts)",
    "modelFileName": "kebab-case (e.g., user.model.ts)",
    "dbConnectionName": "string (e.g., db, database)",
    "configFileName": "string (e.g., database.ts)"
  },
  "fileStructure": {
    "models": ["user.model.ts", "product.model.ts"],
    "services": ["user.service.ts", "product.service.ts"],
    "routes": ["user.routes.ts", "product.routes.ts"],
    "config": ["database.ts", "env.ts"],
    "middleware": ["auth.middleware.ts", "error.middleware.ts"],
    "types": ["index.ts"]
  },
  "imports": {
    "dbConnection": "import { db } from '../config/database'",
    "models": "import { User } from '../models/user.model'",
    "services": "import { userService } from '../services/user.service'"
  }
}`

// STEP 2: Generate shared/config files
const STEP2_SHARED_PROMPT = `Generate ONLY the shared configuration files (database connection, types, constants).

These files will be imported by ALL other files, so consistency is CRITICAL.

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string",
      "content": "string (complete, runnable code)",
      "description": "string"
    }
  ]
}`

// STEP 3: Generate models based on naming conventions
const STEP3_MODELS_PROMPT = `Generate database models/entities using the EXACT naming conventions defined earlier.

CRITICAL:
- Use the EXACT model names from step 1
- Import the database connection using the EXACT import statement from step 1
- Every model must follow the same pattern

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string (must match fileStructure.models from step 1)",
      "content": "string (complete, runnable code)",
      "description": "string"
    }
  ]
}`

// STEP 4: Generate services using models
const STEP4_SERVICES_PROMPT = `Generate service layer using the EXACT model names and imports from step 1 and step 3.

CRITICAL:
- Import models using the EXACT import paths from step 1
- Use the EXACT service names from step 1
- Import db connection using the EXACT import from step 1

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string (must match fileStructure.services from step 1)",
      "content": "string (complete, runnable code)",
      "description": "string"
    }
  ]
}`

// STEP 5: Generate routes using services
const STEP5_ROUTES_PROMPT = `Generate API routes using the EXACT service names and imports from previous steps.

CRITICAL:
- Import services using the EXACT import paths from step 1
- Use the EXACT service instance names from step 1
- Match all endpoint paths, methods, and parameters from the API spec

Output ONLY valid JSON:
{
  "files": [
    {
      "path": "string (must match fileStructure.routes from step 1)",
      "content": "string (complete, runnable code)",
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
    temperature: 0.3, // Lower temperature for more consistent output
    maxTokens: 4000,
    topP: 0.9,
  })
  
  return text
}

function cleanJSON(text: string): string {
  let clean = text.trim()
  
  // Remove markdown code blocks
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '')
  
  // Extract JSON
  const jsonStart = clean.indexOf('{')
  const jsonEnd = clean.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd > jsonStart) clean = clean.substring(jsonStart, jsonEnd + 1)
  
  // Fix common issues
  clean = clean.replace(/,\s*([\]}])/g, '$1') // Trailing commas
  clean = clean.replace(/"\s*\n\s*"/g, '",\n"') // Missing commas
  
  // Fix unescaped control characters in strings
  // This regex finds strings and escapes control characters within them
  clean = clean.replace(/"([^"]*)"/g, (match, content) => {
    // Escape backslashes first
    let escaped = content.replace(/\\/g, '\\\\')
    // Escape control characters
    escaped = escaped.replace(/[\x00-\x1F\x7F]/g, (char: string) => {
      const code = char.charCodeAt(0)
      if (code === 0x0A) return '\\n'  // newline
      if (code === 0x0D) return '\\r'  // carriage return
      if (code === 0x09) return '\\t'  // tab
      return '\\u' + ('0000' + code.toString(16)).slice(-4)
    })
    return '"' + escaped + '"'
  })
  
  return clean
}

export async function generateCodeSequential(
  project: Project,
  options: SequentialCodeGenOptions
): Promise<SequentialCodeGenResult> {
  try {
    const { AI_CONFIG } = await import('./groq-client')
    const modelId = options.model || AI_CONFIG.model || 'llama-3.1-8b-instant'
    
    const schemaDetails = JSON.stringify(project.schema, null, 2)
    const endpointsDetails = project.endpoints ? JSON.stringify(project.endpoints, null, 2) : '[]'
    
    console.log('🚀 Step 1: Defining naming conventions...')
    
    // STEP 1: Define naming conventions
    const step1Context = `Project: ${project.name}
Description: ${project.description}
Framework: ${options.framework}
Language: ${options.language}
Database: ${project.database?.type}
Tables: ${project.schema.map((s: any) => s.name).join(', ')}

Define consistent naming conventions for all files and imports.`

    const step1Response = await callAI(STEP1_NAMING_PROMPT, step1Context, modelId)
    let step1Data
    try {
      step1Data = JSON.parse(cleanJSON(step1Response))
    } catch (e) {
      console.error('Step 1 JSON parse error:', e)
      console.error('Raw response:', step1Response.substring(0, 500))
      throw new Error('Step 1: Failed to parse naming conventions. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 1 complete: Naming conventions defined')
    console.log('   Models:', step1Data.fileStructure.models)
    console.log('   Services:', step1Data.fileStructure.services)
    
    // STEP 2: Generate shared files
    console.log('🚀 Step 2: Generating shared configuration files...')
    
    const step2Context = `Project: ${project.name}
Database: ${project.database?.type}
DB Connection Name: ${step1Data.namingConventions.dbConnectionName}
Config File: ${step1Data.namingConventions.configFileName}

Generate database connection file at: ${step1Data.baseDirectory}config/${step1Data.namingConventions.configFileName}

Use these exact export names:
- Export as: ${step1Data.namingConventions.dbConnectionName}

Schema details:
${schemaDetails}`

    const step2Response = await callAI(STEP2_SHARED_PROMPT, step2Context, modelId)
    let step2Data
    try {
      step2Data = JSON.parse(cleanJSON(step2Response))
    } catch (e) {
      console.error('Step 2 JSON parse error:', e)
      console.error('Raw response:', step2Response.substring(0, 500))
      throw new Error('Step 2: Failed to parse shared files. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 2 complete: Config files generated')
    
    // STEP 3: Generate models
    console.log('🚀 Step 3: Generating database models...')
    
    const step3Context = `Naming conventions from step 1:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Database connection import (use EXACTLY this):
${step1Data.imports.dbConnection}

Generate models for these tables:
${schemaDetails}

File names must be: ${step1Data.fileStructure.models.join(', ')}
Model class names: ${project.schema.map((s: any) => s.name.charAt(0).toUpperCase() + s.name.slice(1)).join(', ')}`

    const step3Response = await callAI(STEP3_MODELS_PROMPT, step3Context, modelId)
    let step3Data
    try {
      step3Data = JSON.parse(cleanJSON(step3Response))
    } catch (e) {
      console.error('Step 3 JSON parse error:', e)
      console.error('Raw response:', step3Response.substring(0, 500))
      throw new Error('Step 3: Failed to parse models. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 3 complete: Models generated')
    console.log('   Files:', step3Data.files.map((f: any) => f.path))
    
    // STEP 4: Generate services
    console.log('🚀 Step 4: Generating service layer...')
    
    const step4Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Database connection import (use EXACTLY this):
${step1Data.imports.dbConnection}

Models generated (use EXACTLY these imports):
${step3Data.files.map((f: any) => `import { ${f.path.split('/').pop()?.split('.')[0].charAt(0).toUpperCase() + f.path.split('/').pop()?.split('.')[0].slice(1)} } from '../models/${f.path.split('/').pop()}'`).join('\n')}

Generate services for: ${step1Data.fileStructure.services.join(', ')}`

    const step4Response = await callAI(STEP4_SERVICES_PROMPT, step4Context, modelId)
    let step4Data
    try {
      step4Data = JSON.parse(cleanJSON(step4Response))
    } catch (e) {
      console.error('Step 4 JSON parse error:', e)
      console.error('Raw response:', step4Response.substring(0, 500))
      throw new Error('Step 4: Failed to parse services. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 4 complete: Services generated')
    
    // STEP 5: Generate routes
    console.log('🚀 Step 5: Generating API routes...')
    
    const step5Context = `Naming conventions:
${JSON.stringify(step1Data.namingConventions, null, 2)}

Services generated (use EXACTLY these imports):
${step4Data.files.map((f: any) => `import { ${f.path.split('/').pop()?.split('.')[0]}Service } from '../services/${f.path.split('/').pop()}'`).join('\n')}

API Endpoints to implement:
${endpointsDetails}

Generate routes for: ${step1Data.fileStructure.routes.join(', ')}`

    const step5Response = await callAI(STEP5_ROUTES_PROMPT, step5Context, modelId)
    let step5Data
    try {
      step5Data = JSON.parse(cleanJSON(step5Response))
    } catch (e) {
      console.error('Step 5 JSON parse error:', e)
      console.error('Raw response:', step5Response.substring(0, 500))
      throw new Error('Step 5: Failed to parse routes. AI returned invalid JSON.')
    }
    
    console.log('✅ Step 5 complete: Routes generated')
    
    // Combine all files
    const allFiles = [
      ...step2Data.files,
      ...step3Data.files,
      ...step4Data.files,
      ...step5Data.files
    ]
    
    // Generate final instructions
    const instructions = `# ${project.name} - Generated Backend

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   npm install ${options.framework} ${project.database.type === 'PostgreSQL' ? 'pg typeorm' : project.database.type === 'MongoDB' ? 'mongoose' : 'mysql2 typeorm'}
   \`\`\`

2. Configure environment variables:
   Create a .env file with:
   \`\`\`
   DATABASE_URL=your_database_url
   PORT=3000
   \`\`\`

3. Run the application:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure
${JSON.stringify(step1Data.fileStructure, null, 2)}

## Naming Conventions Used
${JSON.stringify(step1Data.namingConventions, null, 2)}`

    const dependencies = [
      options.framework,
      project.database.type === 'PostgreSQL' ? 'pg' : project.database.type === 'MongoDB' ? 'mongoose' : 'mysql2',
      'dotenv',
      options.language === 'typescript' ? '@types/node' : null
    ].filter(Boolean) as string[]
    
    console.log('🎉 All steps complete! Generated', allFiles.length, 'files')
    
    return {
      files: allFiles,
      instructions,
      dependencies,
      success: true,
      steps: {
        namingConventions: step1Data,
        sharedFiles: step2Data,
        models: step3Data,
        services: step4Data,
        routes: step5Data
      }
    }
    
  } catch (error: any) {
    console.error('Sequential code generation error:', error)
    return {
      files: [],
      instructions: '',
      dependencies: [],
      success: false,
      error: error?.message || 'Sequential code generation failed'
    }
  }
}
