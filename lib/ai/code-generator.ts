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

const SYSTEM_PROMPT = `You are a principal backend engineer. Generate production-ready backend code that EXACTLY matches the provided database schemas and API endpoints.

CRITICAL:
- Output ONLY valid JSON, no markdown.
- Generate code that implements EVERY table, field, index, and constraint from the provided schemas.
- Generate code that implements EVERY API endpoint exactly as specified.
- Include multiple files with realistic paths and complete, runnable content (no placeholders).
- Use secure, modern patterns and TypeScript types when requested.
- Provide a clear instructions string (install, build, run, env vars).
- Provide a dependencies list (npm package names).

CODE STYLE & CONSISTENCY RULES:
- Use consistent import style throughout (ESM: import/export, not require/module.exports)
- Group imports: external packages first, then internal modules, then types
- Use named exports consistently (avoid default exports unless necessary)
- Variable naming: camelCase for variables/functions, PascalCase for classes/types/interfaces
- Database models/entities: PascalCase singular (User, Product, Order)
- Database table names: snake_case plural (users, products, orders)
- Route handlers: descriptive names (getUserById, createProduct, updateOrder)
- File naming: kebab-case for files (user.model.ts, auth.middleware.ts, product.routes.ts)
- Environment variables: SCREAMING_SNAKE_CASE (DATABASE_URL, JWT_SECRET, PORT)
- Constants: SCREAMING_SNAKE_CASE (MAX_RETRIES, DEFAULT_PAGE_SIZE)
- Use consistent error handling pattern across all files
- Use consistent validation approach (same validator library throughout)
- Use consistent async/await (no mixing with .then())

CROSS-FILE CONSISTENCY (CRITICAL):
- If you reference a model/entity, use the EXACT SAME name in all files (e.g., "User" everywhere, never "UserModel" in one file and "User" in another)
- If you import a database connection, use the EXACT SAME import path and variable name in all files
- If you create a type/interface, export it from one central location and import it consistently
- Use the EXACT SAME function names when calling across files (e.g., always "createUser", never mix with "addUser" or "insertUser")
- Use the EXACT SAME service/repository instance names across routes (e.g., always "userService", never mix with "UserService" or "users")
- Share common utilities (error handlers, validators, formatters) - don't recreate them per file
- Define database connection/config ONCE and import it everywhere with same variable name
- Example: if src/config/database.ts exports "db", always import as "db", never rename to "database" or "connection"

JSON to return:
{
  "files": [
    { "path": "string", "content": "string", "description": "string" }
  ],
  "instructions": "string",
  "dependencies": ["string"],
  "success": true
}

GENERATION STRATEGY FOR CONSISTENCY:
1. First, decide on ALL naming conventions (model names, service names, function names, import paths)
2. Create a mental map of all cross-file references (which files import from which)
3. Generate shared/config files first (database.ts, types.ts, constants.ts)
4. Then generate models using names defined in step 1
5. Then generate services/repositories using model names from step 4
6. Finally generate routes using service names from step 5
7. Double-check that every import uses the exact names decided in step 1

Guidance:
- Project structure under backend/ or api/ depending on framework choice.
- Include an entrypoint, routing, validation, error handling, and configuration.
- Respect includeAuth (JWT middleware, login routes) and includeTests (Jest or framework tests).
- Wire database access with the EXACT schemas provided (database models, migrations, ORM config).
- Implement ALL API endpoints exactly as specified in the endpoints list.
- Generate database migrations that create tables with all fields, types, indexes, and constraints.
- Reference environment variables in code; do not include secrets.
- Match field types precisely (varchar with length, decimal with precision/scale, etc.).
`

function buildUserPrompt(project: Project, options: CodeGenOptions): string {
  const { framework, language, includeAuth, includeTests } = options
  const schemaArray = Array.isArray(project.schema) ? project.schema : []
  
  // Serialize complete schema details
  const schemaDetails = JSON.stringify(schemaArray, null, 2)
  const endpointsDetails = project.endpoints ? JSON.stringify(project.endpoints, null, 2) : '[]'

  const frameworkImportPatterns = {
    express: 'import express, { Request, Response, NextFunction } from \'express\'\nimport { Router } from \'express\'',
    fastify: 'import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from \'fastify\'\nimport { RouteOptions } from \'fastify\'',
    nest: 'import { Controller, Get, Post, Put, Delete, Body, Param } from \'@nestjs/common\'\nimport { Injectable } from \'@nestjs/common\'',
    koa: 'import Koa, { Context, Next } from \'koa\'\nimport Router from \'@koa/router\''
  }

  return `Project: ${project.name}
Description: ${project.description}
Framework: ${framework}
Language: ${language}
IncludeAuth: ${!!includeAuth}
IncludeTests: ${!!includeTests}
Database: ${project.database?.type}

FRAMEWORK-SPECIFIC IMPORT PATTERN:
Use this exact import pattern throughout the codebase:
${frameworkImportPatterns[framework]}

DATABASE ORM PATTERNS:
For ${project.database?.type || 'PostgreSQL'}, use consistent ORM imports:
- PostgreSQL/MySQL: import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
- MongoDB: import { Schema, model, Document } from 'mongoose'
- Use same ORM throughout entire codebase
- Define base entity/model with common fields (id, createdAt, updatedAt, deletedAt)
- Extend base for all models to ensure consistency

=== COMPLETE DATABASE SCHEMAS ===
Generate code that implements EVERY field, index, and constraint from these schemas:
${schemaDetails}

=== COMPLETE API ENDPOINTS ===
Generate code that implements EVERY endpoint exactly as specified:
${endpointsDetails}

PROJECT STRUCTURE:
Use this consistent directory structure:
- src/
  - models/ (or entities/) - database models
  - routes/ (or controllers/) - API route handlers
  - middleware/ - authentication, validation, error handling
  - services/ - business logic layer
  - types/ (or interfaces/) - TypeScript types
  - utils/ - helper functions
  - config/ - configuration files
  - migrations/ - database migrations
- tests/ - test files mirroring src structure
- Use index.ts files for clean exports from each directory

IMPORTANT:
- Implement database models/entities for ALL tables with ALL fields
- Create migrations with proper field types, lengths, precision, and scale
- Add all indexes (btree, unique, composite, etc.) as specified
- Implement all constraints (foreign keys, checks, unique)
- Generate route handlers for ALL endpoints with proper HTTP methods
- Use the exact paths, methods, and request/response formats specified
- Include validation based on field constraints
- Generate a complete, production-ready implementation
- Maintain consistency across ALL generated files

EXAMPLE OF CONSISTENT CROSS-FILE USAGE:
// src/config/database.ts
export const db = createConnection({ ... });

// src/models/user.model.ts
import { db } from '../config/database';
export class User { ... }

// src/services/user.service.ts
import { db } from '../config/database';  // ← SAME import path and name
import { User } from '../models/user.model';  // ← SAME model name
export const userService = { ... };

// src/routes/user.routes.ts
import { userService } from '../services/user.service';  // ← SAME service name
import { User } from '../models/user.model';  // ← SAME model name

NOTICE: "db", "User", "userService" are used consistently across ALL files.`
}

export async function generateCode(project: Project, options: CodeGenOptions): Promise<GeneratedCodeResult> {
  try {
    // Dynamically import Groq client to safely handle missing env at runtime
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
    
    // Additional repairs for common JSON issues
    clean = clean.replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
    clean = clean.replace(/"\s*\n\s*"/g, '",\n"') // Fix missing commas

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseError) {
      console.error('Code Gen JSON Parse Error:', parseError)
      console.error('Cleaned JSON (first 500 chars):', clean.substring(0, 500))
      throw new Error(`AI returned invalid JSON format. ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
    
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
