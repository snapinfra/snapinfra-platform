// ============================================================================
// FIXED CODE GENERATOR - PROPER CONTEXT PASSING
// ============================================================================

import { generateText } from 'ai';
import { groq } from './groq-client';

// Import utilities
import {
  EXPORT_STANDARDS,
  NAMING_STANDARDS,
  generateEnhancedDockerEntrypoint,
  generateEnhancedDockerfile,
  generateEnhancedDockerCompose,
  generateEnhancedEnvExample,
  generateDockerIgnore,
  getCodeGenOptions,
  getBaseDependencies,
  addConditionalDependencies,
  getModulePrompts,
} from './code-generator-templates';

import {
  type Project,
  type CodeGenOptions,
  type ModuleSpec,
  type GeneratedFile,
  type FileContext,
  type GenerationContext,
  type ParsedResponse,
  type ModuleResult,
  type CodeGenerationResult,
  type ProgressCallback,
  type FunctionInfo,
  type EnhancedFileContext,
  FunctionRegistry,
  LANGUAGE,
  toCamelCase,
  toPascalCase,
  cleanJSONResponse,
  repairJSON,
  parseFilePath,
  generateWithRetry,
} from './code-generator-analysis';


import {
  generateTerraformMain,
  generateTerraformVariables,
  generateTerraformOutputs,
  generateTerraformVPCModule,
  generateTerraformSecurityModule,
  generateTerraformRDSModule,
  generateTerraformECRModule,
  generateTerraformECSModule,
  generateTerraformTfvarsExample,
  generateDeploymentScript,
  generateTerraformReadme
} from './iac-generator-utils';

// ============================================================================
// ENHANCED CONTEXT WITH PROPER CONTEXT BUILDING
// ============================================================================

export interface EnhancedGenerationContext extends GenerationContext {
  functionRegistry: FunctionRegistry;
}

// ============================================================================
// IMPROVED CONTEXT BUILDER - PASSES ALL GENERATED FUNCTIONS
// ============================================================================

// Replace the buildEnhancedContextPrompt function in document 3
function buildEnhancedContextPrompt(
  moduleSpec: ModuleSpec,
  ctx: EnhancedGenerationContext,
  attemptNumber: number
): string {
  const modulePrompts = getModulePrompts(ctx.project);

  let contextPrompt = EXPORT_STANDARDS + '\n\n';
  contextPrompt += modulePrompts[moduleSpec.type] || '';

  // 🔥 FIX: Show available functions with EXACT import syntax
  const registryContext = ctx.functionRegistry.buildContextForAI();
  contextPrompt += '\n\n' + registryContext;

  // 🔥 FIX: Enhanced dependency context with explicit import examples
  if (moduleSpec.dependencies.length > 0) {
    contextPrompt += '\n\n🎯 CRITICAL: IMPORT EXACTLY AS SHOWN BELOW:\n';
    contextPrompt += '='.repeat(80) + '\n';

    for (const depModule of moduleSpec.dependencies) {
      const depFiles = Array.from(ctx.functionRegistry['registry'].values())
        .filter(fileCtx => 
          fileCtx.module === depModule || 
          fileCtx.path.includes(`/${depModule}/`)
        );

      if (depFiles.length > 0) {
        contextPrompt += `\n📦 ${depModule.toUpperCase()} MODULE:\n`;
        
        depFiles.forEach(file => {
          if (file.exports.length > 0) {
            contextPrompt += `\n  📄 File: ${file.path}\n`;
            contextPrompt += `     Exports: ${file.exports.join(', ')}\n`;

            // Show functions with their signatures
            if (file.functions.length > 0) {
              contextPrompt += `\n     Available Functions:\n`;
              file.functions.forEach(func => {
                const asyncStr = func.async ? 'async ' : '';
                const paramsStr = func.params ? `(${func.params.join(', ')})` : '()';
                contextPrompt += `       • ${asyncStr}${func.name}${paramsStr}\n`;
              });
            }

            // 🔥 CRITICAL: Show EXACT import statement
            const relativePath = file.path
              .replace(/^src\//, '../')
              .replace(/\.js$/, '');
            
            contextPrompt += `\n     ✅ COPY THIS IMPORT EXACTLY:\n`;
            contextPrompt += `     const { ${file.exports.join(', ')} } = require('${relativePath}');\n`;
            contextPrompt += `\n     ⚠️  DO NOT change function names or paths!\n`;
          }
        });
      }
    }
    contextPrompt += '\n' + '='.repeat(80) + '\n';
  }

  // 🔥 FIX: Retry context with specific examples
  if (attemptNumber > 1) {
    contextPrompt += `\n\n🔄 RETRY ATTEMPT ${attemptNumber} - COMMON MISTAKES TO AVOID:\n`;
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '❌ WRONG Examples:\n';
    contextPrompt += '   const { createUserModel } = require("../models/user");\n';
    contextPrompt += '   const userService = require("../services/userService");\n';
    contextPrompt += '   module.exports = createUserService;\n\n';
    contextPrompt += '✅ CORRECT Examples:\n';
    contextPrompt += '   const { createUserModels } = require("../models/userModels");\n';
    contextPrompt += '   const { createUserServices } = require("../services/userServices");\n';
    contextPrompt += '   module.exports = { createUserServices };\n\n';
    contextPrompt += '🚨 RULES:\n';
    contextPrompt += '1. ALL factory names are PLURAL: createUserModels, createProductModels\n';
    contextPrompt += '2. ALL filenames are PLURAL: userModels.js, productServices.js\n';
    contextPrompt += '3. ALWAYS use named exports: module.exports = { fn1, fn2 }\n';
    contextPrompt += '4. COPY import statements EXACTLY from "COPY THIS IMPORT EXACTLY" sections above\n';
    contextPrompt += '='.repeat(80) + '\n';
  }

  // 🔥 FIX: Table-specific context with explicit naming
  if (moduleSpec.tables && moduleSpec.tables.length > 0) {
    contextPrompt += `\n\n📊 ENTITIES FOR THIS MODULE:\n`;
    contextPrompt += '='.repeat(80) + '\n';

    moduleSpec.tables.forEach(tableName => {
      const table = ctx.project.schema.find(t => t.name === tableName);
      if (table) {
        contextPrompt += `\n🗂️  ${tableName.toUpperCase()}\n`;

        // 🔥 CRITICAL: Show exact names based on module type
        if (moduleSpec.type === 'models') {
          const filename = NAMING_STANDARDS.MODEL_FILE(tableName);
          const factory = NAMING_STANDARDS.MODEL_FACTORY(tableName);
          contextPrompt += `   ✅ Filename: ${filename}\n`;
          contextPrompt += `   ✅ Factory: ${factory}\n`;
          contextPrompt += `   ✅ Export: module.exports = { ${factory} };\n`;
          
        } else if (moduleSpec.type === 'services') {
          const filename = NAMING_STANDARDS.SERVICE_FILE(tableName);
          const factory = NAMING_STANDARDS.SERVICE_FACTORY(tableName);
          const modelFactory = NAMING_STANDARDS.MODEL_FACTORY(tableName);
          const modelPath = NAMING_STANDARDS.MODEL_PATH(tableName);
          
          contextPrompt += `   ✅ Filename: ${filename}\n`;
          contextPrompt += `   ✅ Factory: ${factory}\n`;
          contextPrompt += `   ✅ Export: module.exports = { ${factory} };\n`;
          contextPrompt += `\n   ✅ IMPORT MODEL (COPY EXACTLY):\n`;
          contextPrompt += `   const { ${modelFactory} } = require('${modelPath}');\n`;
          
        } else if (moduleSpec.type === 'handlers') {
          const filename = NAMING_STANDARDS.HANDLER_FILE(tableName);
          const serviceFactory = NAMING_STANDARDS.SERVICE_FACTORY(tableName);
          const servicePath = NAMING_STANDARDS.SERVICE_PATH(tableName);
          const pascalName = toPascalCase(tableName);
          
          contextPrompt += `   ✅ Filename: ${filename}\n`;
          contextPrompt += `   ✅ Functions: handleGetAll${pascalName}Records, handleGet${pascalName}Records, handleCreate${pascalName}Records, handleUpdate${pascalName}Records, handleDelete${pascalName}Records\n`;
          contextPrompt += `\n   ✅ IMPORT SERVICE (COPY EXACTLY):\n`;
          contextPrompt += `   const { ${serviceFactory} } = require('${servicePath}');\n`;
          contextPrompt += `\n   ✅ EXPORTS (COPY EXACTLY):\n`;
          contextPrompt += `   module.exports = {\n`;
          contextPrompt += `     handleGetAll${pascalName}Records,\n`;
          contextPrompt += `     handleGet${pascalName}Records,\n`;
          contextPrompt += `     handleCreate${pascalName}Records,\n`;
          contextPrompt += `     handleUpdate${pascalName}Records,\n`;
          contextPrompt += `     handleDelete${pascalName}Records\n`;
          contextPrompt += `   };\n`;
          
        } else if (moduleSpec.type === 'routes') {
          const filename = NAMING_STANDARDS.ROUTE_FILE(tableName);
          const handlerPath = NAMING_STANDARDS.HANDLER_PATH(tableName);
          const pascalName = toPascalCase(tableName);
          
          contextPrompt += `   ✅ Filename: ${filename}\n`;
          contextPrompt += `\n   ✅ IMPORT HANDLERS (COPY EXACTLY):\n`;
          contextPrompt += `   const {\n`;
          contextPrompt += `     handleGetAll${pascalName}Records,\n`;
          contextPrompt += `     handleGet${pascalName}Records,\n`;
          contextPrompt += `     handleCreate${pascalName}Records,\n`;
          contextPrompt += `     handleUpdate${pascalName}Records,\n`;
          contextPrompt += `     handleDelete${pascalName}Records\n`;
          contextPrompt += `   } = require('${handlerPath}');\n`;
          contextPrompt += `\n   ✅ EXPORT ROUTER (COPY EXACTLY):\n`;
          contextPrompt += `   module.exports = { router };\n`;
        }

        // Show schema
        contextPrompt += `\n   Schema Fields (USE ONLY THESE):\n`;
        table.fields.forEach(field => {
          contextPrompt += `   • ${field.name}: ${field.type}`;
          if (field.required) contextPrompt += ' (REQUIRED)';
          if (field.unique) contextPrompt += ' (UNIQUE)';
          if (field.references) contextPrompt += ` (FK → ${field.references})`;
          contextPrompt += '\n';
        });
      }
    });
    contextPrompt += '='.repeat(80) + '\n';
  }

  // Required files reminder
  contextPrompt += `\n\n📋 REQUIRED FILES (${moduleSpec.requiredFiles.length}):\n`;
  contextPrompt += '='.repeat(80) + '\n';
  moduleSpec.requiredFiles.forEach((f, i) => {
    const isCritical = moduleSpec.criticalFiles?.includes(f);
    contextPrompt += `${i + 1}. ${isCritical ? '🔴 CRITICAL' : '📄'} ${f}\n`;
  });
  contextPrompt += '='.repeat(80) + '\n';

  return contextPrompt;
}

// ============================================================================
// FIXED: DATABASE NAME CONSISTENCY
// ============================================================================

function getConsistentDbName(project: Project): string {
  // Use same logic everywhere
  return project.database?.name ||
    project.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

// ============================================================================
// MODULE GENERATION WITH IMPROVED VALIDATION
// ============================================================================

async function generateModuleWithValidation(
  moduleSpec: ModuleSpec,
  ctx: EnhancedGenerationContext,
  attemptNumber = 1
): Promise<ModuleResult> {
  const MAX_ATTEMPTS = 4;

  try {
    console.log(`\n🔄 Generating ${moduleSpec.type} (attempt ${attemptNumber}/${MAX_ATTEMPTS})...`);

    // Special handling for Docker module
    if (moduleSpec.type === 'docker') {
      const dockerFiles = [
        generateEnhancedDockerEntrypoint(ctx.project),
        generateEnhancedDockerfile(ctx.project, ctx.options),
        generateEnhancedDockerCompose(ctx.project, ctx.options),
        generateEnhancedEnvExample(ctx.project, ctx.options),
        generateDockerIgnore()
      ];

      dockerFiles.forEach(file => {
        ctx.functionRegistry.register(file.path, file.content);
      });

      return {
        type: moduleSpec.type,
        files: dockerFiles,
        dependencies: {},
        devDependencies: {},
        success: true,
        validated: true,
        attempt: 1
      };
    }

    // Terraform module
    if (moduleSpec.type === 'terraform') {
      console.log('   🏗️  Generating Terraform infrastructure...');

      const terraformFiles: GeneratedFile[] = [
        generateTerraformMain(ctx.project, ctx.options),
        generateTerraformVariables(ctx.project, ctx.options),
        generateTerraformOutputs(ctx.project),
        generateTerraformVPCModule(),
        generateTerraformSecurityModule(),
        generateTerraformRDSModule(),
        generateTerraformECRModule(),
        generateTerraformECSModule(ctx.project, ctx.options),
        generateTerraformTfvarsExample(ctx.project, ctx.options),
        generateDeploymentScript(ctx.project),
        generateTerraformReadme(ctx.project, ctx.options)
      ];

      terraformFiles.forEach(file => {
        ctx.functionRegistry.register(file.path, file.content);
      });

      console.log(`   ✅ Generated ${terraformFiles.length} Terraform files`);

      return {
        type: moduleSpec.type,
        files: terraformFiles,
        dependencies: {},
        devDependencies: {},
        success: true,
        validated: true,
        attempt: 1
      };
    }

    // 🔥 IMPROVED: System prompt with stricter rules
    const systemPrompt = `You are a code generator that outputs ONLY valid JSON.

OUTPUT FORMAT:
{
  "files": [
    {
      "path": "src/file.js",
      "content": "code here with \\n for newlines",
      "description": "brief description"
    }
  ],
  "dependencies": {"package": "^1.0.0"},
  "devDependencies": {},
  "success": true
}

🚨 CRITICAL RULES - FOLLOW EXACTLY:

1. ✅ NAMED EXPORTS ONLY
   ALWAYS: module.exports = { fn1, fn2, fn3 };
   NEVER: module.exports = fn1;

2. ✅ IMPORT ONLY LISTED FUNCTIONS
   - Look at "FUNCTIONS AVAILABLE FROM DEPENDENCIES" section
   - Copy function names EXACTLY as shown
   - Use the EXACT import paths provided
   - DO NOT create new function names

3. ✅ EXACT IMPORT SYNTAX
   const { fn1, fn2 } = require('./path');
   - Match export names from dependency section
   - Use relative paths as shown

4. ✅ CAMELCASE FILENAMES
   user.js, userService.js, userHandler.js

5. ✅ USE ONLY SCHEMA FIELDS
   - Only use fields listed in "Schema (USE ONLY THESE FIELDS)"
   - DO NOT add role, status, or any unlisted fields

6. ✅ COMPLETE IMPLEMENTATIONS
   - NO placeholders or TODO comments
   - Full working code for all functions

7. ✅ SSL CONFIGURATION
   - For local development: ssl: false
   - For production: ssl: { rejectUnauthorized: false }
   - Use environment check: process.env.NODE_ENV === 'production'

OTHER:
- Use CommonJS (require/module.exports) - NO ES6 imports
- Functional approach - NO classes
- PostgreSQL with pg library`;

    const userPrompt = buildEnhancedContextPrompt(moduleSpec, ctx, attemptNumber);

    console.log(`   📝 Context size: ${userPrompt.length} chars`);
    console.log(`   📚 Available functions: ${ctx.functionRegistry.getStats().totalFunctions}`);

    const result = await generateWithRetry(async () => {
      const response = await generateText({
        model: groq(ctx.options.model || 'llama-3.3-70b-versatile'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.05,
        maxTokens: 16000
      });
      return response;
    }, 4, 6000);

    const cleaned = cleanJSONResponse(result.text);
    let parsed: ParsedResponse;

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      const repaired = repairJSON(cleaned);
      parsed = JSON.parse(repaired);
    }

    if (!parsed.files || parsed.files.length === 0) {
      throw new Error('No files generated');
    }

    // 🔥 IMPROVED: Validation with detailed reporting
    const validationIssues: string[] = [];
    const importIssues: Map<string, string[]> = new Map();

    parsed.files.forEach(file => {
      // Register file
      const fileContext = ctx.functionRegistry.register(file.path, file.content);
      file.exports = fileContext.exports;

      console.log(`   📄 ${file.path}`);
      if (fileContext.functions.length > 0) {
        console.log(`      Functions: ${fileContext.functions.map(f => f.name).join(', ')}`);
      }
      if (fileContext.exports.length > 0) {
        console.log(`      Exports: ${fileContext.exports.join(', ')}`);
      }

      // Check for default exports
      if (file.content.match(/module\.exports\s*=\s*[^{]/)) {
        validationIssues.push(`${file.path}: ❌ Default export detected`);
      }

      // Validate imports
      const issues = ctx.functionRegistry.validateImports(file.path);
      if (issues.length > 0) {
        const fileIssues: string[] = [];
        issues.forEach(issue => {
          fileIssues.push(`  ❌ ${issue.issue}: "${issue.import}" from "${issue.from}"`);
        });
        importIssues.set(file.path, fileIssues);
      }
    });

    console.log(`   ✓ Generated ${parsed.files.length} files`);
    console.log(`   ✓ Registered ${parsed.files.reduce((sum, f) => sum + (ctx.functionRegistry.get(f.path)?.functions.length || 0), 0)} functions`);

    // Report validation issues
    if (validationIssues.length > 0 || importIssues.size > 0) {
      console.warn(`\n   ⚠️  VALIDATION ISSUES:\n`);

      validationIssues.forEach(issue => console.warn(`   ${issue}`));

      if (importIssues.size > 0) {
        console.warn(`\n   📥 IMPORT ISSUES:\n`);
        importIssues.forEach((issues, file) => {
          console.warn(`\n   ${file}:`);
          issues.forEach(issue => console.warn(issue));

          // Show suggestions
          const suggestions = ctx.functionRegistry.generateImportSuggestions(file);
          if (suggestions.length > 0) {
            console.warn(`\n   💡 Suggestions:`);
            suggestions.forEach(s => console.warn(s));
          }
        });
      }

      // If critical issues, retry
      if (attemptNumber < MAX_ATTEMPTS && importIssues.size > 0) {
        console.warn(`\n   🔄 Retrying due to import issues...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return generateModuleWithValidation(moduleSpec, ctx, attemptNumber + 1);
      }
    }

    // Update file registry
    parsed.files.forEach(file => {
      const fileContext = parseFilePath(file.path);
      fileContext.exports = file.exports;
      ctx.fileRegistry.set(file.path, fileContext);
    });

    return {
      type: moduleSpec.type,
      files: parsed.files,
      dependencies: parsed.dependencies || {},
      devDependencies: parsed.devDependencies || {},
      success: true,
      validated: parsed.files.length >= Math.ceil(moduleSpec.requiredFiles.length * 0.7),
      attempt: attemptNumber
    };

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);

    if (attemptNumber < MAX_ATTEMPTS) {
      const delay = 10000 * attemptNumber;
      console.log(`   🔄 Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateModuleWithValidation(moduleSpec, ctx, attemptNumber + 1);
    }

    return {
      type: moduleSpec.type,
      files: [],
      dependencies: {},
      devDependencies: {},
      success: false,
      validated: false,
      attempt: attemptNumber,
      error: error.message
    };
  }
}

// ============================================================================
// FIXED: MIGRATION UTILITY WITH CONSISTENT DB NAME & SSL
// ============================================================================

function generateMigrationUtility(project: Project): GeneratedFile {
  const dbName = getConsistentDbName(project);

  const content = `const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 🔥 FIX: SSL Configuration - Disabled for local, enabled for production
const getSslConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isLocal = nodeEnv === 'development' || process.env.DB_HOST === 'localhost';
  
  if (isLocal) {
    console.log('   🔓 SSL: Disabled (local development)');
    return false;
  }
  
  console.log('   🔒 SSL: Enabled (production/AWS RDS)');
  return {
    rejectUnauthorized: false, // AWS RDS
  };
};

// 🔥 FIX: Consistent database name
const DB_NAME = process.env.DB_NAME || '${dbName}';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: DB_NAME,
  
  // SSL Configuration
  ssl: getSslConfig(),
  
  // Connection settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  
  // Keep connection alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Log configuration
console.log('🔧 Migration utility configuration:');
console.log(\`   Environment: \${process.env.NODE_ENV || 'development'}\`);
console.log(\`   Database: \${DB_NAME}\`);
console.log(\`   Host: \${process.env.DB_HOST || 'localhost'}\`);

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

const createMigrationTable = async () => {
  const query = \`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  \`;
  
  try {
    await pool.query(query);
    console.log('✅ Migration table ready');
  } catch (error) {
    console.error('❌ Failed to create migration table:', error.message);
    throw error;
  }
};

const getExecutedMigrations = async () => {
  try {
    const result = await pool.query('SELECT name FROM migrations ORDER BY id ASC');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('❌ Failed to get executed migrations:', error.message);
    throw error;
  }
};

const recordMigration = async (name) => {
  try {
    await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
  } catch (error) {
    console.error(\`❌ Failed to record migration \${name}:\`, error.message);
    throw error;
  }
};

const migrateUp = async () => {
  console.log('\\n🚀 Starting database migration...');
  console.log('='.repeat(60));
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    await createMigrationTable();
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    console.log(\`📁 Found \${sqlFiles.length} migration files\`);
    
    const executed = await getExecutedMigrations();
    console.log(\`✓ Already executed: \${executed.length} migrations\`);
    
    const pending = sqlFiles.filter(f => !executed.includes(f));
    console.log(\`⏳ Pending: \${pending.length} migrations\\n\`);
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations - database is up to date');
      console.log('='.repeat(60));
      return;
    }
    
    for (const migration of pending) {
      console.log(\`📝 Executing: \${migration}\`);
      const filePath = path.join(migrationsDir, migration);
      const sql = await fs.readFile(filePath, 'utf8');
      
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await recordMigration(migration);
        await pool.query('COMMIT');
        console.log(\`   ✅ Success: \${migration}\\n\`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(\`   ❌ Failed: \${migration}\`);
        console.error(\`   Error: \${error.message}\\n\`);
        throw error;
      }
    }
    
    console.log('='.repeat(60));
    console.log(\`✅ Migration complete! Executed \${pending.length} migrations\`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\\n❌ Migration failed:', error.message);
    console.error('='.repeat(60));
    throw error;
  }
};

const main = async () => {
  const command = process.argv[2] || 'up';
  
  try {
    if (command === 'up') {
      await migrateUp();
    } else {
      console.log(\`❌ Unknown command: \${command}\`);
      console.log('Available commands: up');
      process.exit(1);
    }
  } catch (error) {
    console.error('\\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\\n📊 Database connection closed');
  }
};

if (require.main === module) {
  main();
}

module.exports = { migrateUp, getExecutedMigrations };`;

  return {
    path: 'src/database/migrate.js',
    content,
    description: 'Migration utility with SSL auto-detection and consistent DB name'
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generateCode(
  project: Project,
  options: CodeGenOptions,
  onProgress?: ProgressCallback
): Promise<CodeGenerationResult> {
  console.log('\n🚀 Starting code generation with enhanced context passing...');
  console.log(`📦 Project: ${project.name}`);
  console.log(`🗄️  Database: ${getConsistentDbName(project)}`);
  console.log(`🏗️  Framework: ${options.framework}`);
  console.log(`🔐 Auth: ${options.includeAuth ? 'Yes' : 'No'}`);
  console.log(`🧪 Tests: ${options.includeTests ? 'Yes' : 'No'}`);

  // Initialize context
  const ctx: EnhancedGenerationContext = {
    project,
    options,
    generatedFiles: new Map(),
    fileRegistry: new Map(),
    functionRegistry: new FunctionRegistry(),
    moduleResults: new Map(),
    allDependencies: {},
    allDevDependencies: {},
    tableNames: project.schema.map(t => t.name),
    failedAttempts: new Map()
  };

  try {
    // Get base dependencies
    const baseDeps = getBaseDependencies(options.framework);
    Object.assign(ctx.allDependencies, baseDeps.dependencies);
    Object.assign(ctx.allDevDependencies, baseDeps.devDependencies);

    addConditionalDependencies(project, options, ctx.allDependencies, ctx.allDevDependencies);

    // Get module specs
    const moduleSpecs = getModuleSpecs(project, options);
    console.log(`\n📋 Generating ${moduleSpecs.length} modules in dependency order...\n`);

    // Generate modules in priority order (dependencies first)
    for (let i = 0; i < moduleSpecs.length; i++) {
      const spec = moduleSpecs[i];

      if (onProgress) {
        onProgress(spec.type, i + 1, moduleSpecs.length);
      }

      console.log(`\n[${i + 1}/${moduleSpecs.length}] 🔨 Module: ${spec.type}`);
      console.log(`   Priority: ${spec.priority}`);
      console.log(`   Dependencies: ${spec.dependencies.length > 0 ? spec.dependencies.join(', ') : 'none'}`);
      console.log(`   Description: ${spec.description}`);

      const result = await generateModuleWithValidation(spec, ctx);
      ctx.moduleResults.set(spec.type, result);

      if (result.success) {
        result.files.forEach(file => {
          ctx.generatedFiles.set(file.path, file);
        });

        Object.assign(ctx.allDependencies, result.dependencies);
        Object.assign(ctx.allDevDependencies, result.devDependencies);

        console.log(`   ✅ Success: ${result.files.length} files generated`);

        // Show what's now available for next modules
        const stats = ctx.functionRegistry.getStats();
        console.log(`   📊 Registry: ${stats.totalFunctions} functions, ${stats.totalExports} exports`);
      } else {
        console.warn(`   ⚠️  Failed: ${result.error || 'Unknown error'}`);
      }

      // Rate limiting
      if (i < moduleSpecs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate remaining files
    console.log('\n📦 Generating package.json...');
    const packageJson = generatePackageJson(project, options, ctx.allDependencies, ctx.allDevDependencies);
    ctx.generatedFiles.set(packageJson.path, packageJson);

    console.log('🔄 Generating migration utility...');
    const migrationUtil = generateMigrationUtility(project);
    ctx.generatedFiles.set(migrationUtil.path, migrationUtil);
    ctx.functionRegistry.register(migrationUtil.path, migrationUtil.content);

    console.log('🚪 Generating entry point...');
    const entryPoint = generateEntryPoint(project, options, ctx);
    ctx.generatedFiles.set(entryPoint.path, entryPoint);
    ctx.functionRegistry.register(entryPoint.path, entryPoint.content);

    // Generate instructions
    console.log('📝 Generating setup instructions...');
    const instructions = generateEnhancedInstructions(project, options, ctx);

    // Final stats
    const successfulModules = Array.from(ctx.moduleResults.values()).filter(m => m.success && m.validated);
    const totalModules = ctx.moduleResults.size;
    const successRate = (successfulModules.length / totalModules) * 100;
    const registryStats = ctx.functionRegistry.getStats();

    console.log('\n' + '='.repeat(70));
    console.log('✅ CODE GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`📦 Total Files: ${ctx.generatedFiles.size}`);
    console.log(`✅ Validated Modules: ${successfulModules.length}/${totalModules}`);
    console.log(`🔧 Total Functions: ${registryStats.totalFunctions}`);
    console.log(`📤 Total Exports: ${registryStats.totalExports}`);
    console.log(`🏭 Factories: ${registryStats.factoryCount}`);
    console.log(`🎯 Handlers: ${registryStats.handlerCount}`);
    console.log(`🗄️  Database: ${getConsistentDbName(project)}`);
    console.log('='.repeat(70) + '\n');

    return {
      files: Array.from(ctx.generatedFiles.values()),
      instructions,
      dependencies: ctx.allDependencies,
      devDependencies: ctx.allDevDependencies,
      success: successRate >= 70,
      error: successRate < 70 ? 'Some modules failed validation' : undefined
    };

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);

    return {
      files: Array.from(ctx.generatedFiles.values()),
      instructions: generateEnhancedInstructions(project, options, ctx),
      dependencies: ctx.allDependencies,
      devDependencies: ctx.allDevDependencies,
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Replace getModuleSpecs function in document 3
function getModuleSpecs(project: Project, options: CodeGenOptions): ModuleSpec[] {
  const tableNames = project.schema.map(t => t.name);

  const specs: ModuleSpec[] = [
    {
      type: 'config',
      priority: 1,
      dependencies: [],
      description: 'Configuration files (package.json, .env, etc.)',
      requiredFiles: ['package.json', '.eslintrc.json', '.env.example', '.gitignore', 'README.md'],
      criticalFiles: ['package.json', '.env.example']
    },
    {
      type: 'docker',
      priority: 2,
      dependencies: [],
      description: 'Docker configuration files',
      requiredFiles: ['Dockerfile', 'docker-compose.yml', '.dockerignore', 'docker-entrypoint.sh'],
      criticalFiles: ['Dockerfile', 'docker-compose.yml', 'docker-entrypoint.sh']
    },
    {
      type: 'utils',
      priority: 3,
      dependencies: [],
      description: 'Utility functions and helpers',
      requiredFiles: [
        'src/utils/index.js',
        'src/utils/errors.js',      // PLURAL
        'src/utils/responses.js',   // PLURAL
        'src/utils/validations.js', // PLURAL
        'src/utils/loggers.js'      // PLURAL
      ],
      criticalFiles: ['src/utils/index.js', 'src/utils/errors.js']
    },
    {
      type: 'database',
      priority: 4,
      dependencies: [],
      tables: tableNames,
      description: 'Database connection and migrations',
      requiredFiles: [
        'src/database/index.js',
        'src/database/connections.js',  // PLURAL
        'src/database/migrate.js',
        'src/database/migrations/001_initial_schema.sql',
        'src/database/seeds.js'         // PLURAL
      ],
      criticalFiles: ['src/database/index.js', 'src/database/connections.js', 'src/database/migrate.js']
    },
    {
      type: 'models',
      priority: 5,
      dependencies: ['database', 'utils'],
      tables: tableNames,
      description: 'Database models for all tables',
      requiredFiles: [
        'src/models/index.js',
        ...tableNames.map(table => `src/models/${NAMING_STANDARDS.MODEL_FILE(table)}`) // PLURAL
      ],
      minFiles: tableNames.length + 1,
      criticalFiles: ['src/models/index.js']
    },
    {
      type: 'middleware',
      priority: 6,
      dependencies: ['utils'],
      description: 'Express middleware',
      requiredFiles: [
        'src/middleware/index.js',
        'src/middleware/errorHandlers.js',  // PLURAL
        'src/middleware/validations.js',    // PLURAL
        'src/middleware/loggers.js'         // PLURAL
      ],
      criticalFiles: ['src/middleware/index.js', 'src/middleware/errorHandlers.js']
    }
  ];

  if (options.includeAuth) {
    specs.push({
      type: 'auth',
      priority: 7,
      dependencies: ['utils', 'database'],
      description: 'Authentication system',
      requiredFiles: [
        'src/auth/index.js',
        'src/auth/middlewares.js',  // PLURAL
        'src/auth/handlers.js',     // PLURAL
        'src/auth/services.js',     // PLURAL
        'src/auth/routes.js',       // PLURAL
        'src/auth/utils.js'         // PLURAL
      ],
      criticalFiles: ['src/auth/index.js', 'src/auth/handlers.js']
    });
  }

  specs.push({
    type: 'services',
    priority: 8,
    dependencies: ['models', 'utils'],
    tables: tableNames,
    description: 'Business logic services',
    requiredFiles: [
      'src/services/index.js',
      ...tableNames.map(table => `src/services/${NAMING_STANDARDS.SERVICE_FILE(table)}`) // PLURAL
    ],
    minFiles: tableNames.length + 1,
    criticalFiles: ['src/services/index.js']
  });

  specs.push({
    type: 'handlers',
    priority: 9,
    dependencies: ['services', 'utils'],
    tables: tableNames,
    description: 'Request handlers with functional approach',
    requiredFiles: [
      'src/handlers/index.js',
      ...tableNames.map(table => `src/handlers/${NAMING_STANDARDS.HANDLER_FILE(table)}`) // PLURAL
    ],
    minFiles: tableNames.length + 1,
    criticalFiles: ['src/handlers/index.js']
  });

  specs.push({
    type: 'routes',
    priority: 10,
    dependencies: ['handlers', 'middleware'],
    tables: tableNames,
    description: 'API route definitions',
    requiredFiles: [
      'src/routes/index.js',
      ...tableNames.map(table => `src/routes/${NAMING_STANDARDS.ROUTE_FILE(table)}`) // PLURAL
    ],
    minFiles: tableNames.length + 1,
    criticalFiles: ['src/routes/index.js']
  });

  if (options.includeTests) {
    specs.push({
      type: 'tests',
      priority: 11,
      dependencies: [],
      description: 'Test files',
      requiredFiles: [
        'tests/setup.js',
        'tests/unit/models.test.js',
        'tests/integration/api.test.js'
      ],
      criticalFiles: ['tests/setup.js']
    });
  }

  specs.push({
    type: 'terraform',
    priority: 12,
    dependencies: [],
    description: 'Terraform infrastructure for AWS ECS deployment',
    requiredFiles: [
      'terraform/main.tf',
      'terraform/variables.tf',
      'terraform/outputs.tf',
      'terraform/terraform.tfvars.example',
      'terraform/modules/vpc/main.tf',
      'terraform/modules/security/main.tf',
      'terraform/modules/rds/main.tf',
      'terraform/modules/ecr/main.tf',
      'terraform/modules/ecs/main.tf',
      'deploy.sh',
      'terraform/README.md'
    ],
    criticalFiles: [
      'terraform/main.tf',
      'terraform/variables.tf',
      'deploy.sh'
    ]
  });

  return specs.sort((a, b) => a.priority - b.priority);
}

function generatePackageJson(
  project: Project,
  options: CodeGenOptions,
  allDependencies: Record<string, string>,
  allDevDependencies: Record<string, string>
): GeneratedFile {
  const dbName = getConsistentDbName(project);

  const packageJson = {
    name: project.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: project.description || `API for ${project.name}`,
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      dev: 'nodemon src/index.js',
      'migrate': 'node src/database/migrate.js',
      'migrate:create': 'node src/database/migrate.js create',
      'migrate:up': 'node src/database/migrate.js up',
      'migrate:down': 'node src/database/migrate.js down',
      'db:seed': 'node src/database/seed.js',
      'db:reset': 'npm run migrate:down && npm run migrate:up && npm run db:seed',
      lint: 'eslint src/',
      'lint:fix': 'eslint src/ --fix',
      format: 'prettier --write "src/**/*.js"',
      ...(options.includeTests && {
        test: 'jest --coverage',
        'test:watch': 'jest --watch',
        'test:integration': 'jest --testPathPattern=tests/integration'
      })
    },
    keywords: ['api', 'express', 'postgresql', 'rest', 'functional', 'mvc', 'docker'],
    author: '',
    license: 'MIT',
    dependencies: allDependencies,
    devDependencies: allDevDependencies,
    engines: {
      node: '>=18.0.0',
      npm: '>=9.0.0'
    },
    config: {
      database: dbName
    }
  };

  return {
    path: 'package.json',
    content: JSON.stringify(packageJson, null, 2),
    description: 'Node.js package configuration'
  };
}

// Replace generateEntryPoint function in document 3
function generateEntryPoint(
  project: Project,
  options: CodeGenOptions,
  ctx: EnhancedGenerationContext
): GeneratedFile {
  const content = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Import middleware - FIXED IMPORTS
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware');

// Import logger - FIXED IMPORTS
const { createLogger } = require('./utils/logger');

const logger = createLogger();

// Import routes with correct naming
${project.schema.map(table => {
    const routeFile = NAMING_STANDARDS.ROUTE_FILE(table.name).replace('.js', '');
    return `const { router: ${toCamelCase(table.name)}Router } = require('./routes/${routeFile}');`;
  }).join('\n')}
${options.includeAuth ? "const { router: authRouter } = require('./auth/routes');" : ''}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: '${project.name}',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_NAME || '${getConsistentDbName(project)}',
    architecture: 'Functional MVC'
  });
});

// API routes
${project.schema.map(table =>
    `app.use('/api/${NAMING_STANDARDS.ROUTE_URL(table.name)}', ${toCamelCase(table.name)}Router);`
  ).join('\n')}
${options.includeAuth ? "app.use('/api/auth', authRouter);" : ''}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('Server starting', {
      service: process.env.npm_package_name || '${project.name}',
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      database: process.env.DB_NAME || '${getConsistentDbName(project)}'
    });
    
    console.log('='.repeat(60));
    console.log(\`🚀 \${process.env.npm_package_name || '${project.name}'} Server\`);
    console.log('='.repeat(60));
    console.log(\`📡 Port: \${PORT}\`);
    console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`🗄️  Database: \${process.env.DB_NAME || '${getConsistentDbName(project)}'}\`);
    console.log('='.repeat(60));
    console.log(\`\\n✅ Server ready at http://localhost:\${PORT}\`);
    console.log(\`📊 Health check: http://localhost:\${PORT}/health\\n\`);
  });
}

module.exports = { app };`;

  return {
    path: 'src/index.js',
    content,
    description: 'Main application entry point',
    exports: ['app']
  };
}



function generateEnhancedInstructions(
  project: Project,
  options: CodeGenOptions,
  ctx: EnhancedGenerationContext
): string {
  const results = Array.from(ctx.moduleResults.values());
  const successCount = results.filter(m => m.success && m.validated).length;
  const totalCount = results.length;
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '0';
  const registryStats = ctx.functionRegistry.getStats();
  const dbName = getConsistentDbName(project);

  // Get import/export validation summary
  const totalFiles = ctx.generatedFiles.size;
  const filesWithIssues = Array.from(ctx.generatedFiles.values()).filter(file => {
    const issues = ctx.functionRegistry.validateImports(file.path);
    return issues.length > 0;
  }).length;

  return `# ${project.name} - Setup Instructions

## 📊 Generation Summary

✅ **Modules Generated:** ${successCount}/${totalCount} validated (${successRate}%)
📦 **Total Files:** ${totalFiles}
🔧 **Total Functions:** ${registryStats.totalFunctions}
📤 **Total Exports:** ${registryStats.totalExports}
🏭 **Factory Functions:** ${registryStats.factoryCount}
🎯 **Handler Functions:** ${registryStats.handlerCount}
${filesWithIssues > 0 ? `⚠️  **Import Issues:** ${filesWithIssues} files need review` : '✅ **Import Validation:** All passed'}

**Architecture:** Functional MVC (NO classes)
**Export Standard:** Named exports only (NO default exports)
**Naming Convention:** camelCase filenames
**Database:** ${dbName}
**SSL:** Auto-detected (disabled for local, enabled for production)

## 🔧 Function Registry by Module

${Array.from(registryStats.byModule.entries())
      .map(([module, count]) => `- **${module}**: ${count} files`)
      .join('\n')}

## 🚀 Quick Start (Docker - Recommended)

\`\`\`bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings (DB_HOST, DB_PASSWORD, etc.)

# 2. Build and start all services
docker-compose up -d

# 3. Check application logs
docker-compose logs -f app

# 4. Check database logs
docker-compose logs -f db

# 5. Test the API
curl http://localhost:3000/health
\`\`\`

## 💻 Local Development Setup (Without Docker)

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure environment for local PostgreSQL
cp .env.example .env

# Edit .env:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=${dbName}
# NODE_ENV=development

# 3. Ensure PostgreSQL is running locally
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service

# 4. Run migrations
npm run migrate:up

# 5. (Optional) Seed database
npm run db:seed

# 6. Start development server
npm run dev
\`\`\`

## 🗄️  Database Configuration

### SSL Settings (Auto-Detected)

The application automatically detects the environment:

**Local Development:**
- \`NODE_ENV=development\` OR \`DB_HOST=localhost\`
- SSL: **Disabled**
- Perfect for local PostgreSQL

**Production/AWS RDS:**
- \`NODE_ENV=production\` OR remote \`DB_HOST\`
- SSL: **Enabled** with \`rejectUnauthorized: false\`
- Works with AWS RDS out of the box

### Environment Variables

\`\`\`bash
# Database
DB_HOST=localhost           # Use RDS endpoint for production
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=${dbName}          # ✅ Consistent everywhere

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE=10000

# Application
NODE_ENV=development        # Change to 'production' for prod
PORT=3000
\`\`\`

## 📡 API Endpoints

### 🏥 Health Check

\`\`\`bash
GET /health
\`\`\`

${project.schema.map(table => `
### 📋 ${toPascalCase(table.name)} API

**Base URL:** \`/api/${toCamelCase(table.name)}\`

- \`GET /\` - List all ${table.name} (supports filtering, pagination, sorting)
- \`GET /:id\` - Get ${table.name} by ID
- \`POST /\` - Create new ${table.name}
- \`PUT /:id\` - Update ${table.name}
- \`DELETE /:id\` - Delete ${table.name}

**Fields:**
${table.fields.map(f => `- \`${f.name}\`: ${f.type}${f.required ? ' (required)' : ''}${f.unique ? ' (unique)' : ''}${f.references ? ` (FK → ${f.references})` : ''}`).join('\n')}
`).join('\n')}

${options.includeAuth ? `
### 🔐 Authentication API

**Base URL:** \`/api/auth\`

- \`POST /register\` - Register new user
- \`POST /login\` - Login and get JWT token
- \`POST /refresh\` - Refresh JWT token
- \`GET /me\` - Get current authenticated user
` : ''}

## 📝 Available Scripts

\`\`\`bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server

# Database
npm run migrate:up       # Run all pending migrations
npm run migrate:down     # Rollback last migration
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset and reseed database

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

${options.includeTests ? `# Testing
npm test                 # Run all tests with coverage
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests only
` : ''}\`\`\`

## 🏗️  Architecture Principles

### ✅ Named Exports Only

\`\`\`javascript
// ❌ WRONG - Default export
module.exports = createUserModel;

// ✅ CORRECT - Named exports
module.exports = { createUserModel };
\`\`\`

### ✅ Functional Factory Pattern

\`\`\`javascript
// Factory function that returns an object with methods
const createUserService = () => {
  const userModel = createUserModel();
  
  const getAll = async (filters, options) => {
    return await userModel.findAll(filters, options);
  };
  
  const getById = async (id) => {
    const user = await userModel.findById(id);
    if (!user) throw createNotFoundError('User not found');
    return user;
  };
  
  return { getAll, getById };
};

module.exports = { createUserService };
\`\`\`

### ✅ CamelCase Naming Convention

- **Files:** \`user.js\`, \`userService.js\`, \`userHandler.js\`
- **Factories:** \`createUserModel\`, \`createUserService\`
- **Handlers:** \`handleGetUser\`, \`handleCreateUser\`
- **Routes:** \`user.route.js\`

### ✅ Import/Export Consistency

\`\`\`javascript
// Export in models/user.js
module.exports = { createUserModel };

// Import in services/userService.js
const { createUserModel } = require('../models/user');

// Export in services/userService.js
module.exports = { createUserService };

// Import in handlers/userHandler.js
const { createUserService } = require('../services/userService');
\`\`\`

## 🐳 Docker Commands

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app        # Application logs
docker-compose logs -f db         # Database logs

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec db psql -U postgres -d ${dbName}

# Execute migrations manually
docker-compose exec app npm run migrate:up

# Reset everything
docker-compose down -v            # Remove volumes
docker-compose up -d --build      # Rebuild and start
\`\`\`

## ✅ Module Validation Results

${results.map(result => `
### ${result.type.toUpperCase()}
- **Status:** ${result.success ? '✅ Success' : '❌ Failed'}
- **Validated:** ${result.validated ? '✅ Yes' : '⚠️ Partial'}
- **Files:** ${result.files.length}
- **Attempt:** ${result.attempt}
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('\n')}

## 🔍 Troubleshooting

### Import/Export Issues

If you encounter import errors:

1. Check that function names match exactly (case-sensitive)
2. Verify export syntax: \`module.exports = { functionName }\`
3. Check import paths are correct relative paths
4. Review the function registry in this document

### SSL Connection Issues

**Local PostgreSQL:**
\`\`\`bash
# In .env
DB_HOST=localhost
NODE_ENV=development
\`\`\`

**AWS RDS:**
\`\`\`bash
# In .env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
NODE_ENV=production
\`\`\`

### Database Connection Issues

\`\`\`bash
# Test connection
docker-compose exec db psql -U postgres -d ${dbName} -c "SELECT 1"

# Check database exists
docker-compose exec db psql -U postgres -l

# Recreate database
docker-compose exec db psql -U postgres -c "DROP DATABASE IF EXISTS ${dbName}"
docker-compose exec db psql -U postgres -c "CREATE DATABASE ${dbName}"
docker-compose exec app npm run migrate:up
\`\`\`

## 📚 Additional Resources

- **Express.js:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Docker:** https://docs.docker.com/
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices

---

**Generated with Enhanced Functional MVC Code Generator**
- ✅ Context-Aware Generation
- ✅ Function Registry & Validation
- ✅ Auto SSL Detection
- ✅ Consistent Database Naming
- ✅ Import/Export Tracking
`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateCode as default,
  generateModuleWithValidation,
  generatePackageJson,
  generateMigrationUtility,
  generateEntryPoint,
  generateEnhancedInstructions,
  buildEnhancedContextPrompt,
  getModuleSpecs,
  getConsistentDbName,

  // Re-export types
  type Project,
  type CodeGenOptions,
  type ModuleSpec,
  type GeneratedFile,
  type FileContext,
  type GenerationContext,
  type ParsedResponse,
  type ModuleResult,
  type CodeGenerationResult,
  type ProgressCallback,
  type FunctionInfo,
  type EnhancedFileContext,

  // Re-export utilities
  FunctionRegistry,
  getCodeGenOptions,
  LANGUAGE
};