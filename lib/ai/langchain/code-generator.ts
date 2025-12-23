// ============================================================================
// SEQUENTIAL CODE GENERATOR - SIMPLIFIED PROMPTS THAT WORK
// AI was ignoring complex templates - using simple, direct instructions
// ============================================================================

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import {
  Project,
  CodeGenOptions,
  ModuleSpec,
  GeneratedFile,
  ModuleResult,
  CodeGenerationResult,
  FunctionRegistry,
  toCamelCase,
  toPascalCase,
} from "./code-generator-analysis";

import {
  getModuleSpecsFromDiagram,
} from './diagram-driven-pipeline';

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
} from "./iac-generator-utils";

import {
  generateEnhancedDockerEntrypoint,
  generateEnhancedDockerfile,
  generateEnhancedDockerCompose,
  generateEnhancedEnvExample,
  generateDockerIgnore,
  getBaseDependencies,
  addConditionalDependencies,
  generateDatabaseModule,
} from "./code-generator-templates";

// ============================================================================
// STATE INTERFACES
// ============================================================================

interface FileGenerationTask {
  moduleType: string;
  tableName?: string;
  filename: string;
  filepath: string;
  requiredFunctions: string[];
  requiredExports: string[];
  dependencies: string[];
  attempt: number;
}

interface SequentialCodeGenerationState {
  project: Project;
  options: CodeGenOptions;
  currentModuleIndex: number;
  moduleSpecs: ModuleSpec[];
  currentFileQueue: FileGenerationTask[];
  currentFileIndex: number;
  functionRegistry: FunctionRegistry;
  generatedFiles: Map<string, GeneratedFile>;
  moduleResults: Map<string, ModuleResult>;
  allDependencies: Record<string, string>;
  allDevDependencies: Record<string, string>;
  tableNames: string[];
  failedFiles: Map<string, number>;
  success: boolean;
  error?: string;
  instructions?: string;
}

// ============================================================================
// SIMPLE PROMPT BUILDER - NO COMPLEX TEMPLATES
// ============================================================================

class SimplePromptBuilder {
  
  static buildFileQueue(moduleSpec: ModuleSpec, state: SequentialCodeGenerationState): FileGenerationTask[] {
    const tasks: FileGenerationTask[] = [];
    
    if (!moduleSpec.tables || moduleSpec.tables.length === 0) {
      return tasks;
    }
    
    for (const tableName of moduleSpec.tables) {
      const task = this.buildFileTask(moduleSpec.type, tableName, state);
      if (task) {
        tasks.push(task);
      }
    }
    
    return tasks;
  }
  
  static buildFileTask(
    moduleType: string,
    tableName: string,
    state: SequentialCodeGenerationState
  ): FileGenerationTask | null {
    
    const camelName = toCamelCase(tableName);
    const pascalName = toPascalCase(tableName);
    
    switch (moduleType) {
      case 'models':
        return {
          moduleType: 'models',
          tableName,
          filename: `${camelName}Models.js`,
          filepath: `src/models/${camelName}Models.js`,
          requiredFunctions: ['createRecord', 'findAllRecords', 'findByIdRecord', 'updateByIdRecord', 'deleteByIdRecord', 'countRecords'],
          requiredExports: [`create${pascalName}Models`],
          dependencies: ['database/connections'],
          attempt: 1
        };
        
      case 'services':
        return {
          moduleType: 'services',
          tableName,
          filename: `${camelName}Services.js`,
          filepath: `src/services/${camelName}Services.js`,
          requiredFunctions: ['getAllRecords', 'getRecordById', 'createRecords', 'updateRecords', 'removeRecords'],
          requiredExports: [`create${pascalName}Services`],
          dependencies: [`models/${camelName}Models`],
          attempt: 1
        };
        
      case 'handlers':
        return {
          moduleType: 'handlers',
          tableName,
          filename: `${camelName}Handlers.js`,
          filepath: `src/handlers/${camelName}Handlers.js`,
          requiredFunctions: [
            `handleGetAll${pascalName}Records`,
            `handleGet${pascalName}Records`,
            `handleCreate${pascalName}Records`,
            `handleUpdate${pascalName}Records`,
            `handleDelete${pascalName}Records`
          ],
          requiredExports: [
            `handleGetAll${pascalName}Records`,
            `handleGet${pascalName}Records`,
            `handleCreate${pascalName}Records`,
            `handleUpdate${pascalName}Records`,
            `handleDelete${pascalName}Records`
          ],
          dependencies: [`services/${camelName}Services`, 'utils/responses'],
          attempt: 1
        };
        
      case 'routes':
        return {
          moduleType: 'routes',
          tableName,
          filename: `${camelName}Routes.js`,
          filepath: `src/routes/${camelName}Routes.js`,
          requiredFunctions: [],
          requiredExports: ['router'],
          dependencies: [`handlers/${camelName}Handlers`],
          attempt: 1
        };
        
      default:
        return null;
    }
  }
  
  /**
   * SIMPLIFIED PROMPT - Direct instructions, no complex templates
   */
  static buildFilePrompt(task: FileGenerationTask, state: SequentialCodeGenerationState): string {
    const table = state.project.schema.find(t => t.name === task.tableName);
    const pascalName = task.tableName ? toPascalCase(task.tableName) : '';
    const camelName = task.tableName ? toCamelCase(task.tableName) : '';
    
    let prompt = `You must generate a COMPLETE ${task.moduleType} file for the ${task.tableName} table.

FILE: ${task.filepath}
TABLE: ${task.tableName}

`;

    if (table) {
      prompt += `TABLE FIELDS:\n`;
      table.fields.forEach(field => {
        prompt += `- ${field.name}: ${field.type}${field.required ? ' (required)' : ''}${field.unique ? ' (unique)' : ''}\n`;
      });
      prompt += '\n';
    }

    if (task.moduleType === 'models') {
      prompt += this.buildModelsInstructions(pascalName, camelName, task.tableName!);
    } else if (task.moduleType === 'services') {
      prompt += this.buildServicesInstructions(pascalName, camelName);
    } else if (task.moduleType === 'handlers') {
      prompt += this.buildHandlersInstructions(pascalName, camelName);
    } else if (task.moduleType === 'routes') {
      prompt += this.buildRoutesInstructions(pascalName, camelName);
    }
    
    prompt += `\n\nRETURN ONLY THIS JSON:
{
  "path": "${task.filepath}",
  "content": "THE COMPLETE FILE CODE HERE",
  "description": "${task.moduleType} for ${task.tableName}",
  "success": true
}

CRITICAL: The content field must have COMPLETE working code for ALL ${task.requiredFunctions.length} functions.`;

    return prompt;
  }
  
  private static buildModelsInstructions(pascalName: string, camelName: string, tableName: string): string {
    return `YOU MUST GENERATE THIS EXACT STRUCTURE:

1. Import: const { getPools } = require('../database/connections');

2. Factory function create${pascalName}Models that returns an object with 6 functions

3. Each function MUST:
   - Use pool.query with parameterized queries ($1, $2, etc)
   - Have try-catch blocks
   - Return { success: true, data: ... } or { success: false, error: ... }

4. Required functions (IMPLEMENT ALL 6 COMPLETELY):

createRecord - INSERT INTO ${tableName} with data parameter
findAllRecords - SELECT * FROM ${tableName} WHERE deleted_at IS NULL with filters
findByIdRecord - SELECT * FROM ${tableName} WHERE id = $1
updateByIdRecord - UPDATE ${tableName} SET ... WHERE id = $ AND deleted_at IS NULL
deleteByIdRecord - UPDATE ${tableName} SET deleted_at = NOW() WHERE id = $1 (soft delete)
countRecords - SELECT COUNT(*) FROM ${tableName} WHERE deleted_at IS NULL

5. Export: module.exports = { create${pascalName}Models };

DO NOT use placeholders like "..." or "implement here"
DO NOT write TODO comments
WRITE COMPLETE CODE for each function with real SQL queries`;
  }
  
  private static buildServicesInstructions(pascalName: string, camelName: string): string {
    return `YOU MUST GENERATE THIS EXACT STRUCTURE:

1. Import: const { create${pascalName}Models } = require('../models/${camelName}Models');

2. Factory function create${pascalName}Services that accepts models parameter

3. Initialize: const ${camelName}Models = models || create${pascalName}Models();

4. Required functions (IMPLEMENT ALL 5 COMPLETELY):

getAllRecords(query) - Get all with pagination
  - Extract page, limit from query
  - Call ${camelName}Models.findAllRecords
  - Call ${camelName}Models.countRecords
  - Return data with pagination object

getRecordById(id) - Get single record
  - Validate id exists
  - Call ${camelName}Models.findByIdRecord

createRecords(data) - Create new record
  - Validate data exists
  - Call ${camelName}Models.createRecord

updateRecords(id, data) - Update record
  - Validate id and data
  - Check record exists
  - Call ${camelName}Models.updateByIdRecord

removeRecords(id) - Delete record
  - Validate id
  - Call ${camelName}Models.deleteByIdRecord

5. Return object with all 5 functions

6. Export: module.exports = { create${pascalName}Services };

DO NOT use placeholders
WRITE COMPLETE CODE with full function bodies`;
  }
  
  private static buildHandlersInstructions(pascalName: string, camelName: string): string {
    return `YOU MUST GENERATE THIS EXACT STRUCTURE:

1. Imports:
const { create${pascalName}Services } = require('../services/${camelName}Services');
const { sendSuccess, sendError, sendCreated } = require('../utils/responses');

2. Initialize: const ${camelName}Services = create${pascalName}Services();

3. Required handler functions (IMPLEMENT ALL 5):

handleGetAll${pascalName}Records(req, res, next) - try-catch with req.query
handleGet${pascalName}Records(req, res, next) - try-catch with req.params.id
handleCreate${pascalName}Records(req, res, next) - try-catch with req.body
handleUpdate${pascalName}Records(req, res, next) - try-catch with req.params.id and req.body
handleDelete${pascalName}Records(req, res, next) - try-catch with req.params.id

Each handler MUST:
- Use async
- Have try-catch
- Call service method
- Use sendSuccess/sendError/sendCreated
- Call next(error) in catch

4. Export ALL 5: module.exports = { handleGetAll${pascalName}Records, handleGet${pascalName}Records, handleCreate${pascalName}Records, handleUpdate${pascalName}Records, handleDelete${pascalName}Records };

WRITE COMPLETE CODE - no placeholders`;
  }
  
  private static buildRoutesInstructions(pascalName: string, camelName: string): string {
    return `YOU MUST GENERATE THIS EXACT STRUCTURE:

1. Imports:
const express = require('express');
const { all 5 handler functions } = require('../handlers/${camelName}Handlers');

2. Create router: const router = express.Router();

3. Define 5 routes:
router.get('/', handleGetAll${pascalName}Records);
router.get('/:id', handleGet${pascalName}Records);
router.post('/', handleCreate${pascalName}Records);
router.put('/:id', handleUpdate${pascalName}Records);
router.delete('/:id', handleDelete${pascalName}Records);

4. Export: module.exports = { router };

WRITE COMPLETE CODE`;
  }
}

// ============================================================================
// SINGLE FILE GENERATOR
// ============================================================================

async function generateSingleFile(
  task: FileGenerationTask,
  state: SequentialCodeGenerationState
): Promise<GeneratedFile | null> {
  
  console.log(`\n   📄 ${task.filename} (attempt ${task.attempt}/3)`);
  
  try {
    const llm = new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      maxTokens: 8000,
    });
    
    const systemPrompt = `You generate complete code files in JSON format.

OUTPUT ONLY THIS JSON STRUCTURE:
{
  "path": "file/path.js",
  "content": "THE ACTUAL FILE CONTENT WITH REAL CODE",
  "description": "brief description",
  "success": true
}

CRITICAL RULES:
1. The "content" field must contain COMPLETE working code
2. NO placeholders like "..." or "implement here" or "TODO"
3. EVERY function must have FULL implementation (at least 10 lines)
4. Use parameterized database queries: pool.query('SELECT * WHERE id = $1', [id])
5. Include try-catch in all async functions
6. Return { success, data/error } from all database functions

If you write incomplete code, the user will be very upset.`;

    const userPrompt = SimplePromptBuilder.buildFilePrompt(task, state);
    
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);
    
    const parsed = parseFileResponse(response.content as string);
    
    if (!parsed || !parsed.path || !parsed.content) {
      throw new Error('Invalid AI response - missing path or content');
    }
    
    // Validate
    const validation = validateSingleFile(parsed, task);
    
    if (!validation.isValid) {
      console.warn(`      ⚠️  Validation failed:`);
      validation.errors.slice(0, 3).forEach(err => console.warn(`         • ${err}`));
      
      if (task.attempt < 3) {
        task.attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await generateSingleFile(task, state);
      } else {
        console.error(`      ❌ Max retries`);
        return null;
      }
    }
    
    console.log(`      ✅ Valid (${parsed.content.length} chars)`);
    
    return {
      path: parsed.path,
      content: parsed.content,
      description: parsed.description || task.filename,
      exports: task.requiredExports
    };
    
  } catch (error: any) {
    console.error(`      ❌ Error: ${error.message}`);
    
    if (task.attempt < 3) {
      task.attempt++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await generateSingleFile(task, state);
    }
    
    return null;
  }
}

// ============================================================================
// VALIDATION - SAME AS BEFORE
// ============================================================================

function validateSingleFile(file: any, task: FileGenerationTask): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const content = file.content || '';
  
  if (file.path !== task.filepath) {
    errors.push(`Path mismatch`);
  }
  
  if (content.length < 200) {
    errors.push(`Too short (${content.length} chars)`);
  }
  
  const badPatterns = ['...', '// TODO', '// implement', '// PLACEHOLDER'];
  for (const pattern of badPatterns) {
    if (content.includes(pattern)) {
      errors.push(`Contains placeholder: "${pattern}"`);
    }
  }
  
  for (const exportName of task.requiredExports) {
    if (!content.includes(exportName)) {
      errors.push(`Missing export: ${exportName}`);
    }
  }
  
  if (!content.includes('module.exports')) {
    errors.push('No module.exports');
  }
  
  if (task.moduleType !== 'routes') {
    for (const funcName of task.requiredFunctions) {
      if (!content.includes(funcName)) {
        errors.push(`Missing function: ${funcName}`);
      }
    }
  }
  
  const functionPattern = /(?:const|function)\s+(\w+)\s*=?\s*(?:async\s+)?\([^)]*\)\s*(?:=>)?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;
  
  while ((match = functionPattern.exec(content)) !== null) {
    const funcName = match[1];
    const funcBody = match[2];
    const bodyLines = funcBody.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
    
    if (bodyLines < 3) {
      errors.push(`Function '${funcName}' too short (${bodyLines} lines)`);
    }
  }
  
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces`);
  }
  
  if (task.moduleType === 'models' && !content.includes('pool.query')) {
    errors.push('Models must use pool.query');
  }
  
  if (task.moduleType === 'services' && !content.includes('Models')) {
    errors.push('Services must import models');
  }
  
  if (task.moduleType === 'handlers' && (!content.includes('try') || !content.includes('catch'))) {
    errors.push('Handlers must have try-catch');
  }
  
  return { isValid: errors.length === 0, errors };
}

function parseFileResponse(text: string): any {
  try {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json|javascript|js)?\s*\n?/gim, '');
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');
    
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart > 0) cleaned = cleaned.substring(jsonStart);
    
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) cleaned = cleaned.substring(0, lastBrace + 1);
    
    return JSON.parse(cleaned);
  } catch (error) {
    return null;
  }
}

// ============================================================================
// UTILITY GENERATORS - SIMPLIFIED
// ============================================================================

function generateLoggerUtil(): GeneratedFile {
  return {
    path: 'src/utils/logger.js',
    content: `const createLogger = () => {
  const log = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(\`[\${timestamp}] \${level.toUpperCase()}: \${message}\`, meta);
  };
  return {
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    debug: (msg, meta) => log('debug', msg, meta)
  };
};
module.exports = { createLogger };`,
    description: 'Logger'
  };
}

function generateErrorsUtil(): GeneratedFile {
  return {
    path: 'src/utils/errors.js',
    content: `class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
const createError = (message, statusCode, code) => new AppError(message, statusCode, code);
const createValidationError = (msg) => new AppError(msg, 400, 'VALIDATION_ERROR');
const createNotFoundError = (msg) => new AppError(msg, 404, 'NOT_FOUND');
const createUnauthorizedError = (msg) => new AppError(msg, 401, 'UNAUTHORIZED');
const createForbiddenError = (msg) => new AppError(msg, 403, 'FORBIDDEN');
const createConflictError = (msg) => new AppError(msg, 409, 'CONFLICT');
module.exports = { AppError, createError, createValidationError, createNotFoundError, createUnauthorizedError, createForbiddenError, createConflictError };`,
    description: 'Errors'
  };
}

function generateResponsesUtil(): GeneratedFile {
  return {
    path: 'src/utils/responses.js',
    content: `const sendSuccess = (res, data, message = 'Success') => res.status(200).json({ success: true, message, data });
const sendError = (res, error, statusCode = 500) => res.status(statusCode).json({ success: false, error: error.message || error });
const sendCreated = (res, data, message = 'Created') => res.status(201).json({ success: true, message, data });
const sendNoContent = (res) => res.status(204).send();
const sendPaginated = (res, data, pagination) => res.status(200).json({ success: true, data, pagination });
module.exports = { sendSuccess, sendError, sendCreated, sendNoContent, sendPaginated };`,
    description: 'Responses'
  };
}

function generateValidationsUtil(): GeneratedFile {
  return {
    path: 'src/utils/validations.js',
    content: `const isValidEmail = (email) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
const isValidUUID = (uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
const validateRequired = (value, fieldName = 'Field') => { if (!value) throw new Error(\`\${fieldName} is required\`); return true; };
const validateEmail = (email, fieldName = 'Email') => { validateRequired(email, fieldName); if (!isValidEmail(email)) throw new Error(\`\${fieldName} must be valid email\`); return true; };
const validateUUID = (uuid, fieldName = 'ID') => { validateRequired(uuid, fieldName); if (!isValidUUID(uuid)) throw new Error(\`\${fieldName} must be valid UUID\`); return true; };
const sanitizeString = (str) => typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : str;
module.exports = { isValidEmail, isValidUUID, validateRequired, validateEmail, validateUUID, sanitizeString };`,
    description: 'Validations'
  };
}

function generateErrorHandlerMiddleware(): GeneratedFile {
  return {
    path: 'src/middleware/errorHandler.js',
    content: `const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({ success: false, error: err.message, code: err.code || 'INTERNAL_ERROR' });
};
const notFoundHandler = (req, res) => res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
module.exports = { errorHandler, notFoundHandler };`,
    description: 'Error handler'
  };
}

function generateRequestLoggerMiddleware(): GeneratedFile {
  return {
    path: 'src/middleware/requestLogger.js',
    content: `const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(\`\${req.method} \${req.path} \${res.statusCode} - \${Date.now() - start}ms\`));
  next();
};
module.exports = { requestLogger };`,
    description: 'Request logger'
  };
}

function generateValidatorMiddleware(): GeneratedFile {
  return {
    path: 'src/middleware/validator.js',
    content: `const { validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
  next();
};
const validateBody = (schema) => [schema, validate];
const validateQuery = (schema) => [schema, validate];
const validateParams = (schema) => [schema, validate];
module.exports = { validateBody, validateQuery, validateParams, validate };`,
    description: 'Validator'
  };
}

function generateUtilsIndex(): GeneratedFile {
  return {
    path: 'src/utils/index.js',
    content: `const { createLogger } = require('./logger');
const { createError, createValidationError, createNotFoundError, createUnauthorizedError, createForbiddenError, createConflictError } = require('./errors');
const { sendSuccess, sendError, sendCreated, sendNoContent, sendPaginated } = require('./responses');
const { isValidEmail, isValidUUID, validateRequired, validateEmail, validateUUID, sanitizeString } = require('./validations');
module.exports = { createLogger, createError, createValidationError, createNotFoundError, createUnauthorizedError, createForbiddenError, createConflictError, sendSuccess, sendError, sendCreated, sendNoContent, sendPaginated, isValidEmail, isValidUUID, validateRequired, validateEmail, validateUUID, sanitizeString };`,
    description: 'Utils index'
  };
}

function generateMiddlewareIndex(): GeneratedFile {
  return {
    path: 'src/middleware/index.js',
    content: `const { errorHandler, notFoundHandler } = require('./errorHandler');
const { requestLogger } = require('./requestLogger');
const { validateBody, validateQuery, validateParams } = require('./validator');
module.exports = { errorHandler, notFoundHandler, requestLogger, validateBody, validateQuery, validateParams };`,
    description: 'Middleware index'
  };
}

function generateMainEntryPoint(project: Project): GeneratedFile {
  return {
    path: 'src/index.js',
    content: `require('dotenv').config();
const express = require('express');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware');
const { router: apiRouter } = require('./routes');
const { getPools, closePools } = require('./database/connections');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(\`Server on port \${PORT}\`);
  getPools().query('SELECT NOW()').then(() => console.log('DB connected')).catch(err => console.error('DB error:', err));
});

const shutdown = async (signal) => {
  console.log(\`\${signal} received\`);
  server.close(async () => {
    await closePools();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;`,
    description: 'Main'
  };
}

function generateConfigModule(state: SequentialCodeGenerationState): GeneratedFile[] {
  return [{
    path: 'src/config/index.js',
    content: `module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};`,
    description: 'Config'
  }];
}

function generateIndexFile(moduleSpec: ModuleSpec, state: SequentialCodeGenerationState): GeneratedFile | null {
  if (!moduleSpec.tables) return null;
  
  const imports: string[] = [];
  const exports: string[] = [];
  
  for (const tableName of moduleSpec.tables) {
    const camelName = toCamelCase(tableName);
    const pascalName = toPascalCase(tableName);
    
    if (moduleSpec.type === 'models') {
      imports.push(`const { create${pascalName}Models } = require('./${camelName}Models');`);
      exports.push(`  create${pascalName}Models`);
    } else if (moduleSpec.type === 'services') {
      imports.push(`const { create${pascalName}Services } = require('./${camelName}Services');`);
      exports.push(`  create${pascalName}Services`);
    } else if (moduleSpec.type === 'handlers') {
      const handlers = [
        `handleGetAll${pascalName}Records`,
        `handleGet${pascalName}Records`,
        `handleCreate${pascalName}Records`,
        `handleUpdate${pascalName}Records`,
        `handleDelete${pascalName}Records`
      ];
      imports.push(`const { ${handlers.join(', ')} } = require('./${camelName}Handlers');`);
      exports.push(...handlers.map(h => `  ${h}`));
    } else if (moduleSpec.type === 'routes') {
      // Special case below
    }
  }
  
  if (moduleSpec.type === 'routes') {
    const routeImports = moduleSpec.tables.map(t => {
      const camelName = toCamelCase(t);
      return `const { router: ${camelName}Router } = require('./${camelName}Routes');`;
    }).join('\n');
    
    const routeUses = moduleSpec.tables.map(t => {
      const camelName = toCamelCase(t);
      return `apiRouter.use('/${camelName}', ${camelName}Router);`;
    }).join('\n');
    
    return {
      path: `src/routes/index.js`,
      content: `const express = require('express');\n${routeImports}\n\nconst apiRouter = express.Router();\napiRouter.get('/health', (req, res) => res.json({ status: 'ok' }));\n\n${routeUses}\n\nmodule.exports = { router: apiRouter };`,
      description: 'Routes index'
    };
  }
  
  return {
    path: `src/${moduleSpec.type}/index.js`,
    content: `${imports.join('\n')}\n\nmodule.exports = {\n${exports.join(',\n')}\n};`,
    description: `${moduleSpec.type} index`
  };
}

// ============================================================================
// GRAPH NODES
// ============================================================================

async function initializeSequentialState(state: SequentialCodeGenerationState): Promise<Partial<SequentialCodeGenerationState>> {
  console.log('\n🚀 Sequential Generation');
  
  const moduleSpecs = getModuleSpecsFromDiagram(state.project, state.options);
  const tableNames = state.project.schema.map(t => t.name);
  
  const baseDeps = getBaseDependencies(state.options.framework);
  const allDependencies = { ...baseDeps.dependencies };
  const allDevDependencies = { ...baseDeps.devDependencies };
  addConditionalDependencies(state.project, state.options, allDependencies, allDevDependencies);
  
  console.log(`📋 ${moduleSpecs.length} modules, ${tableNames.length} tables`);
  
  return {
    currentModuleIndex: 0,
    currentFileQueue: [],
    currentFileIndex: 0,
    moduleSpecs,
    functionRegistry: new FunctionRegistry(),
    generatedFiles: new Map(),
    moduleResults: new Map(),
    allDependencies,
    allDevDependencies,
    tableNames,
    failedFiles: new Map(),
    success: false
  };
}

async function generateModuleSequentially(state: SequentialCodeGenerationState): Promise<Partial<SequentialCodeGenerationState>> {
  const moduleSpec = state.moduleSpecs[state.currentModuleIndex];
  
  if (!moduleSpec) {
    return { currentModuleIndex: state.currentModuleIndex + 1 };
  }
  
  console.log(`\n[${state.currentModuleIndex + 1}/${state.moduleSpecs.length}] 🔨 ${moduleSpec.type}`);
  
  // Handle non-table modules
  if (!moduleSpec.tables || moduleSpec.tables.length === 0) {
    return await handleNonTableModule(state, moduleSpec);
  }
  
  // Build queue if needed
  if (state.currentFileQueue.length === 0) {
    state.currentFileQueue = SimplePromptBuilder.buildFileQueue(moduleSpec, state);
    state.currentFileIndex = 0;
    console.log(`   📋 ${state.currentFileQueue.length} files queued`);
  }
  
  // Generate current file
  if (state.currentFileIndex < state.currentFileQueue.length) {
    const task = state.currentFileQueue[state.currentFileIndex];
    const file = await generateSingleFile(task, state);
    
    if (file) {
      state.generatedFiles.set(file.path, file);
      state.functionRegistry.register(file.path, file.content);
      console.log(`   ✅ ${state.currentFileIndex + 1}/${state.currentFileQueue.length}`);
    } else {
      console.warn(`   ⚠️  Failed ${task.filename}`);
      state.failedFiles.set(task.filepath, 1);
    }
    
    state.currentFileIndex++;
    return { currentFileIndex: state.currentFileIndex, generatedFiles: state.generatedFiles, failedFiles: state.failedFiles };
  }
  
  // Generate index
  const indexFile = generateIndexFile(moduleSpec, state);
  if (indexFile) {
    state.generatedFiles.set(indexFile.path, indexFile);
    console.log(`   ✅ Index generated`);
  }
  
  state.moduleResults.set(moduleSpec.type, {
    type: moduleSpec.type,
    files: [],
    dependencies: {},
    devDependencies: {},
    success: true,
    validated: true,
    attempt: 1
  });
  
  console.log(`   ✅ Complete`);
  
  return {
    currentModuleIndex: state.currentModuleIndex + 1,
    currentFileQueue: [],
    currentFileIndex: 0,
    moduleResults: state.moduleResults,
    generatedFiles: state.generatedFiles
  };
}

async function handleNonTableModule(state: SequentialCodeGenerationState, moduleSpec: ModuleSpec): Promise<Partial<SequentialCodeGenerationState>> {
  let files: GeneratedFile[] = [];
  
  if (moduleSpec.type === 'utils') {
    files = [generateLoggerUtil(), generateErrorsUtil(), generateResponsesUtil(), generateValidationsUtil(), generateUtilsIndex()];
  } else if (moduleSpec.type === 'middleware') {
    files = [generateErrorHandlerMiddleware(), generateRequestLoggerMiddleware(), generateValidatorMiddleware(), generateMiddlewareIndex()];
  } else if (moduleSpec.type === 'database') {
    files = generateDatabaseModule(state);
  } else if (moduleSpec.type === 'config') {
    files = generateConfigModule(state);
  } else if (moduleSpec.type === 'docker') {
    files = [
      generateEnhancedDockerEntrypoint(state.project),
      generateEnhancedDockerfile(state.project, state.options),
      generateEnhancedDockerCompose(state.project, state.options),
      generateEnhancedEnvExample(state.project, state.options),
      generateDockerIgnore()
    ];
  } else if (moduleSpec.type === 'terraform') {
    files = [
      generateTerraformMain(state.project, state.options),
      generateTerraformVariables(state.project, state.options),
      generateTerraformOutputs(state.project),
      generateTerraformVPCModule(),
      generateTerraformSecurityModule(),
      generateTerraformRDSModule(),
      generateTerraformECRModule(),
      generateTerraformECSModule(state.project, state.options),
      generateTerraformTfvarsExample(state.project, state.options),
      generateDeploymentScript(state.project),
      generateTerraformReadme(state.project, state.options)
    ];
  } else if (moduleSpec.type === 'main') {
    files = [generateMainEntryPoint(state.project)];
  }
  
  files.forEach(file => {
    state.generatedFiles.set(file.path, file);
    state.functionRegistry.register(file.path, file.content);
  });
  
  console.log(`   ✅ ${files.length} files`);
  
  state.moduleResults.set(moduleSpec.type, {
    type: moduleSpec.type,
    files,
    dependencies: {},
    devDependencies: {},
    success: true,
    validated: true,
    attempt: 1
  });
  
  return {
    currentModuleIndex: state.currentModuleIndex + 1,
    moduleResults: state.moduleResults,
    generatedFiles: state.generatedFiles
  };
}

function shouldContinueSequential(state: SequentialCodeGenerationState): string {
  if (state.currentFileIndex < state.currentFileQueue.length) return "generate_module";
  if (state.currentModuleIndex < state.moduleSpecs.length) return "generate_module";
  return "finalize";
}

async function finalizeSequential(state: SequentialCodeGenerationState): Promise<Partial<SequentialCodeGenerationState>> {
  console.log('\n📦 Finalizing...');
  
  state.generatedFiles.set('package.json', {
    path: 'package.json',
    content: JSON.stringify({
      name: state.project.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      main: 'src/index.js',
      scripts: { start: 'node src/index.js', dev: 'nodemon src/index.js' },
      dependencies: state.allDependencies,
      devDependencies: state.allDevDependencies,
    }, null, 2),
    description: 'Package.json'
  });
  
  state.generatedFiles.set('.gitignore', {
    path: '.gitignore',
    content: `node_modules/\n.env\n*.log`,
    description: 'Gitignore'
  });
  
  state.generatedFiles.set('README.md', {
    path: 'README.md',
    content: `# ${state.project.name}\n\n## Setup\n\`\`\`bash\nnpm install\ncp .env.example .env\nnpm run dev\n\`\`\``,
    description: 'README'
  });
  
  console.log(`✅ ${state.generatedFiles.size} files total`);
  console.log(`⚠️  ${state.failedFiles.size} failed`);
  
  return {
    success: true,
    generatedFiles: state.generatedFiles,
    instructions: 'Run: npm install && npm run dev'
  };
}

// ============================================================================
// GRAPH
// ============================================================================

export function createSequentialCodeGenerationGraph() {
  const workflow = new StateGraph<SequentialCodeGenerationState>({
    channels: {
      project: null, options: null, currentModuleIndex: null, moduleSpecs: null,
      currentFileQueue: null, currentFileIndex: null, functionRegistry: null,
      generatedFiles: null, moduleResults: null, allDependencies: null,
      allDevDependencies: null, tableNames: null, failedFiles: null,
      success: null, error: null, instructions: null
    }
  });
  
  workflow.addNode("initialize", initializeSequentialState);
  workflow.addNode("generate_module", generateModuleSequentially);
  workflow.addNode("finalize", finalizeSequential);
  
  workflow.addEdge(START, "initialize");
  workflow.addConditionalEdges("initialize", shouldContinueSequential);
  workflow.addConditionalEdges("generate_module", shouldContinueSequential);
  workflow.addEdge("finalize", END);
  
  return workflow.compile();
}

export async function generateCodeWithLangGraph(
  project: Project,
  options: CodeGenOptions
): Promise<CodeGenerationResult> {
  
  const graph = createSequentialCodeGenerationGraph();
  
  const initialState: SequentialCodeGenerationState = {
    project, options, currentModuleIndex: 0, moduleSpecs: [],
    currentFileQueue: [], currentFileIndex: 0,
    functionRegistry: new FunctionRegistry(),
    generatedFiles: new Map(), moduleResults: new Map(),
    allDependencies: {}, allDevDependencies: {},
    tableNames: [], failedFiles: new Map(), success: false
  };
  
  try {
    const result = await graph.invoke(initialState, { recursionLimit: 500 });
    
    return {
      files: Array.from(result.generatedFiles.values()),
      instructions: result.instructions || '',
      dependencies: result.allDependencies,
      devDependencies: result.allDevDependencies,
      success: result.success,
      error: result.error
    };
  } catch (error: any) {
    return {
      files: [], instructions: '', dependencies: {}, devDependencies: {},
      success: false, error: error.message
    };
  }
}