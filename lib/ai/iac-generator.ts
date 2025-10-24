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

const SYSTEM_PROMPT = `You are a senior DevOps/SRE engineer. Generate production-ready Infrastructure-as-Code (IaC) that EXACTLY matches the provided database schemas, architecture, and API endpoints.

CRITICAL JSON FORMATTING:
- Output ONLY valid, parseable JSON - NO markdown code blocks, NO commentary
- DO NOT use escaped newlines (\\n) for formatting between JSON properties
- DO NOT add literal backslash-n (\\n) between array items or object properties
- Keep JSON compact - use actual newlines and whitespace for formatting, not escape sequences
- The "content" field values SHOULD contain properly escaped newlines (\\n) for the actual IaC code
- But the JSON structure itself should NOT have escaped newlines
- Include complete, runnable IaC with file paths and content.
- Infrastructure must support ALL tables, fields, indexes, and constraints from the schemas.
- Infrastructure must match the architecture components (nodes, edges, services).
- Use secure defaults, least-privilege, and production-ready configurations.
- Include environment-specific guidance and commands.
- Respect the requested targets (Terraform, AWS CDK TS, Kubernetes/Helm, Docker Compose, Azure Bicep, GCP TF).

CONSISTENT NAMING CONVENTIONS:
- Resource naming: kebab-case with project prefix (myapp-api-server, myapp-db-instance)
- Terraform: snake_case for resources and variables (api_server, db_instance, vpc_cidr)
- AWS CDK: PascalCase for constructs (ApiServer, DatabaseInstance, VpcStack)
- Kubernetes: kebab-case for all resource names (api-deployment, db-service, app-configmap)
- Docker Compose: snake_case for service names (api_server, postgres_db, redis_cache)
- Environment variables: SCREAMING_SNAKE_CASE (DATABASE_URL, API_PORT, NODE_ENV)
- Tags/Labels: use consistent keys (Environment, Project, ManagedBy, Component)
- Use same naming pattern for related resources across all IaC files
- File naming: descriptive kebab-case (main.tf, api-stack.ts, deployment.yaml, docker-compose.yml)

CROSS-FILE CONSISTENCY (CRITICAL):
- If you reference a resource name, use the EXACT SAME name in all files (e.g., "myapp-database" everywhere)
- If you reference a module/stack, use the EXACT SAME import and constructor name across files
- Variable references must be consistent (e.g., if you use \${var.project_name} in one .tf file, use it everywhere)
- Output names must match input variable names when chaining modules/stacks
- Kubernetes labels/selectors must match EXACTLY across deployment, service, and ingress files
- Docker Compose service names must match EXACTLY in depends_on, networks, and volumes
- Environment variable names must be IDENTICAL across all config files (.env.example, k8s configmap, compose file)
- If a database is called "postgres_db" in one file, NEVER call it "db" or "database" in another file

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
  const schemaArray = Array.isArray(project.schema) ? project.schema : []
  const targetsStr = options.targets.join(', ')
  const cloud = options.cloud || 'aws'
  const env = options.environment || 'development'
  
  // Serialize complete details
  const schemaDetails = JSON.stringify(schemaArray, null, 2)
  const endpointsDetails = project.endpoints ? JSON.stringify(project.endpoints, null, 2) : '[]'
  const architectureDetails = project.architecture ? JSON.stringify(project.architecture, null, 2) : '{}'
  const decisionsDetails = project.decisions ? JSON.stringify(project.decisions, null, 2) : '{}'

  return `Project overview:
- Name: ${project.name}
- Description: ${project.description}
- Database: ${project.database?.type}
- Targets: ${targetsStr}
- Primary cloud: ${cloud}
- Environment: ${env}

=== COMPLETE DATABASE SCHEMAS ===
Infrastructure must support these exact tables, fields, indexes, and constraints:
${schemaDetails}

=== COMPLETE API ENDPOINTS ===
Infrastructure must support these exact API endpoints:
${endpointsDetails}

=== ARCHITECTURE COMPONENTS ===
Infrastructure must match this architecture (nodes = services/components, edges = connections):
${architectureDetails}

=== SYSTEM DECISIONS ===
Use these technology choices and decisions:
${decisionsDetails}

Requirements:
- Generate best-practice IaC for the requested targets, wiring ALL components appropriately.
- Infrastructure must support the EXACT database schema (correct DB instance size, storage for data volume).
- Infrastructure must support ALL architecture components (compute, storage, networking per nodes/edges).
- For AWS: include VPC, security groups, ECR or S3, ECS/EKS/Lambda based on architecture, IAM roles, RDS/DynamoDB matching DB type.
- For self-host: Docker Compose with volumes, healthchecks, .env templates, and proper service dependencies.
- For Kubernetes: deployment, service, ingress, configmaps, secrets, and persistent volumes matching architecture.
- Provide .env.example with placeholders for all required environment variables.
- Include database initialization scripts/migrations compatible with the schema.
- Ensure file paths are realistic within infra/ directory (e.g., infra/terraform/main.tf, infra/cdk/bin/app.ts).
- Include outputs that the app will consume (connection strings, endpoints, ARNs) in instructions.
- Size resources appropriately for the number of tables, expected load from endpoints, and architecture scale.

EXAMPLE OF CONSISTENT CROSS-FILE NAMING:
Kubernetes example:
// deployment.yaml
metadata:
  name: myapp-api
  labels:
    app: myapp-api  # ← Define once

// service.yaml
spec:
  selector:
    app: myapp-api  # ← EXACT SAME label

// ingress.yaml
backend:
  service:
    name: myapp-api  # ← EXACT SAME name

Docker Compose example:
// docker-compose.yml
services:
  api_server:  # ← Define once
    ...
  postgres_db:  # ← Define once
    ...
  redis_cache:
    depends_on:
      - postgres_db  # ← EXACT SAME name
    environment:
      DB_HOST: postgres_db  # ← EXACT SAME name

NOTICE: Names are used consistently across ALL IaC files.
`
}

export async function generateIaC(project: Project, options: IaCOptions): Promise<GeneratedIaCResult> {
  try {
    // Dynamically import Groq client to avoid crashing the module when env is missing
    const { groq, AI_CONFIG } = await import('./groq-client')
    const preferred = options.model || AI_CONFIG.model
    const fallbacks = [
      preferred,
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'gemma2-9b-it'
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

    console.log('\n========== RAW AI RESPONSE ==========');
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Last 200 chars:', text.substring(Math.max(0, text.length - 200)));
    console.log('=====================================\n');
    
    // Write full response to temp file for debugging
    try {
      const fs = await import('fs');
      const path = await import('path');
      const tmpPath = path.join(process.cwd(), '.iac-debug.json');
      fs.writeFileSync(tmpPath, text, 'utf8');
      console.log(`\u{1F4BE} Full AI response written to: ${tmpPath}`);
    } catch (e) {
      console.error('Could not write debug file:', e);
    }

    let clean = text.trim()
    
    // Remove markdown code blocks
    clean = clean.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseError) {
      console.error('\n========== JSON PARSE ERROR ==========');
      console.error('Parse error:', parseError);
      console.error('\nCleaned JSON (first 800 chars):', clean.substring(0, 800));
      console.error('\nCleaned JSON (last 300 chars):', clean.substring(Math.max(0, clean.length - 300)));
      console.error('\nTotal length:', clean.length);
      console.error('======================================\n');
      
      // Try to find where the JSON is malformed
      const errorMatch = parseError instanceof Error && parseError.message.match(/position (\d+)/);
      if (errorMatch) {
        const pos = parseInt(errorMatch[1]);
        console.error('Error position context:', clean.substring(Math.max(0, pos - 100), Math.min(clean.length, pos + 100)));
      }
      
      throw new Error(`AI returned invalid JSON format. ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

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
