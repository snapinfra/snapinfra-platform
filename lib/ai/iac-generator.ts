import { generateText } from 'ai'

// Define server-safe types to avoid importing client modules
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
  architecture?: { nodes?: any[]; edges?: any[] }
  decisions?: { decisions: any[] }
}

export interface IaCOptions {
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

export interface GeneratedIaCResult {
  files: GeneratedIaCFile[]
  instructions: string
  dependencies: string[]
  success: boolean
  error?: string
}

const SYSTEM_PROMPT = `You are a senior DevOps/SRE engineer. Generate production-ready Infrastructure-as-Code (IaC) and complete self-host/cloud setup instructions.

CRITICAL:
- Output ONLY valid JSON, no markdown, no commentary.
- Include complete, runnable IaC with file paths and content.
- Use secure defaults, least-privilege, and production-ready configurations.
- Include environment-specific guidance and commands.
- Respect the requested targets (Terraform, AWS CDK TS, Kubernetes/Helm, Docker Compose, Azure Bicep, GCP TF).

JSON schema to return:
{
  "files": [
    { "path": "string", "content": "string", "description": "string" }
  ],
  "instructions": "string with step-by-step setup across targets including CLI commands and env variables",
  "dependencies": ["string"],
  "success": true
}

Terraform guidelines:
- Providers pinned with version constraints
- Separate variables.tf, outputs.tf, and modules when appropriate
- Remote state guidance (S3 + DynamoDB for AWS, GCS for GCP, AzureRM for Azure)
- Tags/labels and naming conventions

AWS CDK (TypeScript) guidelines:
- Stacks composed by concern (network, data, app)
- Secure defaults (VPC with isolated subnets where applicable)
- Least-privilege IAM policies
- Clear outputs to wire into app .env

Kubernetes/Helm guidelines:
- Separate deployment, service, ingress, configmap/secret
- Resource requests/limits, liveness/readiness probes
- Optional horizontal pod autoscaler (HPA)

Docker Compose guidelines:
- Use healthchecks, restart policies, named volumes, .env references

Instructions must include:
- Prereqs (CLIs, access), environment bootstrap, init/apply commands
- Secrets management via environment variables or secret stores (do not print secrets)
- Post-deploy validation commands
`

function buildUserPrompt(project: Project, options: IaCOptions): string {
  const schemaSummary = `${project.schema.length} tables, ${project.schema.reduce((a, t) => a + t.fields.length, 0)} fields`
  const endpointsApprox = project.endpoints?.length || project.schema.length * 4
  const architectureNote = project.architecture ? `Architecture nodes: ${project.architecture.nodes?.length || 0}, edges: ${project.architecture.edges?.length || 0}.` : 'No explicit architecture graph provided.'
  const toolsNote = project.decisions ? `Tools selected count: ${project.decisions.decisions.length}.` : 'No explicit tool selections captured.'
  const targetsStr = options.targets.join(', ')
  const cloud = options.cloud || 'aws'
  const env = options.environment || 'development'

  return `Project overview:
- Name: ${project.name}
- Description: ${project.description}
- Database: ${project.database?.type}
- Schema: ${schemaSummary}
- Endpoints (approx): ${endpointsApprox}
- ${architectureNote}
- ${toolsNote}

Targets: ${targetsStr}
Primary cloud: ${cloud}
Environment: ${env}

Requirements:
- Generate best-practice IaC for the requested targets, wiring the app and database appropriately.
- For AWS: include VPC, security groups, ECR or S3 where relevant, ECS or EKS if Kubernetes is chosen, IAM roles, and parameterize regions.
- For self-host: Docker Compose with volumes, healthchecks, and .env templates.
- For Kubernetes: include deployment, service (ClusterIP), ingress examples, configmaps, and secrets references.
- Provide an .env.example for the application side including placeholders for secrets and cloud outputs.
- Include stateful storage recommendations for the DB type ${project.database?.type} if self-hosted.
- Ensure file paths are realistic within a top-level infra/ directory (e.g., infra/terraform/main.tf, infra/cdk/bin/app.ts, infra/k8s/deployment.yaml, infra/compose/docker-compose.yml).
- Include outputs that the app will consume (URIs, ARNs, endpoints) and list them in instructions.
`
}

export async function generateIaC(project: Project, options: IaCOptions): Promise<GeneratedIaCResult> {
  try {
    // Dynamically import Groq client to avoid crashing the module when env is missing
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
          temperature: options.temperature ?? 0.4,
          maxTokens: options.maxTokens ?? 6000,
          topP: 0.9,
        })
        text = r.text
        if (text) break
      } catch (e: any) {
        lastError = e
        // Continue to next model if current is deprecated or unavailable
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

    // Repair common model mistakes: template literals for values (content: `...`)
    const repairTemplateLiterals = (s: string) => s.replace(/:\s*`([\s\S]*?)`/g, (_m, p1) => {
      const escaped = String(p1).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")
      return ': "' + escaped + '"'
    })
    clean = repairTemplateLiterals(clean)

    const parsed = JSON.parse(clean)

    // Basic validation
    if (!parsed || !Array.isArray(parsed.files) || typeof parsed.instructions !== 'string') {
      throw new Error('Invalid IaC response structure')
    }

    return {
      files: parsed.files,
      instructions: parsed.instructions,
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
      success: true,
    }
  } catch (error: any) {
    return {
      files: [],
      instructions: '',
      dependencies: [],
      success: false,
      error: error?.message || 'IaC generation failed (check GROQ_API_KEY and server logs)',
    }
  }
}
