import { generateText } from 'ai'

// Define server-safe types (avoid importing client modules)
interface FieldSchema { id: string; name: string; type: string }
interface TableSchema { id: string; name: string; description?: string; fields: FieldSchema[] }
interface DatabaseConfig { type: string }
interface Project {
  id: string
  name: string
  description: string
  status: string
  createdAt: string | Date
  updatedAt: string | Date
  schema: TableSchema[]
  endpoints?: any[]
  database: DatabaseConfig
}

export interface CodeGenOptions {
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

export interface GeneratedCodeResult {
  files: GeneratedCodeFile[]
  instructions: string
  dependencies: string[]
  success: boolean
  error?: string
}

const SYSTEM_PROMPT = `You are a principal backend engineer. Generate production-ready backend code.

CRITICAL:
- Output ONLY valid JSON, no markdown.
- Include multiple files with realistic paths and content (no placeholders).
- Use secure, modern patterns and TypeScript types when requested.
- Provide a clear instructions string (install, build, run, env vars).
- Provide a dependencies list (npm package names).

JSON to return:
{
  "files": [
    { "path": "string", "content": "string", "description": "string" }
  ],
  "instructions": "string",
  "dependencies": ["string"],
  "success": true
}

Guidance:
- Project structure under backend/ or api/ depending on framework choice.
- Include an entrypoint, routing, validation, error handling, and configuration.
- Respect includeAuth (JWT middleware, login routes) and includeTests (Jest or framework tests).
- Wire database access for the project's selected DB (mock if not specified, but structure it cleanly).
- Derive basic CRUD routes from provided schema and summarize endpoints.
- Reference environment variables in code; do not include secrets.
`

function buildUserPrompt(project: Project, options: CodeGenOptions): string {
  const { framework, language, includeAuth, includeTests } = options
  const schemas = project.schema.map(t => ({ name: t.name, fields: t.fields.map(f => ({ name: f.name, type: f.type })) }))
  const endpointsApprox = project.endpoints?.length || project.schema.length * 4

  return `Project: ${project.name}
Description: ${project.description}
Framework: ${framework}
Language: ${language}
IncludeAuth: ${!!includeAuth}
IncludeTests: ${!!includeTests}
Database: ${project.database?.type}
ApproxEndpoints: ${endpointsApprox}

Schema tables (name and field types): ${JSON.stringify(schemas).slice(0, 6000)}

Generate a complete, minimal-yet-production-ready implementation consistent with the JSON schema above.`
}

export async function generateCode(project: Project, options: CodeGenOptions): Promise<GeneratedCodeResult> {
  try {
    // Dynamically import Groq client to safely handle missing env at runtime
    const { groq, AI_CONFIG } = await import('./groq-client')
    const preferred = options.model || AI_CONFIG.model
    const fallbacks = [
      preferred,
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768'
    ]

    let text = ''
    let lastError: any = null
    for (const modelId of fallbacks) {
      try {
        const r = await generateText({
          model: groq(modelId),
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(project, options) }
          ],
          temperature: options.temperature ?? 0.35,
          maxTokens: options.maxTokens ?? 6000,
          topP: 0.9,
        })
        text = r.text
        if (text) break
      } catch (e: any) {
        lastError = e
        continue
      }
    }

    if (!text) {
      throw new Error(lastError?.message || 'All models failed')
    }

    let clean = text.trim()
    if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '')
    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd > jsonStart) clean = clean.substring(jsonStart, jsonEnd + 1)

    // Repair template literals in JSON-like output
    const repairTemplateLiterals = (s: string) => s.replace(/:\s*`([\s\S]*?)`/g, (_m, p1) => {
      const escaped = String(p1).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")
      return ': "' + escaped + '"'
    })
    clean = repairTemplateLiterals(clean)

    const parsed = JSON.parse(clean)
    if (!parsed || !Array.isArray(parsed.files) || typeof parsed.instructions !== 'string') {
      throw new Error('Invalid code generation response format')
    }

    return {
      files: parsed.files,
      instructions: parsed.instructions,
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
      success: true
    }
  } catch (error: any) {
    return {
      files: [],
      instructions: '',
      dependencies: [],
      success: false,
      error: error?.message || 'Code generation failed'
    }
  }
}
