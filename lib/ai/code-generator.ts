// ============================================================================
// CODE GENERATOR - ENHANCED WITH FUNCTION TRACKING
// ============================================================================

import { generateText } from 'ai';
import { groq } from './groq-client';

// Import utilities - NO DUPLICATES
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

  // Import FunctionRegistry and related types from utils
  type FunctionInfo,
  type EnhancedFileContext,
  FunctionRegistry,

  LANGUAGE,
  GENERATION_CONFIG,
  EXPORT_STANDARDS,
  MODULE_PROMPTS,

  toCamelCase,
  toPascalCase,
  NAMING_STANDARDS,
  getStandardFilePath,

  cleanJSONResponse,
  repairJSON,

  parseFilePath,
  extractExports,
  buildFileRegistryContext,

  generateWithRetry,

  generateEnhancedDockerEntrypoint,
  generateEnhancedDockerfile,
  generateEnhancedDockerCompose,
  generateEnhancedEnvExample,
  generateDockerIgnore,

  getCodeGenOptions,
  getBaseDependencies,
  addConditionalDependencies,
} from './code-generator-utils';
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
// ENHANCED GENERATION CONTEXT (Extends base context)
// ============================================================================

export interface EnhancedGenerationContext extends GenerationContext {
  functionRegistry: FunctionRegistry;
}

// ============================================================================
// ENHANCED CONTEXT BUILDING
// ============================================================================

function buildEnhancedContextPrompt(
  moduleSpec: ModuleSpec,
  ctx: EnhancedGenerationContext,
  attemptNumber: number
): string {
  let contextPrompt = EXPORT_STANDARDS + '\n\n';
  contextPrompt += MODULE_PROMPTS[moduleSpec.type] || '';

  // Use the FunctionRegistry's buildContextForAI method
  contextPrompt += ctx.functionRegistry.buildContextForAI();

  // Add dependency-specific context if needed
  if (moduleSpec.dependencies.length > 0) {
    contextPrompt += ctx.functionRegistry.buildDependencyContext(moduleSpec.dependencies);
  }

  if (attemptNumber > 1) {
    contextPrompt += `\n\n🔄 RETRY ATTEMPT ${attemptNumber}:\n`;
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '⚠️  Previous attempt had issues. Follow these rules:\n';
    contextPrompt += '   1. Generate ALL required files listed below\n';
    contextPrompt += '   2. Use CORRECT export syntax: module.exports = { fn1, fn2 };\n';
    contextPrompt += '   3. Import ONLY functions listed in "AVAILABLE FUNCTIONS" above\n';
    contextPrompt += '   4. Copy function names EXACTLY - no typos, no variations\n';
    contextPrompt += '   5. Use the exact import paths shown above\n';
    contextPrompt += '='.repeat(80) + '\n';
  }

  if (moduleSpec.tables && moduleSpec.tables.length > 0) {
    contextPrompt += `\n\n📊 ENTITIES TO GENERATE FOR THIS MODULE:\n`;
    contextPrompt += '='.repeat(80) + '\n';
    moduleSpec.tables.forEach(tableName => {
      const table = ctx.project.schema.find(t => t.name === tableName);
      if (table) {
        contextPrompt += `\n${tableName}:\n`;
        if (moduleSpec.type === 'models') {
          contextPrompt += `  • Filename: ${NAMING_STANDARDS.MODEL_FILE(tableName)}\n`;
          contextPrompt += `  • Factory export: ${NAMING_STANDARDS.MODEL_FACTORY(tableName)}\n`;
        } else if (moduleSpec.type === 'services') {
          contextPrompt += `  • Filename: ${NAMING_STANDARDS.SERVICE_FILE(tableName)}\n`;
          contextPrompt += `  • Factory export: ${NAMING_STANDARDS.SERVICE_FACTORY(tableName)}\n`;
          contextPrompt += `  • Import model: const { ${NAMING_STANDARDS.MODEL_FACTORY(tableName)} } = require('${NAMING_STANDARDS.MODEL_PATH(tableName)}');\n`;
        } else if (moduleSpec.type === 'handlers') {
          contextPrompt += `  • Filename: ${NAMING_STANDARDS.HANDLER_FILE(tableName)}\n`;
          contextPrompt += `  • Exports: handle${toPascalCase(tableName)}GetAll, handle${toPascalCase(tableName)}Get, etc.\n`;
          contextPrompt += `  • Import service: const { ${NAMING_STANDARDS.SERVICE_FACTORY(tableName)} } = require('${NAMING_STANDARDS.SERVICE_PATH(tableName)}');\n`;
        } else if (moduleSpec.type === 'routes') {
          contextPrompt += `  • Filename: ${NAMING_STANDARDS.ROUTE_FILE(tableName)}\n`;
          contextPrompt += `  • Import handlers from: ${NAMING_STANDARDS.HANDLER_PATH(tableName)}\n`;
        }

        // 🔥 ENHANCED: Show complete field definitions with constraints
        contextPrompt += `  • Schema Definition:\n`;
        table.fields.forEach(field => {
          contextPrompt += `    - ${field.name}: ${field.type}`;
          if (field.required) contextPrompt += ' (REQUIRED)';
          if (field.unique) contextPrompt += ' (UNIQUE)';
          if (field.references) contextPrompt += ` (FK → ${field.references})`;
          contextPrompt += '\n';
        });
      }
    });
    contextPrompt += '\n⚠️  CRITICAL: Only use the fields listed above in your SQL queries and model methods.\n';
    contextPrompt += '⚠️  DO NOT add fields like "role", "status", or any other fields not in the schema.\n';
    contextPrompt += '='.repeat(80) + '\n';
  }

  contextPrompt += `\n\n📋 FILES TO GENERATE (${moduleSpec.requiredFiles.length} total):\n`;
  contextPrompt += '='.repeat(80) + '\n';
  moduleSpec.requiredFiles.forEach((f, i) => {
    const isCritical = moduleSpec.criticalFiles?.includes(f);
    const marker = isCritical ? '🔴 CRITICAL' : '📄';
    contextPrompt += `${i + 1}. ${marker} ${f}\n`;
  });
  contextPrompt += '='.repeat(80) + '\n';

  return contextPrompt;
}

// ============================================================================
// MODULE GENERATION WITH FUNCTION TRACKING
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

    if (moduleSpec.type === 'terraform') {
      console.log('   🏗️  Generating Terraform infrastructure...');

      const terraformFiles: GeneratedFile[] = [
        // Main configuration files
        generateTerraformMain(ctx.project, ctx.options),
        generateTerraformVariables(ctx.project, ctx.options),
        generateTerraformOutputs(ctx.project),

        // Module files
        generateTerraformVPCModule(),
        generateTerraformSecurityModule(),
        generateTerraformRDSModule(),
        generateTerraformECRModule(),
        generateTerraformECSModule(ctx.project, ctx.options),

        // Additional files
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

    const systemPrompt = `You are a code generator that outputs ONLY valid JSON.
Output format:
{
  "files": [{"path": "src/file.js", "content": "code here with \\n for newlines", "description": "brief"}],
  "dependencies": {"pkg": "^1.0.0"},
  "devDependencies": {},
  "success": true
}

🚨 CRITICAL EXPORT RULES (MUST FOLLOW):
1. ❌ NEVER use default exports: module.exports = fn;
2. ✅ ALWAYS use named exports: module.exports = { fn1, fn2 };
3. ✅ Import syntax: const { fn1, fn2 } = require('./path');
4. ✅ CAMELCASE filenames: user.js, userHandler.js, userService.js
5. ✅ Factory names: createUserModel, createUserService
6. ✅ Use EXACT function names from the FUNCTION REGISTRY provided in context

🔗 IMPORT VALIDATION RULES:
1. ONLY import functions that are explicitly listed in "AVAILABLE FUNCTIONS" section
2. Copy function names EXACTLY as shown - including capitalization
3. Use the EXACT import paths provided in "REQUIRED IMPORTS" section
4. DO NOT create new function names or variations
5. If a function is not listed, DO NOT import it

OTHER RULES:
- Use CommonJS (require/module.exports) - NO ES6 imports
- Use FUNCTIONAL approach - NO classes
- Complete implementations - NO placeholders
- Use exact file paths and function names from context`;

    const userPrompt = buildEnhancedContextPrompt(moduleSpec, ctx, attemptNumber);

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

    // Register files and validate imports
    const validationIssues: string[] = [];
    const importSuggestions: string[] = [];

    parsed.files.forEach(file => {
      // Register file with function tracking
      const fileContext = ctx.functionRegistry.register(file.path, file.content);

      // Store exports for backward compatibility
      file.exports = fileContext.exports;

      // Log registered functions
      console.log(`   📄 ${file.path}`);
      if (fileContext.functions.length > 0) {
        console.log(`      Functions: ${fileContext.functions.map(f => f.name).join(', ')}`);
      }
      if (fileContext.exports.length > 0) {
        console.log(`      Exports: ${fileContext.exports.join(', ')}`);
      }

      // Validate no default exports
      if (file.content.includes('module.exports =') &&
        !file.content.includes('module.exports = {')) {
        console.warn(`   ⚠️  Warning: ${file.path} may have default export`);
        validationIssues.push(`${file.path}: Possible default export detected`);
      }

      // Validate imports
      const issues = ctx.functionRegistry.validateImports(file.path);
      if (issues.length > 0) {
        validationIssues.push(`\n${file.path}:`);
        issues.forEach(issue => {
          validationIssues.push(`  ❌ ${issue.issue} - tried to import: ${issue.import} from: ${issue.from}`);

          // Generate suggestion using the registry method
          const suggestions = ctx.functionRegistry.generateImportSuggestions(file.path);
          importSuggestions.push(...suggestions);
        });
      }
    });

    console.log(`   ✓ Generated ${parsed.files.length} files`);
    console.log(`   ✓ Registered ${parsed.files.reduce((sum, f) => sum + (ctx.functionRegistry.get(f.path)?.functions.length || 0), 0)} functions`);

    if (validationIssues.length > 0) {
      console.warn(`\n   ⚠️  VALIDATION ISSUES FOUND:`);
      validationIssues.forEach(issue => console.warn(issue));

      if (importSuggestions.length > 0) {
        console.log(`\n   💡 IMPORT SUGGESTIONS:`);
        importSuggestions.forEach(suggestion => console.log(suggestion));
      }
    }

    // Update file registry (backward compatibility)
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
// MAIN GENERATION FUNCTION (ENHANCED)
// ============================================================================

export async function generateCode(
  project: Project,
  options: CodeGenOptions,
  onProgress?: ProgressCallback
): Promise<CodeGenerationResult> {
  console.log('\n🚀 Starting code generation with function tracking...');
  console.log(`📦 Project: ${project.name}`);
  console.log(`🏗️  Framework: ${options.framework}`);
  console.log(`🔐 Auth: ${options.includeAuth ? 'Yes' : 'No'}`);
  console.log(`🧪 Tests: ${options.includeTests ? 'Yes' : 'No'}`);

  // Initialize enhanced context with function registry
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

    // Add conditional dependencies
    addConditionalDependencies(project, options, ctx.allDependencies, ctx.allDevDependencies);

    // Get module specs
    const moduleSpecs = getModuleSpecs(project, options);
    console.log(`\n📋 Generating ${moduleSpecs.length} modules...`);

    // Generate modules in priority order
    for (let i = 0; i < moduleSpecs.length; i++) {
      const spec = moduleSpecs[i];

      if (onProgress) {
        onProgress(spec.type, i + 1, moduleSpecs.length);
      }

      console.log(`\n[${i + 1}/${moduleSpecs.length}] 🔨 Module: ${spec.type}`);
      console.log(`   Description: ${spec.description}`);

      const result = await generateModuleWithValidation(spec, ctx);
      ctx.moduleResults.set(spec.type, result);

      if (result.success) {
        result.files.forEach(file => {
          ctx.generatedFiles.set(file.path, file);
        });

        Object.assign(ctx.allDependencies, result.dependencies);
        Object.assign(ctx.allDevDependencies, result.devDependencies);

        console.log(`   ✅ Success: ${result.files.length} files`);
      } else {
        console.warn(`   ⚠️  Failed: ${result.error || 'Unknown error'}`);
      }

      // Rate limiting delay
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
    console.log('📝 Generating instructions...');
    const instructions = generateEnhancedInstructions(project, options, ctx);

    // Calculate final stats
    const successfulModules = Array.from(ctx.moduleResults.values()).filter(m => m.success && m.validated);
    const totalModules = ctx.moduleResults.size;
    const successRate = (successfulModules.length / totalModules) * 100;
    const registryStats = ctx.functionRegistry.getStats();

    console.log('\n' + '='.repeat(60));
    console.log('✅ CODE GENERATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`📦 Total Files: ${ctx.generatedFiles.size}`);
    console.log(`✅ Validated Modules: ${successfulModules.length}/${totalModules}`);
    console.log(`🔧 Total Functions: ${registryStats.totalFunctions}`);
    console.log(`📤 Total Exports: ${registryStats.totalExports}`);
    console.log(`🏭 Factories: ${registryStats.factoryCount}`);
    console.log(`🎯 Handlers: ${registryStats.handlerCount}`);
    console.log('='.repeat(60) + '\n');

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
        'src/utils/error.js',
        'src/utils/response.js',
        'src/utils/validation.js',
        'src/utils/logger.js'
      ],
      criticalFiles: ['src/utils/index.js', 'src/utils/error.js']
    },
    {
      type: 'database',
      priority: 4,
      dependencies: [],
      tables: tableNames,
      description: 'Database connection and migrations',
      requiredFiles: [
        'src/database/index.js',
        'src/database/connection.js',
        'src/database/migrate.js',
        'src/database/migrations/001_initial_schema.sql',
        'src/database/seed.js'
      ],
      criticalFiles: ['src/database/index.js', 'src/database/connection.js', 'src/database/migrate.js']
    },
    {
      type: 'models',
      priority: 5,
      dependencies: ['database', 'utils'],
      tables: tableNames,
      description: 'Database models for all tables',
      requiredFiles: [
        'src/models/index.js',
        ...tableNames.map(table => `src/models/${NAMING_STANDARDS.MODEL_FILE(table)}`)
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
        'src/middleware/errorHandler.js',
        'src/middleware/validation.js',
        'src/middleware/logger.js'
      ],
      criticalFiles: ['src/middleware/index.js', 'src/middleware/errorHandler.js']
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
        'src/auth/middleware.js',
        'src/auth/handler.js',
        'src/auth/service.js',
        'src/auth/route.js',
        'src/auth/util.js'
      ],
      criticalFiles: ['src/auth/index.js', 'src/auth/handler.js']
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
      ...tableNames.map(table => `src/services/${NAMING_STANDARDS.SERVICE_FILE(table)}`)
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
      ...tableNames.map(table => `src/handlers/${NAMING_STANDARDS.HANDLER_FILE(table)}`)
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
      ...tableNames.map(table => `src/routes/${NAMING_STANDARDS.ROUTE_FILE(table)}`)
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
        'tests/unit/example.test.js',
        'tests/integration/api.test.js'
      ],
      criticalFiles: ['tests/setup.js']
    });
  }

  specs.push({
    type: 'terraform',
    priority: 12, // After tests
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
    }
  };

  return {
    path: 'package.json',
    content: JSON.stringify(packageJson, null, 2),
    description: 'Node.js package configuration with migration scripts'
  };
}

function generateMigrationUtility(project: Project): GeneratedFile {
  const content = `const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || '${project.name.toLowerCase()}'
});

const createMigrationTable = async () => {
  const query = \`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  \`;
  await pool.query(query);
};

const getExecutedMigrations = async () => {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id ASC');
  return result.rows.map(row => row.name);
};

const recordMigration = async (name) => {
  await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
};

const migrateUp = async () => {
  await createMigrationTable();
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
  const executed = await getExecutedMigrations();
  const pending = sqlFiles.filter(f => !executed.includes(f));
  
  for (const migration of pending) {
    const filePath = path.join(migrationsDir, migration);
    const sql = await fs.readFile(filePath, 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await recordMigration(migration);
      await pool.query('COMMIT');
      console.log(\`✅ Migration executed: \${migration}\`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
};

const main = async () => {
  const command = process.argv[2] || 'up';
  try {
    if (command === 'up') await migrateUp();
  } finally {
    await pool.end();
  }
};

if (require.main === module) main();

module.exports = { migrateUp, getExecutedMigrations };`;

  return {
    path: 'src/database/migrate.js',
    content,
    description: 'Database migration utility script'
  };
}

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
const { errorHandler } = require('./middleware/errorHandler');
const { loggerMiddleware } = require('./middleware/logger');

${project.schema.map(table => {
    const routeFile = NAMING_STANDARDS.ROUTE_FILE(table.name);
    return `const { router: ${toCamelCase(table.name)}Router } = require('./routes/${routeFile.replace('.js', '')}');`;
  }).join('\n')}
${options.includeAuth ? "const { router: authRouter } = require('./auth/route');" : ''}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: '${project.name}',
    architecture: 'Functional MVC (camelCase)'
  });
});

${project.schema.map(table =>
    `app.use('/api/${toCamelCase(table.name)}', ${toCamelCase(table.name)}Router);`
  ).join('\n')}
${options.includeAuth ? "app.use('/api/auth', authRouter);" : ''}

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`🚀 ${project.name} running on port \${PORT}\`);
    console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`🏗️  Architecture: Functional MVC (camelCase)\`);
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

  return `# ${project.name} - Setup Instructions

## 📊 Generation Summary
✅ Successfully validated: ${successCount}/${totalCount} modules (${successRate}%)
📦 Total files generated: ${ctx.generatedFiles.size}
🔧 Total functions tracked: ${registryStats.totalFunctions}
📤 Total exports: ${registryStats.totalExports}
🏭 Factory functions: ${registryStats.factoryCount}
🎯 Handler functions: ${registryStats.handlerCount}
🏗️  Architecture: Functional MVC (NO classes)
📤 Export Standard: Named exports only (NO default exports)
📛 Naming Convention: camelCase filenames
🐳 Docker: Included with docker-compose
🎯 Quality: ${parseFloat(successRate) >= 90 ? '🟢 Excellent' : parseFloat(successRate) >= 70 ? '🟡 Good' : '🔴 Needs Review'}

## 🔧 Function Registry Summary

${Array.from(registryStats.byModule.entries())
      .map(([module, count]) => `- **${module}**: ${count} files`)
      .join('\n')}

## 🐳 Docker Setup (Quick Start)

\`\`\`bash
# 1. Configure environment
cp .env.example .env

# 2. Build and start services
docker-compose up -d

# 3. Check logs
docker-compose logs -f app

# 4. Access the API
curl http://localhost:3000/health
\`\`\`

## 📡 API Endpoints

${project.schema.map(table => `
### 📋 ${toPascalCase(table.name)}

**Base:** \`/api/${toCamelCase(table.name)}\`

- \`GET /\` - List all ${table.name}
- \`GET /:id\` - Get specific ${table.name}
- \`POST /\` - Create new ${table.name}
- \`PUT /:id\` - Update ${table.name}
- \`DELETE /:id\` - Delete ${table.name}
`).join('\n')}

${options.includeAuth ? `
### 🔐 Authentication

**Base:** \`/api/auth\`

- \`POST /register\` - Register new user
- \`POST /login\` - Login user
- \`POST /refresh\` - Refresh token
- \`GET /me\` - Get current user
` : ''}

## 🔧 Development Setup (Without Docker)

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
npm run migrate:up

# 4. Seed data (optional)
npm run db:seed

# 5. Start development server
npm run dev
\`\`\`

## 📝 Available Scripts

\`\`\`bash
npm start              # Start production server
npm run dev            # Start with nodemon
npm run migrate:up     # Run migrations
npm run migrate:down   # Rollback last migration
npm run db:seed        # Seed database
npm run db:reset       # Reset database
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format with Prettier
${options.includeTests ? `npm test              # Run tests
npm run test:watch     # Watch tests
npm run test:integration # Run integration tests` : ''}
\`\`\`

## 🏗️  Architecture Principles

### ✅ Named Exports Only
\`\`\`javascript
// ❌ WRONG - Default export
module.exports = createUserModel;

// ✅ CORRECT - Named exports
module.exports = { createUserModel };
\`\`\`

### ✅ Functional Approach
\`\`\`javascript
// Factory functions that return objects
const createUserService = (pool) => {
  const getAll = async () => { /* ... */ };
  const getById = async (id) => { /* ... */ };
  
  return { getAll, getById };
};

module.exports = { createUserService };
\`\`\`

### ✅ CamelCase Naming
- **Files:** user.js, userService.js, userHandler.js
- **Factories:** createUserModel, createUserService
- **Handlers:** handleGetUser, handleCreateUser

### ✅ Function Tracking
All generated functions are tracked in the registry for accurate imports:
- **${registryStats.factoryCount}** factory functions (createXXX)
- **${registryStats.handlerCount}** handler functions (handleXXX)
- **${registryStats.totalExports}** total exports across all modules

## ✅ Validation Results

${results.map(result => `
### ${result.type.toUpperCase()}
- Status: ${result.success ? '✅ Success' : '❌ Failed'}
- Validated: ${result.validated ? '✅ Yes' : '⚠️ Partial'}
- Files Generated: ${result.files.length}
- Attempt: ${result.attempt}
${result.error ? `- Error: ${result.error}` : ''}
`).join('\n')}

---
Generated with Enhanced Functional MVC Code Generator
Architecture: Named Exports | CamelCase | No Classes | Function Tracking
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

  // Re-export types from utils
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

  // Re-export FunctionRegistry
  FunctionRegistry,

  // Re-export utilities
  getCodeGenOptions,
  LANGUAGE
};