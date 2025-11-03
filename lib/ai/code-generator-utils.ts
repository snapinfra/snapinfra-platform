// ============================================================================
// CODE GENERATOR UTILITIES - STABLE FUNCTIONS & CONSTANTS
// ============================================================================
// This file contains functions and constants that NEVER change
// Used by code-generator.ts

export interface Field {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  references?: string;
}

export interface Table {
  name: string;
  fields: Field[];
}

export interface DatabaseConfig {
  type: string;
  host?: string;
  port?: number;
  name?: string;
}

export interface Project {
  name: string;
  description: string;
  schema: Table[];
  database?: DatabaseConfig;
}

export interface CodeGenOptions {
  framework: 'express' | 'fastify' | 'koa';
  language: 'javascript' | 'typescript';
  includeAuth: boolean;
  includeTests: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ModuleSpec {
  type: string;
  priority: number;
  dependencies: string[];
  tables?: string[];
  description: string;
  requiredFiles: string[];
  minFiles?: number;
  criticalFiles?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  description?: string;
  exports?: string[];
}

export interface FileContext {
  path: string;
  folder: string;
  filename: string;
  exports?: string[];
}

export interface GenerationContext {
  project: Project;
  options: CodeGenOptions;
  generatedFiles: Map<string, GeneratedFile>;
  fileRegistry: Map<string, FileContext>;
  moduleResults: Map<string, ModuleResult>;
  allDependencies: Record<string, string>;
  allDevDependencies: Record<string, string>;
  tableNames: string[];
  failedAttempts: Map<string, number>;
}

export interface ParsedResponse {
  files: GeneratedFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  success: boolean;
  error?: string;
}

export interface ModuleResult {
  type: string;
  files: GeneratedFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  success: boolean;
  validated: boolean;
  attempt: number;
  error?: string;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
  instructions: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  success: boolean;
  error?: string;
}

export type ProgressCallback = (
  moduleType: string,
  current: number,
  total: number
) => void;

// ============================================================================
// ENHANCED FUNCTION TRACKING FOR ACCURATE IMPORTS/EXPORTS
// ============================================================================

// Extended types
export interface FunctionInfo {
  name: string;
  type: 'function' | 'const' | 'factory';
  async: boolean;
  params?: string[];
  line?: number;
}

export interface EnhancedFileContext {
  path: string;
  module: string;
  filename: string;
  type: 'model' | 'service' | 'handler' | 'route' | 'util' | 'middleware' | 'config';
  exports: string[];
  functions: FunctionInfo[];
  imports: Array<{
    from: string;
    names: string[];
  }>;
}

export interface RegistryStats {
  totalFiles: number;
  totalFunctions: number;
  totalExports: number;
  factoryCount: number;
  handlerCount: number;
  byModule: Map<string, number>;
}

// ============================================================================
// ENHANCED EXPORT EXTRACTION
// ============================================================================

/**
 * Extract detailed function information from code
 */
export function extractFunctions(content: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const lines = content.split('\n');

  // Patterns to match
  const patterns = [
    // function declarations: function myFunc() {}
    /function\s+(async\s+)?(\w+)\s*\(([^)]*)\)/g,
    
    // const with arrow function: const myFunc = () => {}
    /const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/g,
    
    // const with function: const myFunc = function() {}
    /const\s+(\w+)\s*=\s*(async\s+)?function\s*\([^)]*\)/g,
    
    // factory pattern: const createModel = () => { return {} }
    /const\s+(create\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,
  ];

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      // Reset regex lastIndex for each line
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const isAsync = line.includes('async');
        const name = match[2] || match[1];
        
        if (name && !functions.find(f => f.name === name)) {
          const paramsMatch = line.match(/\(([^)]*)\)/);
          const params = paramsMatch ? 
            paramsMatch[1].split(',').map(p => p.trim()).filter(Boolean) : 
            [];

          functions.push({
            name,
            type: name.startsWith('create') ? 'factory' : 
                  line.includes('const') ? 'const' : 'function',
            async: isAsync,
            params: params.length > 0 ? params : undefined,
            line: index + 1
          });
        }
      }
    });
  });

  return functions;
}

/**
 * Enhanced export extraction with function details
 */
export function extractExportsWithFunctions(
  content: string, 
  filePath: string
): { exports: string[]; functions: FunctionInfo[] } {
  const exports: string[] = [];
  const functions = extractFunctions(content);

  // Extract from module.exports = { ... }
  const exportsMatch = content.match(/module\.exports\s*=\s*{([^}]+)}/s);
  if (exportsMatch) {
    const exportsContent = exportsMatch[1];
    const exportNames = exportsContent
      .split(',')
      .map(e => e.trim())
      .filter(e => e && !e.startsWith('//'))
      .map(e => {
        const colonIndex = e.indexOf(':');
        return colonIndex > 0 ? e.substring(0, colonIndex).trim() : e;
      });
    
    exports.push(...exportNames);
  }

  return { exports, functions };
}

// ============================================================================
// IMPORT EXTRACTION
// ============================================================================

/**
 * Extract all imports from a file
 */
export function extractImports(content: string): Array<{ from: string; names: string[] }> {
  const imports: Array<{ from: string; names: string[] }> = [];
  
  const requirePattern = /const\s+{\s*([^}]+)\s*}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  const matches = content.matchAll(requirePattern);
  for (const match of matches) {
    const names = match[1]
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);
    
    const from = match[2];
    
    imports.push({ from, names });
  }

  return imports;
}

// ============================================================================
// FUNCTION REGISTRY
// ============================================================================

export class FunctionRegistry {
  private registry = new Map<string, EnhancedFileContext>();

  /**
   * Register a file with its functions
   */
  register(filePath: string, content: string): EnhancedFileContext {
    const { exports, functions } = extractExportsWithFunctions(content, filePath);
    const imports = extractImports(content);

    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    const module = parts[parts.length - 2] || 'root';
    
    let type: EnhancedFileContext['type'] = 'util';
    if (filePath.includes('/models/')) type = 'model';
    else if (filePath.includes('/services/')) type = 'service';
    else if (filePath.includes('/handlers/')) type = 'handler';
    else if (filePath.includes('/routes/')) type = 'route';
    else if (filePath.includes('/middleware/')) type = 'middleware';
    else if (filePath.includes('/config/')) type = 'config';

    const context: EnhancedFileContext = {
      path: filePath,
      module,
      filename,
      type,
      exports,
      functions,
      imports
    };

    this.registry.set(filePath, context);
    return context;
  }

  /**
   * Get file context
   */
  get(filePath: string): EnhancedFileContext | undefined {
    return this.registry.get(filePath);
  }

  /**
   * Find function across all files
   */
  findFunction(functionName: string): Array<{ file: string; info: FunctionInfo }> {
    const results: Array<{ file: string; info: FunctionInfo }> = [];

    for (const [filePath, context] of this.registry) {
      const func = context.functions.find(f => f.name === functionName);
      if (func) {
        results.push({ file: filePath, info: func });
      }
    }

    return results;
  }

  /**
   * Validate imports for a file
   */
  validateImports(filePath: string): Array<{ issue: string; import: string; from: string }> {
    const issues: Array<{ issue: string; import: string; from: string }> = [];
    const context = this.registry.get(filePath);
    
    if (!context) return issues;

    for (const imp of context.imports) {
      // Skip validation for npm packages (non-relative imports)
      if (!imp.from.startsWith('.') && !imp.from.startsWith('/')) {
        continue;
      }

      const importedFilePath = this.resolvePath(filePath, imp.from);
      const importedContext = this.registry.get(importedFilePath);

      if (!importedContext) {
        issues.push({
          issue: 'File not found',
          import: imp.names.join(', '),
          from: imp.from
        });
        continue;
      }

      for (const name of imp.names) {
        if (!importedContext.exports.includes(name)) {
          issues.push({
            issue: `Function '${name}' not exported`,
            import: name,
            from: imp.from
          });
        }
      }
    }

    return issues;
  }

  /**
   * Get import suggestions for a function
   */
  getSuggestedImports(functionName: string): Array<{ path: string; export: string }> {
    const suggestions: Array<{ path: string; export: string }> = [];

    for (const [filePath, context] of this.registry) {
      if (context.exports.includes(functionName)) {
        suggestions.push({
          path: filePath,
          export: functionName
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate import suggestions as formatted strings
   */
  generateImportSuggestions(filePath: string): string[] {
    const suggestions: string[] = [];
    const context = this.registry.get(filePath);
    
    if (!context) return suggestions;

    for (const imp of context.imports) {
      for (const name of imp.names) {
        const available = this.getSuggestedImports(name);
        if (available.length > 0) {
          available.forEach(({ path }) => {
            const relativePath = this.getRelativePath(filePath, path);
            suggestions.push(`   💡 Try: const { ${name} } = require('${relativePath}');`);
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate import statement
   */
  generateImport(currentFile: string, targetFile: string, functionNames: string[]): string {
    const relativePath = this.getRelativePath(currentFile, targetFile);
    return `const { ${functionNames.join(', ')} } = require('${relativePath}');`;
  }

  /**
   * Get all functions by type
   */
  getFunctionsByType(type: FunctionInfo['type']): Map<string, FunctionInfo[]> {
    const result = new Map<string, FunctionInfo[]>();

    for (const [filePath, context] of this.registry) {
      const funcs = context.functions.filter(f => f.type === type);
      if (funcs.length > 0) {
        result.set(filePath, funcs);
      }
    }

    return result;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    let totalFunctions = 0;
    let totalExports = 0;
    let factoryCount = 0;
    let handlerCount = 0;
    const byModule = new Map<string, number>();

    for (const context of this.registry.values()) {
      totalFunctions += context.functions.length;
      totalExports += context.exports.length;
      
      factoryCount += context.functions.filter(f => f.type === 'factory').length;
      handlerCount += context.functions.filter(f => f.name.startsWith('handle')).length;
      
      const count = byModule.get(context.module) || 0;
      byModule.set(context.module, count + 1);
    }

    return {
      totalFiles: this.registry.size,
      totalFunctions,
      totalExports,
      factoryCount,
      handlerCount,
      byModule
    };
  }

  /**
   * Build context string for AI prompt
   */
  buildContextForAI(): string {
    let context = '\n📚 AVAILABLE FUNCTIONS REGISTRY:\n';
    context += '='.repeat(80) + '\n\n';

    const byModule = new Map<string, EnhancedFileContext[]>();
    for (const ctx of this.registry.values()) {
      const existing = byModule.get(ctx.module) || [];
      existing.push(ctx);
      byModule.set(ctx.module, existing);
    }

    for (const [module, contexts] of byModule) {
      context += `\n📁 ${module.toUpperCase()}/\n`;
      
      for (const ctx of contexts) {
        context += `\n  📄 ${ctx.filename}\n`;
        context += `     Path: ${ctx.path}\n`;
        
        if (ctx.exports.length > 0) {
          context += `     Exports: ${ctx.exports.join(', ')}\n`;
        }
        
        if (ctx.functions.length > 0) {
          context += `     Functions:\n`;
          ctx.functions.forEach(func => {
            const asyncStr = func.async ? 'async ' : '';
            const paramsStr = func.params ? `(${func.params.join(', ')})` : '()';
            context += `       - ${asyncStr}${func.name}${paramsStr}\n`;
          });
        }

        if (ctx.imports.length > 0) {
          context += `     Imports from:\n`;
          ctx.imports.forEach(imp => {
            context += `       - ${imp.from}: ${imp.names.join(', ')}\n`;
          });
        }
      }
    }

    context += '\n' + '='.repeat(80) + '\n';
    return context;
  }

  /**
   * Build dependency context for specific modules
   */
  buildDependencyContext(dependencies: string[]): string {
    let context = '\n\n🔗 REQUIRED IMPORTS FOR THIS MODULE:\n';
    context += '='.repeat(80) + '\n';

    for (const dep of dependencies) {
      const depFiles = Array.from(this.registry.values())
        .filter(ctx => ctx.module === dep);
      
      if (depFiles.length > 0) {
        context += `\nFrom ${dep}:\n`;
        depFiles.forEach(file => {
          if (file.exports.length > 0) {
            context += `  • ${file.path}\n`;
            context += `    Exports: ${file.exports.join(', ')}\n`;
          }
        });
      }
    }

    context += '='.repeat(80) + '\n';
    return context;
  }

  /**
   * Helper: Resolve relative path
   */
  private resolvePath(from: string, to: string): string {
    if (!to.startsWith('.')) {
      return to;
    }

    const fromParts = from.split('/').slice(0, -1);
    const toParts = to.split('/');

    for (const part of toParts) {
      if (part === '.') continue;
      if (part === '..') {
        fromParts.pop();
      } else {
        fromParts.push(part);
      }
    }

    let resolved = fromParts.join('/');
    if (!resolved.endsWith('.js')) {
      resolved += '.js';
    }

    return resolved;
  }

  /**
   * Helper: Get relative path between files
   */
  private getRelativePath(from: string, to: string): string {
    const fromParts = from.split('/').slice(0, -1);
    const toParts = to.split('/');

    let common = 0;
    while (common < fromParts.length && 
           common < toParts.length && 
           fromParts[common] === toParts[common]) {
      common++;
    }

    const upLevels = fromParts.length - common;
    const relativeParts = Array(upLevels).fill('..');
    relativeParts.push(...toParts.slice(common));

    let path = relativeParts.join('/');
    if (!path.startsWith('.')) {
      path = './' + path;
    }

    return path.replace(/\.js$/, '');
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const LANGUAGE = 'javascript';

export const GENERATION_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 3000,
  RATE_LIMIT_DELAY: 8000,
  VALIDATION_STRICTNESS: 'HIGH',
  ALLOW_PARTIAL_SUCCESS: false,
  FORCE_REGENERATE_ON_MISSING: true
};

export const EXPORT_STANDARDS = `
🚨 CRITICAL EXPORT STANDARDS - MUST FOLLOW:

1. ❌ NEVER USE DEFAULT EXPORTS
   Bad:  module.exports = createUserModel;
   Good: module.exports = { createUserModel };

2. ✅ ALWAYS USE NAMED EXPORTS IN {} BRACKETS
   Pattern: module.exports = { fn1, fn2, fn3 };

3. ✅ CONSISTENT FACTORY NAMING
   Models:   create[Entity]Model    → createUserModel, createProductModel
   Services: create[Entity]Service  → createUserService, createProductService
   
4. ✅ CAMELCASE FILENAMES
   ✓ user.js           (camelCase)
   ✓ userHandler.js    (camelCase)
   ✓ userService.js    (camelCase)
   ✓ user.route.js     (camelCase)

5. ✅ IMPORT SYNTAX MUST MATCH
   const { createUserModel } = require('../models/user');
   const { createUserService } = require('../services/userService');
   const { handleGetUser } = require('../handlers/userHandler');
`;

export const MODULE_PROMPTS: Record<string, string> = {
  config: `Generate configuration files for a Node.js/Express application using CommonJS.
Include package.json with all dependencies, .eslintrc.json, .env.example, .gitignore, and README.md.`,

  docker: `Generate Docker configuration files:
1. Dockerfile - Multi-stage build for production
2. docker-compose.yml - With PostgreSQL service
3. .dockerignore - Exclude unnecessary files

Use Node 18 Alpine, non-root user, health checks, and proper security practices.`,

  utils: `Generate utility modules using FUNCTIONAL approach (NO classes):

CRITICAL FILENAME STANDARDS (camelCase):
- error.js (camelCase)
- response.js (camelCase)
- validation.js (camelCase)
- logger.js (camelCase)

Export pattern for ALL files:
\`\`\`javascript
// error.js
const createNotFoundError = (message) => { /* ... */ };
const createValidationError = (message, fields) => { /* ... */ };

module.exports = {
  createNotFoundError,
  createValidationError,
  // ... more exports
};
\`\`\`

NO default exports! Always use module.exports = { ... };`,

  database: `Generate database connection using pg (PostgreSQL) WITH AWS RDS SSL SUPPORT:

Files (camelCase):
- connection.js: Export { createPool, getPool } with SSL configuration
- index.js: Re-export from connection.js using module.exports = { createPool, getPool }
- migrations/001_initial_schema.sql: SQL to create initial tables with UUID extension. COMPULSORY include database creation SQL in comments.

CRITICAL: AWS RDS REQUIRES SSL CONNECTION
CRITICAL: getPool() should auto-create pool if not initialized (lazy initialization pattern)

Example with SSL:
\`\`\`javascript
// connection.js
const { Pool } = require('pg');

let pool = null;

const createPool = () => {
  if (!pool) {
    // SSL Configuration for AWS RDS
    const sslConfig = process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } // AWS RDS with SSL
      : false; // Local development without SSL

    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'myapp',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      
      // Connection pool settings
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      connectionTimeoutMillis: 2000,
      
      // AWS RDS SSL Configuration
      ssl: sslConfig,
      
      // Keep connection alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Error handling - log but don't crash the app
    pool.on('error', (err) => {
      console.error('❌ Unexpected database pool error:', err.message);
      console.error('   Stack:', err.stack);
      // Don't exit - let app continue and retry connections
      // If DB is truly down, connection attempts will fail gracefully
    });

    // Log connection info
    console.log('📊 Database pool created');
    console.log(\`   Host: \${process.env.DB_HOST || 'localhost'}\`);
    console.log(\`   Database: \${process.env.DB_NAME || 'myapp'}\`);
    console.log(\`   SSL: \${process.env.NODE_ENV === 'production' ? 'Enabled (AWS RDS)' : 'Disabled (Local)'}\`);
  }
  return pool;
};

const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

// Graceful shutdown
const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('📊 Database pool closed');
    pool = null;
  }
};

module.exports = { createPool, getPool, closePool };
\`\`\`

Migration SQL Template (AWS RDS Compatible):
\`\`\`sql
-- ============================================================================
-- Database Creation (run manually or via RDS console)
-- ============================================================================
-- For AWS RDS, create database via console or:
-- CREATE DATABASE your_db_name;
-- \\c your_db_name;

-- ============================================================================
-- Enable UUID Extension (AWS RDS Compatible)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extension
-- SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- ============================================================================
-- Tables with Auto-Generated UUIDs
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Add indexes for performance (AWS RDS optimized)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- Update trigger for updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verify setup
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_indexes WHERE schemaname = 'public';
\`\`\``,

  models: `Generate model modules using FUNCTIONAL approach.

CRITICAL STANDARDS (camelCase filenames):
- Filename: user.js (camelCase, not User.js)
- Factory name: createUserModel
- Export: module.exports = { createUserModel };

Example structure:
\`\`\`javascript
// user.js (camelCase filename!)
const { getPool } = require('../database/connection');

const createUserModel = () => {
  const pool = getPool();
  
  const findAll = async (filters = {}, options = {}) => {
    const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    // Apply filters
    if (filters.email) {
      query += \` AND email = $\${paramCount}\`;
      params.push(filters.email);
      paramCount++;
    }
    
    if (filters.role) {
      query += \` AND role = $\${paramCount}\`;
      params.push(filters.role);
      paramCount++;
    }
    
    if (filters.status) {
      query += \` AND status = $\${paramCount}\`;
      params.push(filters.status);
      paramCount++;
    }
    
    if (filters.search) {
      query += \` AND (name ILIKE $\${paramCount} OR email ILIKE $\${paramCount})\`;
      params.push(\`%\${filters.search}%\`);
      paramCount++;
    }
    
    // Add sorting
    const allowedSortFields = ['id', 'name', 'email', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += \` ORDER BY \${sortField} \${order}\`;
    
    // Add pagination
    query += \` LIMIT $\${paramCount} OFFSET $\${paramCount + 1}\`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  };
  
  const findById = async (id) => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  };
  
  const create = async (data) => {
    const { name, email, password, role = 'user', status = 'active' } = data;
    
    const query = \`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    \`;
    
    const result = await pool.query(query, [name, email, password, role, status]);
    return result.rows[0];
  };
  
  const update = async (id, data) => {
    const fields = [];
    const params = [];
    let paramCount = 1;
    
    // Build dynamic update query
    if (data.name !== undefined) {
      fields.push(\`name = $\${paramCount}\`);
      params.push(data.name);
      paramCount++;
    }
    
    if (data.email !== undefined) {
      fields.push(\`email = $\${paramCount}\`);
      params.push(data.email);
      paramCount++;
    }
    
    if (data.password !== undefined) {
      fields.push(\`password = $\${paramCount}\`);
      params.push(data.password);
      paramCount++;
    }
    
    if (data.role !== undefined) {
      fields.push(\`role = $\${paramCount}\`);
      params.push(data.role);
      paramCount++;
    }
    
    if (data.status !== undefined) {
      fields.push(\`status = $\${paramCount}\`);
      params.push(data.status);
      paramCount++;
    }
    
    // Always update the updated_at timestamp
    fields.push(\`updated_at = NOW()\`);
    
    if (fields.length === 1) {
      // Only updated_at would be updated, meaning no actual data to update
      return findById(id);
    }
    
    params.push(id);
    const query = \`
      UPDATE users 
      SET \${fields.join(', ')}
      WHERE id = $\${paramCount}
      RETURNING *
    \`;
    
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  };
  
  const remove = async (id) => {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  };
  
  return {
    findAll,
    findById,
    create,
    update,
    remove
  };
};

module.exports = createUserModel;

// ✅ CORRECT: Named export in {}
module.exports = { createUserModel };
\`\`\`

models/index.js must export ALL model factories:
\`\`\`javascript
const { createUserModel } = require('./user');
const { createProductModel } = require('./product');

module.exports = {
  createUserModel,
  createProductModel
};
\`\`\``,

  middleware: `Generate Express middleware using FUNCTIONAL approach:

CRITICAL: Each file exports multiple functions in {} brackets.
Use camelCase filenames.

Example:
\`\`\`javascript
// errorHandler.js
const errorHandler = (err, req, res, next) => { /* ... */ };
const notFoundHandler = (req, res) => { /* ... */ };

module.exports = {
  errorHandler,
  notFoundHandler
};
\`\`\``,

  auth: `Generate authentication system using FUNCTIONAL approach:

CRITICAL FILENAME STANDARDS (camelCase):
- handler.js (camelCase)
- service.js (camelCase)
- route.js (camelCase)
- util.js (camelCase)

Export pattern:
\`\`\`javascript
// service.js
const createAuthService = () => {
  const register = async (data) => { /* ... */ };
  const login = async (credentials) => { /* ... */ };
  
  return { register, login };
};

module.exports = { createAuthService };
\`\`\``,

  services: `Generate service modules using FUNCTIONAL approach.

CRITICAL STANDARDS (camelCase):
- Filename: userService.js (camelCase)
- Factory name: createUserService
- Export: module.exports = { createUserService };

Example:
\`\`\`javascript
// userService.js (camelCase!)
const { createUserModel } = require('../models/user');
const { createNotFoundError } = require('../utils/error');

const createUserService = () => {
  const userModel = createUserModel();
  
  const getAll = async (filters = {}, options = {}) => {
    return await userModel.findAll(filters, options);
  };
  
  const getById = async (id) => {
    const user = await userModel.findById(id);
    if (!user) {
      throw createNotFoundError('User not found');
    }
    return user;
  };
  
  return { getAll, getById, create, update, remove };
};

module.exports = { createUserService };
\`\`\``,

  handlers: `Generate handler modules using FUNCTIONAL approach.

CRITICAL STANDARDS (camelCase):
- Filename: userHandler.js (camelCase)
- Function names: handleGetUser, handleCreateUser, etc.
- Export: module.exports = { handleGetUser, handleCreateUser, ... };

Example:
\`\`\`javascript
// userHandler.js (camelCase!)
const { createUserService } = require('../services/userService');
const { successResponse } = require('../utils/response');

const userService = createUserService();

const handleGetAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAll(req.query);
    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

// ✅ CORRECT: All handlers exported in {}
module.exports = {
  handleGetAllUsers,
  handleGetUser,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser
};
\`\`\``,

  routes: `Generate route files using Express Router.

CRITICAL STANDARDS (camelCase):
- Filename: user.route.js (camelCase)
- Import: const { handleGetUser, ... } = require('../handlers/userHandler');

Example:
\`\`\`javascript
// user.route.js (camelCase!)
const express = require('express');
const router = express.Router();
const {
  handleGetAllUsers,
  handleGetUser,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser
} = require('../handlers/userHandler');

router.get('/', handleGetAllUsers);
router.get('/:id', handleGetUser);
router.post('/', handleCreateUser);
router.put('/:id', handleUpdateUser);
router.delete('/:id', handleDeleteUser);

module.exports = { router };
\`\`\``,

  tests: `Generate test files using Jest with FUNCTIONAL approach.
Follow same naming standards: camelCase filenames, named exports.`
};

// ============================================================================
// NAMING UTILITIES (STABLE - NEVER CHANGE)
// ============================================================================

export function toCamelCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toLowerCase());
}

export function toPascalCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

export const NAMING_STANDARDS = {
  MODEL_FILE: (tableName: string) => `${toCamelCase(tableName)}.js`,
  SERVICE_FILE: (tableName: string) => `${toCamelCase(tableName)}Service.js`,
  HANDLER_FILE: (tableName: string) => `${toCamelCase(tableName)}Handler.js`,
  ROUTE_FILE: (tableName: string) => `${toCamelCase(tableName)}.route.js`,

  MODEL_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Model`,
  SERVICE_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Service`,
  HANDLER_PREFIX: (tableName: string) => toCamelCase(tableName),
  HANDLER_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Handler`,

  MODEL_PATH: (tableName: string) => `../models/${toCamelCase(tableName)}`,
  SERVICE_PATH: (tableName: string) => `../services/${toCamelCase(tableName)}Service`,
  HANDLER_PATH: (tableName: string) => `../handlers/${toCamelCase(tableName)}Handler`,
};

export function getStandardFilePath(moduleType: string, tableName: string): string {
  switch (moduleType) {
    case 'models':
      return `src/models/${NAMING_STANDARDS.MODEL_FILE(tableName)}`;
    case 'services':
      return `src/services/${NAMING_STANDARDS.SERVICE_FILE(tableName)}`;
    case 'handlers':
      return `src/handlers/${NAMING_STANDARDS.HANDLER_FILE(tableName)}`;
    case 'routes':
      return `src/routes/${NAMING_STANDARDS.ROUTE_FILE(tableName)}`;
    default:
      return '';
  }
}

// ============================================================================
// JSON UTILITIES (STABLE - NEVER CHANGE)
// ============================================================================

export function cleanJSONResponse(text: string): string {
  let clean = text.trim();
  clean = clean.replace(/^```[\w]*\n?/gim, '');
  clean = clean.replace(/\n?```$/gm, '');
  const jsonStart = clean.indexOf('{');
  if (jsonStart > 0) clean = clean.substring(jsonStart);
  const lastBrace = clean.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < clean.length - 1) {
    clean = clean.substring(0, lastBrace + 1);
  }
  return clean;
}

export function repairJSON(json: string): string {
  let repaired = json;
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    repaired += '}'.repeat(openBraces - closeBraces);
  }
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  return repaired;
}

// ============================================================================
// FILE UTILITIES (STABLE - NEVER CHANGE)
// ============================================================================

export function parseFilePath(path: string): FileContext {
  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join('/');

  return {
    path,
    folder,
    filename,
    exports: []
  };
}

export function extractExports(content: string, filename: string): string[] {
  const exports: string[] = [];

  const namedExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
  if (namedExportsMatch) {
    const exportContent = namedExportsMatch[1];
    const functionNames = exportContent.match(/(\w+)(?:\s*:|,|\})/g);
    if (functionNames) {
      exports.push(...functionNames.map(name => name.replace(/[:,}]/g, '').trim()));
    }
  }

  return [...new Set(exports)];
}

export function buildFileRegistryContext(ctx: GenerationContext): string {
  const registry = Array.from(ctx.fileRegistry.values());

  if (registry.length === 0) {
    return '';
  }

  let context = '\n\n📂 PREVIOUSLY GENERATED FILES (for accurate imports):\n';

  const byFolder = new Map<string, FileContext[]>();
  registry.forEach(file => {
    const existing = byFolder.get(file.folder) || [];
    existing.push(file);
    byFolder.set(file.folder, existing);
  });

  byFolder.forEach((files, folder) => {
    context += `\n${folder || 'root'}/\n`;
    files.forEach(file => {
      context += `  - ${file.filename}`;
      if (file.exports && file.exports.length > 0) {
        context += ` → exports: { ${file.exports.join(', ')} }`;
      }
      context += '\n';
    });
  });

  context += '\n⚠️ IMPORT SYNTAX: const { exportName } = require(\'./path/to/file\');';
  context += '\n⚠️ Use EXACT paths and export names from above.';

  return context;
}

// ============================================================================
// RETRY UTILITY (STABLE - NEVER CHANGE)
// ============================================================================

export async function generateWithRetry(
  generateFn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 2000,
  timeout = 45000 // 45 second timeout per attempt
): Promise<any> {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wrap generation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Generation timeout')), timeout)
      );
      
      const result = await Promise.race([
        generateFn(),
        timeoutPromise
      ]);
      
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Rate limit - exponential backoff
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`   ⏳ Rate limited. Waiting ${(waitTime / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Timeout - shorter delay, immediate retry
      if (error.message?.includes('timeout')) {
        if (attempt < maxRetries - 1) {
          console.log(`   ⏱️  Timeout. Retrying immediately...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        continue;
      }
      
      // Other errors - exponential backoff
      if (attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`   🔄 Retry ${attempt + 1}/${maxRetries} in ${(waitTime / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// ============================================================================
// DOCKER GENERATORS (STABLE - NEVER CHANGE)
// ============================================================================

export function generateEnhancedDockerEntrypoint(project: Project): GeneratedFile {
  const content = `#!/bin/sh
set -e

echo "🚀 Starting ${project.name}..."
echo "================================"

# Display environment info
echo "📋 Environment:"
echo "   NODE_ENV: \${NODE_ENV:-development}"
echo "   DB_HOST: \${DB_HOST}"
echo "   DB_PORT: \${DB_PORT:-5432}"
echo "   DB_NAME: \${DB_NAME}"
echo "   DB_USER: \${DB_USER}"
echo "   SSL_MODE: \${NODE_ENV:-development}" 
echo ""

# Function to check PostgreSQL connection
check_postgres() {
  # Extract hostname if DB_HOST contains port
  DB_HOST_CLEAN=\$(echo "\${DB_HOST}" | cut -d: -f1)
  
  PGPASSWORD=\$DB_PASSWORD psql -h "\$DB_HOST_CLEAN" -p "\${DB_PORT:-5432}" -U "\$DB_USER" -d "postgres" -c '\\q' 2>/dev/null
}

# Wait for PostgreSQL with timeout
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_TRIES=60
COUNTER=0

until check_postgres; do
  COUNTER=\$((COUNTER + 1))
  if [ \$COUNTER -gt \$MAX_TRIES ]; then
    echo "❌ PostgreSQL is unavailable after \$MAX_TRIES attempts - exiting"
    echo "   Check DB_HOST: \${DB_HOST}"
    echo "   Check DB_PORT: \${DB_PORT:-5432}"
    echo "   Check DB_USER: \${DB_USER}"
    exit 1
  fi
  echo "   PostgreSQL is unavailable (attempt \$COUNTER/\$MAX_TRIES) - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Extract hostname for database operations
DB_HOST_CLEAN=\$(echo "\${DB_HOST}" | cut -d: -f1)

# Create database if it doesn't exist
echo "📦 Ensuring database '\$DB_NAME' exists..."
DB_EXISTS=\$(PGPASSWORD=\$DB_PASSWORD psql -h "\$DB_HOST_CLEAN" -p "\${DB_PORT:-5432}" -U "\$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='\$DB_NAME'" 2>/dev/null || echo "0")

if [ "\$DB_EXISTS" != "1" ]; then
  echo "   Creating database '\$DB_NAME'..."
  PGPASSWORD=\$DB_PASSWORD psql -h "\$DB_HOST_CLEAN" -p "\${DB_PORT:-5432}" -U "\$DB_USER" -d "postgres" -c "CREATE DATABASE \$DB_NAME" 2>&1
  
  if [ \$? -eq 0 ]; then
    echo "   ✅ Database created!"
  else
    echo "   ⚠️  Database creation had issues (may already exist)"
  fi
else
  echo "   ✅ Database already exists!"
fi

# Test connection to the application database
echo "🔍 Testing connection to application database..."
if PGPASSWORD=\$DB_PASSWORD psql -h "\$DB_HOST_CLEAN" -p "\${DB_PORT:-5432}" -U "\$DB_USER" -d "\$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Successfully connected to '\$DB_NAME' database!"
else
  echo "❌ Failed to connect to '\$DB_NAME' database"
  exit 1
fi

# Check if migrations directory exists
if [ ! -d "/app/src/database/migrations" ]; then
  echo "⚠️  No migrations directory found - skipping migrations"
else
  # Run migrations
  echo "🔄 Running database migrations..."
  cd /app
  
  if node src/database/migrate.js; then
    echo "✅ Migrations completed successfully!"
  else
    echo "❌ Migration failed - exiting"
    exit 1
  fi
fi

echo "================================"
echo "✅ Setup complete - starting application..."
echo ""

# Execute the main command (node src/index.js)
exec "$@"`;

  return {
    path: 'docker-entrypoint.sh',
    content,
    description: 'Enhanced Docker entrypoint with robust database connectivity'
  };
}

export function generateEnhancedDockerfile(project: Project, options: CodeGenOptions): GeneratedFile {
  const content = `# Multi-stage build for ${project.name}
FROM node:18-alpine AS base

# Install dependencies for PostgreSQL client
RUN apk add --no-cache \\
    postgresql-client \\
    libc6-compat \\
    && rm -rf /var/cache/apk/*

# =============================================================================
# Dependencies stage - separate for better caching
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production && \\
    npm cache clean --force

# =============================================================================
# Builder stage - for any build steps if needed
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# =============================================================================
# Production stage
# =============================================================================
FROM base AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command
CMD ["node", "src/index.js"]`;

  return {
    path: 'Dockerfile',
    content,
    description: 'Production-ready Dockerfile with optimized layers'
  };
}

export function generateEnhancedDockerCompose(project: Project, options: CodeGenOptions): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');
  const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');

  const content = `version: '3.8'

services:
  # =============================================================================
  # PostgreSQL Database
  # =============================================================================
  db:
    image: postgres:15-alpine
    container_name: ${projectSlug}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
      POSTGRES_DB: \${DB_NAME:-${dbName}}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - postgres_logs:/var/log/postgresql
    ports:
      - "\${DB_PORT:-5432}:5432"
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres} -d \${DB_NAME:-${dbName}}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    command: >
      postgres
      -c max_connections=100
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100

  # =============================================================================
  # Application Service
  # =============================================================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: ${projectSlug}-app
    restart: unless-stopped
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      
      DATABASE_URL: postgresql://\${DB_USER:-postgres}:\${DB_PASSWORD:-postgres}@db:5432/\${DB_NAME:-${dbName}}
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: \${DB_USER:-postgres}
      DB_PASSWORD: \${DB_PASSWORD:-postgres}
      DB_NAME: \${DB_NAME:-${dbName}}
      
      DB_POOL_MIN: \${DB_POOL_MIN:-2}
      DB_POOL_MAX: \${DB_POOL_MAX:-10}
      DB_POOL_IDLE: \${DB_POOL_IDLE:-10000}
      
      ${options.includeAuth ? `JWT_SECRET: \${JWT_SECRET:-change-this-secret-in-production}
      JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-7d}
      ` : ''}LOG_LEVEL: \${LOG_LEVEL:-info}
      
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    volumes:
      - ./src/database/migrations:/app/src/database/migrations:ro

networks:
  app_network:
    driver: bridge
    name: ${projectSlug}_network

volumes:
  postgres_data:
    driver: local
    name: ${projectSlug}_postgres_data
  postgres_logs:
    driver: local
    name: ${projectSlug}_postgres_logs`;

  return {
    path: 'docker-compose.yml',
    content,
    description: 'Production-ready docker-compose with health checks'
  };
}

export function generateEnhancedEnvExample(project: Project, options: CodeGenOptions): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');

  const content = `# =============================================================================
# ${project.name.toUpperCase()} - ENVIRONMENT CONFIGURATION
# =============================================================================
# Copy this file to .env and update with your actual values
# NEVER commit .env to version control!

# =============================================================================
# Server Configuration
# =============================================================================
NODE_ENV=production
PORT=3000

# =============================================================================
# Database Configuration (AWS RDS)
# =============================================================================
# For AWS RDS, use the RDS endpoint
DB_HOST=your-rds-instance.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=${dbName}

# Full connection string (alternative)
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/\${DB_NAME}?sslmode=require

# Connection pool settings (optimized for AWS RDS)
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE=10000

# SSL Configuration for AWS RDS
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# =============================================================================
# Local Development (override for local PostgreSQL)
# =============================================================================
# Uncomment these for local development:
# DB_HOST=localhost
# DB_SSL=false

${options.includeAuth ? `# =============================================================================
# Authentication & Security
# =============================================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10

` : ''}# =============================================================================
# Logging
# =============================================================================
LOG_LEVEL=info
LOG_FORMAT=json

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,https://yourdomain.com
CORS_CREDENTIALS=true

# =============================================================================
# Rate Limiting (optional)
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# AWS Configuration (for ECS deployment)
# =============================================================================
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# =============================================================================
# Health Check Configuration
# =============================================================================
HEALTH_CHECK_TIMEOUT=5000`;

  return {
    path: '.env.example',
    content,
    description: 'Complete environment configuration template with AWS RDS SSL settings'
  };
}

export function generateDockerIgnore(): GeneratedFile {
  const content = `# Dependencies
node_modules
npm-debug.log
yarn-error.log
package-lock.json
yarn.lock

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Tests
coverage
*.test.js
tests/

# Documentation
*.md
!README.md

# Git
.git
.gitignore

# Docker
Dockerfile
docker-compose*.yml
.dockerignore

# Logs
logs
*.log

# Misc
.eslintrc*
.prettierrc*
.editorconfig`;

  return {
    path: '.dockerignore',
    content,
    description: 'Docker ignore file'
  };
}

// ============================================================================
// BASE DEPENDENCIES (STABLE - NEVER CHANGE)
// ============================================================================

export function getBaseDependencies(framework: string): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const deps: Record<string, string> = {
    'dotenv': '^16.3.1',
    'cors': '^2.8.5',
    'helmet': '^7.1.0',
    'compression': '^1.7.4',
    'winston': '^3.11.0',
    'pg': '^8.11.3'
  };

  const devDeps: Record<string, string> = {
    'nodemon': '^3.0.2',
    'eslint': '^8.55.0',
    'prettier': '^3.1.1'
  };

  if (framework === 'express') {
    deps['express'] = '^4.18.2';
    deps['express-validator'] = '^7.0.1';
  }

  return { dependencies: deps, devDependencies: devDeps };
}

export function addConditionalDependencies(
  project: Project,
  options: CodeGenOptions,
  deps: Record<string, string>,
  devDeps: Record<string, string>
): void {
  if (options.includeAuth) {
    deps['jsonwebtoken'] = '^9.0.2';
    deps['bcrypt'] = '^5.1.1';
  }
  if (options.includeTests) {
    devDeps['jest'] = '^29.7.0';
    devDeps['supertest'] = '^6.3.3';
    devDeps['@jest/globals'] = '^29.7.0';
  }
}

// ============================================================================
// LOCAL DEVELOPMENT SCRIPT
// ============================================================================
// TODO: These functions have bash script escaping issues - temporarily disabled
// Will be re-added with proper escaping

export function generateLocalDevScript(project: Project, options: CodeGenOptions): GeneratedFile {
  return {
    path: 'run-local.sh',
    content: '#!/bin/bash\necho "Local dev script - coming soon"\n',
    description: 'Script to setup and run backend locally'
  };
}

export function generateLocalDevScriptWindows(project: Project, options: CodeGenOptions): GeneratedFile {
  return {
    path: 'run-local.bat',
    content: '@echo off\necho Local dev script - coming soon\n',
    description: 'Windows script to setup and run backend locally'
  };
}

/*
// ORIGINAL FUNCTION - HAS ESCAPING ISSUES - NEEDS FIXING
export function generateLocalDevScript_DISABLED(project: Project, options: CodeGenOptions): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');
  
  // Use array and join to avoid template literal escaping issues
  const content = `#!/bin/bash

# =============================================================================
# ${project.name} - Local Development Setup Script
# =============================================================================
# This script sets up and runs the backend locally for development
# Author: AI-Generated
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Project configuration
PROJECT_NAME="${project.name}"
DB_NAME="${dbName}"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_PORT="5432"
PORT="3000"

echo -e "\\\${BLUE}================================================\\\${NC}"
echo -e "\\\${BLUE}  ${project.name} - Local Development Setup\\\${NC}"
echo -e "\\\${BLUE}================================================\\\${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command_exists psql; then
        if psql -U "$DB_USER" -lqt | cut -d \\| -f 1 | grep -qw "$DB_NAME"; then
            return 0
        fi
    fi
    return 1
}

# Step 1: Check prerequisites
echo -e "\\\${YELLOW}[1/7]\\\${NC} Checking prerequisites..."

if ! command_exists node; then
    echo -e "\\\${RED}❌ Node.js is not installed. Please install Node.js >= 18\\\${NC}"
    exit 1
fi
echo -e "\\\${GREEN}  ✓ Node.js \$(node --version)\\\${NC}"

if ! command_exists npm; then
    echo -e "\\\${RED}❌ npm is not installed\\\${NC}"
    exit 1
fi
echo -e "\\\${GREEN}  ✓ npm \$(npm --version)\\\${NC}"

if ! command_exists psql; then
    echo -e "\\\${YELLOW}  ⚠ PostgreSQL CLI not found. You may need to install PostgreSQL\\\${NC}"
    echo -e "\\\${YELLOW}    Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15\\\${NC}"
else
    echo -e "\\\${GREEN}  ✓ PostgreSQL \$(psql --version | cut -d' ' -f3)\\\${NC}"
fi
echo ""

# Step 2: Install dependencies
echo -e "\${YELLOW}[2/7]\${NC} Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "\${GREEN}  ✓ Dependencies installed\${NC}"
else
    echo -e "\${GREEN}  ✓ Dependencies already installed (run 'npm install' to update)\${NC}"
fi
echo ""

# Step 3: Setup environment file
echo -e "\${YELLOW}[3/7]\${NC} Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Update .env with local development values
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NODE_ENV=production|NODE_ENV=development|g" .env
        sed -i '' "s|DB_HOST=.*|DB_HOST=localhost|g" .env
        sed -i '' "s|DB_PORT=.*|DB_PORT=$DB_PORT|g" .env
        sed -i '' "s|DB_USER=.*|DB_USER=$DB_USER|g" .env
        sed -i '' "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" .env
        sed -i '' "s|DB_NAME=.*|DB_NAME=$DB_NAME|g" .env
        sed -i '' "s|DB_SSL=true|DB_SSL=false|g" .env
        sed -i '' "s|PORT=.*|PORT=$PORT|g" .env
    else
        # Linux
        sed -i "s|NODE_ENV=production|NODE_ENV=development|g" .env
        sed -i "s|DB_HOST=.*|DB_HOST=localhost|g" .env
        sed -i "s|DB_PORT=.*|DB_PORT=$DB_PORT|g" .env
        sed -i "s|DB_USER=.*|DB_USER=$DB_USER|g" .env
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" .env
        sed -i "s|DB_NAME=.*|DB_NAME=$DB_NAME|g" .env
        sed -i "s|DB_SSL=true|DB_SSL=false|g" .env
        sed -i "s|PORT=.*|PORT=$PORT|g" .env
    fi
    
    echo -e "\${GREEN}  ✓ .env file created and configured for local development\${NC}"
else
    echo -e "\${GREEN}  ✓ .env file already exists\${NC}"
    echo -e "\${YELLOW}    Note: Make sure DB_HOST=localhost and DB_SSL=false for local dev\${NC}"
fi
echo ""

# Step 4: Check/Create database
echo -e "\${YELLOW}[4/7]\${NC} Setting up database..."
if command_exists psql; then
    # Check if database exists
    if psql -U "$DB_USER" -lqt | cut -d \\| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "\${GREEN}  ✓ Database '$DB_NAME' already exists\${NC}"
    else
        echo -e "\${YELLOW}  Creating database '$DB_NAME'...\${NC}"
        createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
            echo -e "\${RED}  ❌ Failed to create database. Trying with sudo...\${NC}"
            sudo -u postgres createdb "$DB_NAME" || {
                echo -e "\${RED}  ❌ Could not create database. Please create it manually:\${NC}"
                echo -e "\${RED}     createdb -U postgres $DB_NAME\${NC}"
                exit 1
            }
        }
        echo -e "\${GREEN}  ✓ Database created\${NC}"
    fi
else
    echo -e "\${YELLOW}  ⚠ PostgreSQL CLI not available, skipping database check\${NC}"
    echo -e "\${YELLOW}    Make sure PostgreSQL is running with database: $DB_NAME\${NC}"
fi
echo ""

# Step 5: Run migrations
echo -e "\${YELLOW}[5/7]\${NC} Running database migrations..."
if npm run migrate:up; then
    echo -e "\${GREEN}  ✓ Migrations completed successfully\${NC}"
else
    echo -e "\${RED}  ❌ Migration failed. Check database connection and try again\${NC}"
    exit 1
fi
echo ""

# Step 6: Seed database (optional)
echo -e "\${YELLOW}[6/7]\${NC} Seeding database with sample data..."
read -p "$(echo -e "\${BLUE}  Would you like to seed the database with sample data? (y/N): \${NC}")" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm run db:seed; then
        echo -e "\${GREEN}  ✓ Database seeded successfully\${NC}"
    else
        echo -e "\${YELLOW}  ⚠ Seeding failed, but continuing...\${NC}"
    fi
else
    echo -e "\${BLUE}  ⊘ Skipping database seeding\${NC}"
fi
echo ""

# Step 7: Find available port and start development server
echo -e "\${YELLOW}[7/7]\${NC} Finding available port and starting server..."

# Function to check if port is in use
is_port_in_use() {
    if command_exists lsof; then
        lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln 2>/dev/null | grep -q ":$1 "
    else
        # Fallback: try to connect to the port
        (echo >/dev/tcp/localhost/$1) 2>/dev/null
    fi
}

# Find an available port starting from PORT
ORIGINAL_PORT=$PORT
while is_port_in_use $PORT; do
    echo -e "\${YELLOW}  ⚠ Port $PORT is already in use, trying $(($PORT + 1))...\${NC}"
    PORT=$(($PORT + 1))
    
    # Safety check: don't go beyond port 4000
    if [ $PORT -gt 4000 ]; then
        echo -e "\${RED}  ❌ Could not find available port between $ORIGINAL_PORT and 4000\${NC}"
        echo -e "\${YELLOW}  Please free up a port or specify a different PORT in .env\${NC}"
        exit 1
    fi
done

# Update .env with the available port if it changed
if [ $PORT -ne $ORIGINAL_PORT ]; then
    echo -e "\${GREEN}  ✓ Found available port: $PORT\${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|PORT=.*|PORT=$PORT|g" .env
    else
        sed -i "s|PORT=.*|PORT=$PORT|g" .env
    fi
else
    echo -e "\${GREEN}  ✓ Port $PORT is available\${NC}"
fi

echo -e "\${GREEN}================================================\${NC}"
echo -e "\${GREEN}  ✓ Setup complete!\${NC}"
echo -e "\${GREEN}================================================\${NC}"
echo ""
echo -e "\${BLUE}📡 API will be available at:\${NC}"
echo -e "   \${GREEN}http://localhost:$PORT\${NC}"
echo ""
echo -e "\${BLUE}📊 Health check endpoint:\${NC}"
echo -e "   \${GREEN}http://localhost:$PORT/health\${NC}"
echo ""
echo -e "\${BLUE}🔧 Useful commands:\${NC}"
echo -e "   npm run dev          - Start with auto-reload"
echo -e "   npm run migrate:up   - Run new migrations"
echo -e "   npm run migrate:down - Rollback last migration"
echo -e "   npm run db:seed      - Seed database"
echo -e "   npm run db:reset     - Reset and reseed database"
echo -e "   npm run lint:fix     - Fix code style issues"
echo ""
echo -e "\${YELLOW}Press Ctrl+C to stop the server\${NC}"
echo ""

# Export PORT for npm script
export PORT
npm run dev

  return {
    path: 'run-local.sh',
    content,
    description: 'Script to setup and run backend locally for development'
  };
}

export function generateLocalDevScriptWindows(project: Project, options: CodeGenOptions): GeneratedFile {
  const dbName = project.name.toLowerCase().replace(/\s+/g, '_');
  
  const content = `@echo off
REM =============================================================================
REM ${project.name} - Local Development Setup Script (Windows)
REM =============================================================================
REM This script sets up and runs the backend locally for development
REM Author: AI-Generated
REM =============================================================================

setlocal enabledelayedexpansion

set PROJECT_NAME=${project.name}
set DB_NAME=${dbName}
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_PORT=5432
set PORT=3000

echo ================================================
echo   %PROJECT_NAME% - Local Development Setup
echo ================================================
echo.

REM Step 1: Check prerequisites
echo [1/7] Checking prerequisites...

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js ^>= 18
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo   [OK] Node.js %NODE_VERSION%

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo   [OK] npm %NPM_VERSION%

where psql >nul 2>nul
if errorlevel 1 (
    echo   [WARNING] PostgreSQL CLI not found. You may need to install PostgreSQL
    echo   Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
) else (
    echo   [OK] PostgreSQL installed
)
echo.

REM Step 2: Install dependencies
echo [2/7] Installing dependencies...
if not exist "node_modules" (
    call npm install
    echo   [OK] Dependencies installed
) else (
    echo   [OK] Dependencies already installed
)
echo.

REM Step 3: Setup environment file
echo [3/7] Setting up environment configuration...
if not exist ".env" (
    copy .env.example .env >nul
    
    REM Update .env with local development values using PowerShell
    powershell -Command "(Get-Content .env) -replace 'NODE_ENV=production', 'NODE_ENV=development' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_HOST=.*', 'DB_HOST=localhost' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DB_SSL=true', 'DB_SSL=false' | Set-Content .env"
    
    echo   [OK] .env file created and configured for local development
) else (
    echo   [OK] .env file already exists
)
echo.

REM Step 4: Database setup message
echo [4/7] Database setup...
echo   Make sure PostgreSQL is running with database: %DB_NAME%
echo   Create database manually if needed: createdb -U postgres %DB_NAME%
echo.

REM Step 5: Run migrations
echo [5/7] Running database migrations...
call npm run migrate:up
if errorlevel 1 (
    echo   [ERROR] Migration failed. Check database connection
    exit /b 1
)
echo   [OK] Migrations completed
echo.

REM Step 6: Seed database
echo [6/7] Seeding database...
set /p SEED="Would you like to seed the database? (y/N): "
if /i "!SEED!"=="y" (
    call npm run db:seed
    if errorlevel 1 (
        echo   [WARNING] Seeding failed, but continuing...
    ) else (
        echo   [OK] Database seeded
    )
) else (
    echo   [SKIP] Database seeding skipped
)
echo.

REM Step 7: Find available port and start server
echo [7/7] Finding available port and starting server...

REM Function to check if port is in use
set ORIGINAL_PORT=%PORT%
:CHECK_PORT
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo   [WARNING] Port %PORT% is already in use, trying next port...
    set /a PORT+=1
    
    REM Safety check: don't go beyond port 4000
    if %PORT% GTR 4000 (
        echo   [ERROR] Could not find available port between %ORIGINAL_PORT% and 4000
        echo   Please free up a port or specify a different PORT in .env
        exit /b 1
    )
    goto CHECK_PORT
)

REM Update .env with the available port if it changed
if not %PORT%==%ORIGINAL_PORT% (
    echo   [OK] Found available port: %PORT%
    powershell -Command "(Get-Content .env) -replace 'PORT=.*', 'PORT=%PORT%' | Set-Content .env"
) else (
    echo   [OK] Port %PORT% is available
)

echo ================================================
echo   Setup complete!
echo ================================================
echo.
echo API available at: http://localhost:%PORT%
echo Health check: http://localhost:%PORT%/health
echo.
echo Useful commands:
echo   npm run dev          - Start with auto-reload
echo   npm run migrate:up   - Run new migrations
echo   npm run migrate:down - Rollback last migration
echo   npm run db:seed      - Seed database
echo   npm run db:reset     - Reset and reseed database
echo   npm run lint:fix     - Fix code style issues
echo.
echo Press Ctrl+C to stop the server
echo.

REM Set PORT environment variable for npm
set PORT=%PORT%
call npm run dev

  return {
    path: 'run-local.bat',
    content,
    description: 'Windows batch script to setup and run backend locally'
  };
}
*/

// ============================================================================
// CONFIG FUNCTIONS (STABLE - NEVER CHANGE)
// ============================================================================

export function getCodeGenOptions(
  framework: 'express' | 'fastify' | 'koa' = 'express',
  includeAuth = false,
  includeTests = false
): CodeGenOptions {
  return {
    framework,
    language: 'javascript',
    includeAuth,
    includeTests,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.05,
    maxTokens: 16000
  };
}




