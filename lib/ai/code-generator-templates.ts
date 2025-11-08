import { CodeGenOptions, GeneratedFile, Project, toCamelCase, toPascalCase } from "./code-generator-analysis";

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

export const NAMING_STANDARDS = {
  // FILES - All PLURAL
  MODEL_FILE: (tableName: string) => `${toCamelCase(tableName)}Models.js`,
  SERVICE_FILE: (tableName: string) => `${toCamelCase(tableName)}Services.js`,
  HANDLER_FILE: (tableName: string) => `${toCamelCase(tableName)}Handlers.js`,
  ROUTE_FILE: (tableName: string) => `${toCamelCase(tableName)}Routes.js`,

  // FACTORIES - All PLURAL
  MODEL_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Models`,
  SERVICE_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Services`,
  HANDLER_FACTORY: (tableName: string) => `create${toPascalCase(tableName)}Handlers`,

  // PATHS - All PLURAL
  MODEL_PATH: (tableName: string) => `../models/${toCamelCase(tableName)}Models`,
  SERVICE_PATH: (tableName: string) => `../services/${toCamelCase(tableName)}Services`,
  HANDLER_PATH: (tableName: string) => `../handlers/${toCamelCase(tableName)}Handlers`,
  
  // ROUTE PATHS (special case - can be singular in URL)
  ROUTE_URL: (tableName: string) => toCamelCase(tableName),
};

export function getModulePrompts(project: any) {
  const dbName = project.database?.name || 
                 project.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const toCamelCaseLocal = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  };
  
  const toPascalCaseLocal = (str: string) => {
    const camel = toCamelCaseLocal(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  };
  
  // ============================================================================
  // GENERATE DYNAMIC SQL FOR ALL TABLES
  // ============================================================================
  const generateTableSQL = (table: any) => {
    const tableName = table.name.toLowerCase();
    const fields = table.fields.map((field: any) => {
      let sql = `  ${field.name.toLowerCase()} `;
      
      // Map field types to PostgreSQL types
      switch (field.type.toLowerCase()) {
        case 'string':
        case 'text':
          sql += 'VARCHAR(255)';
          break;
        case 'email':
          sql += 'VARCHAR(255)';
          break;
        case 'password':
          sql += 'VARCHAR(255)';
          break;
        case 'integer':
        case 'int':
          sql += 'INTEGER';
          break;
        case 'bigint':
          sql += 'BIGINT';
          break;
        case 'float':
        case 'decimal':
        case 'number':
          sql += 'DECIMAL(10, 2)';
          break;
        case 'boolean':
        case 'bool':
          sql += 'BOOLEAN';
          break;
        case 'date':
          sql += 'DATE';
          break;
        case 'datetime':
        case 'timestamp':
          sql += 'TIMESTAMPTZ';
          break;
        case 'json':
          sql += 'JSONB';
          break;
        case 'uuid':
          sql += 'UUID';
          break;
        case 'longtext':
          sql += 'TEXT';
          break;
        default:
          sql += 'VARCHAR(255)';
      }
      
      if (field.required) {
        sql += ' NOT NULL';
      }
      
      if (field.unique) {
        sql += ' UNIQUE';
      }
      
      return sql;
    }).join(',\n');
    
    // Add foreign key constraints
    const foreignKeys = table.fields
      .filter((f: any) => f.references)
      .map((f: any) => {
        const refTable = f.references.split('.')[0];
        const refColumn = f.references.split('.')[1] || 'id';
        return `  CONSTRAINT fk_${tableName}_${f.name} FOREIGN KEY (${f.name}) REFERENCES ${refTable}(${refColumn}) ON DELETE CASCADE`;
      });
    
    const allFields = [fields, ...foreignKeys].filter(Boolean).join(',\n');
    
    return `-- Table: ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
${allFields},
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Indexes for ${tableName}
CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_${tableName}_deleted_at ON ${tableName}(deleted_at) WHERE deleted_at IS NULL;
${table.fields.filter((f: any) => f.unique || f.references).map((f: any) => 
  `CREATE INDEX IF NOT EXISTS idx_${tableName}_${f.name} ON ${tableName}(${f.name});`
).join('\n')}

-- Update trigger for ${tableName}
CREATE TRIGGER update_${tableName}_updated_at BEFORE UPDATE ON ${tableName}
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
  };
  
  // Generate SQL for all tables
  const allTablesSQL = project.schema.map(generateTableSQL).join('\n\n');
  
  const migrationSQL = `-- ============================================================================
-- Database: ${dbName}
-- Generated: ${new Date().toISOString()}
-- ============================================================================

-- ============================================================================
-- Enable UUID Extension (AWS RDS Compatible)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Update Trigger Function (shared by all tables)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- Tables with Auto-Generated UUIDs
-- ============================================================================

${allTablesSQL}

-- ============================================================================
-- Verification Queries (Uncomment to run)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;`;

  // ============================================================================
  // RETURN ALL MODULE PROMPTS
  // ============================================================================
  return {
    config: `Generate configuration files for a Node.js/Express application using CommonJS.

REQUIRED FILES:
1. package.json - With all necessary dependencies
2. .eslintrc.json - ESLint configuration
3. .env.example - Environment variables template
4. .gitignore - Git ignore patterns
5. README.md - Basic project documentation

Database Name: ${dbName}

Use proper JSON formatting and include all standard Node.js best practices.`,

    docker: `Generate Docker configuration files for Node.js application with PostgreSQL.

REQUIRED FILES:
1. Dockerfile - Multi-stage build for production
2. docker-compose.yml - With PostgreSQL service and proper networking
3. .dockerignore - Exclude unnecessary files
4. docker-entrypoint.sh - Startup script with database checks

Database Name: ${dbName}

Requirements:
- Node 18 Alpine base image
- Non-root user for security
- Health checks for both services
- Proper volume management
- SSL configuration support`,

    utils: `Generate utility modules using FUNCTIONAL approach (NO classes).

REQUIRED FILES:
1. src/utils/index.js - Re-export all utilities
2. src/utils/errors.js - Error creation functions (PLURAL)
3. src/utils/responses.js - Response formatting functions (PLURAL)
4. src/utils/validations.js - Input validation helpers (PLURAL)
5. src/utils/logger.js - Logging utility (SINGULAR)

CRITICAL STRUCTURE:

FILE: src/utils/logger.js
\`\`\`javascript
// Simple functional logger
const createLogger = () => {
  const log = (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  };

  const error = (message, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  };

  const warn = (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  };

  const debug = (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    }
  };

  return {
    info: log,
    error,
    warn,
    debug
  };
};

module.exports = { createLogger };
\`\`\`

FILE: src/utils/errors.js
\`\`\`javascript
// Error creation functions
const createError = (message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const createValidationError = (message, details = null) => {
  const error = createError(message, 400, 'VALIDATION_ERROR');
  if (details) error.details = details;
  return error;
};

const createNotFoundError = (resource = 'Resource') => {
  return createError(\`\${resource} not found\`, 404, 'NOT_FOUND');
};

const createUnauthorizedError = (message = 'Unauthorized') => {
  return createError(message, 401, 'UNAUTHORIZED');
};

const createForbiddenError = (message = 'Forbidden') => {
  return createError(message, 403, 'FORBIDDEN');
};

const createConflictError = (message = 'Resource already exists') => {
  return createError(message, 409, 'CONFLICT');
};

module.exports = {
  createError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError
};
\`\`\`

FILE: src/utils/responses.js
\`\`\`javascript
// Response formatting functions
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details })
    },
    timestamp: new Date().toISOString()
  });
};

const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

const sendNoContent = (res) => {
  return res.status(204).send();
};

const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated
};
\`\`\`

FILE: src/utils/validations.js
\`\`\`javascript
const { createValidationError } = require('./errors');

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const validateRequired = (fields, data) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw createValidationError(
      'Missing required fields',
      { missing }
    );
  }
};

const validateEmail = (email) => {
  if (!isValidEmail(email)) {
    throw createValidationError('Invalid email format');
  }
};

const validateUUID = (uuid, fieldName = 'ID') => {
  if (!isValidUUID(uuid)) {
    throw createValidationError(\`Invalid \${fieldName} format\`);
  }
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  isValidEmail,
  isValidUUID,
  validateRequired,
  validateEmail,
  validateUUID,
  sanitizeString
};
\`\`\`

FILE: src/utils/index.js
\`\`\`javascript
const { createLogger } = require('./logger');
const {
  createError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError
} = require('./errors');
const {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated
} = require('./responses');
const {
  isValidEmail,
  isValidUUID,
  validateRequired,
  validateEmail,
  validateUUID,
  sanitizeString
} = require('./validations');

module.exports = {
  // Logger
  createLogger,
  
  // Errors
  createError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError,
  
  // Responses
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated,
  
  // Validations
  isValidEmail,
  isValidUUID,
  validateRequired,
  validateEmail,
  validateUUID,
  sanitizeString
};
\`\`\`

⚠️ CRITICAL: Generate ALL files EXACTLY as shown above!`,

    middleware: `Generate Express middleware using FUNCTIONAL approach.

REQUIRED FILES:
1. src/middleware/index.js - Re-export all middleware
2. src/middleware/errorHandler.js - Error handling middleware (SINGULAR)
3. src/middleware/requestLogger.js - Request logging middleware (SINGULAR)
4. src/middleware/validator.js - Request validation middleware (SINGULAR)

🚨 CRITICAL: errorHandler.js MUST export BOTH errorHandler AND notFoundHandler!

CRITICAL STRUCTURE:

FILE: src/middleware/errorHandler.js
\`\`\`javascript
const { createLogger } = require('../utils/logger');
const { sendError } = require('../utils/responses');

const logger = createLogger();

// Error handler middleware (4 parameters)
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });

  const statusCode = err.statusCode || 500;
  return sendError(res, err, statusCode);
};

// 404 Not Found handler (2 parameters - NO next!)
const notFoundHandler = (req, res) => {
  const error = {
    message: \`Route not found: \${req.method} \${req.path}\`,
    code: 'NOT_FOUND'
  };
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress
  });

  return res.status(404).json({
    success: false,
    error: {
      message: error.message,
      code: error.code
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
\`\`\`

FILE: src/middleware/requestLogger.js
\`\`\`javascript
const { createLogger } = require('../utils/logger');

const logger = createLogger();

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: \`\${duration}ms\`
    });
  });

  next();
};

module.exports = { requestLogger };
\`\`\`

FILE: src/middleware/validator.js
\`\`\`javascript
const { createValidationError } = require('../utils/errors');
const { sendError } = require('../utils/responses');

// Validate request body
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // Simple validation - check required fields
      if (schema.required) {
        const missing = schema.required.filter(field => !req.body[field]);
        if (missing.length > 0) {
          throw createValidationError('Missing required fields', { missing });
        }
      }

      // Type validation
      if (schema.fields) {
        Object.keys(schema.fields).forEach(field => {
          const value = req.body[field];
          const expectedType = schema.fields[field];

          if (value !== undefined && typeof value !== expectedType) {
            throw createValidationError(
              \`Invalid type for field '\${field}'\`,
              { field, expected: expectedType, received: typeof value }
            );
          }
        });
      }

      next();
    } catch (error) {
      return sendError(res, error, error.statusCode || 400);
    }
  };
};

// Validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.allowed) {
        const invalidParams = Object.keys(req.query).filter(
          key => !schema.allowed.includes(key)
        );
        if (invalidParams.length > 0) {
          throw createValidationError('Invalid query parameters', { invalidParams });
        }
      }
      next();
    } catch (error) {
      return sendError(res, error, error.statusCode || 400);
    }
  };
};

// Validate route parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.required) {
        const missing = schema.required.filter(param => !req.params[param]);
        if (missing.length > 0) {
          throw createValidationError('Missing required parameters', { missing });
        }
      }
      next();
    } catch (error) {
      return sendError(res, error, error.statusCode || 400);
    }
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};
\`\`\`

FILE: src/middleware/index.js
\`\`\`javascript
const { errorHandler, notFoundHandler } = require('./errorHandler');
const { requestLogger } = require('./requestLogger');
const { validateBody, validateQuery, validateParams } = require('./validator');

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateBody,
  validateQuery,
  validateParams
};
\`\`\`

⚠️ VALIDATION CHECKLIST - MUST PASS ALL:
✅ errorHandler.js contains errorHandler function (4 params)
✅ errorHandler.js contains notFoundHandler function (2 params)
✅ errorHandler.js exports: { errorHandler, notFoundHandler }
✅ index.js imports: { errorHandler, notFoundHandler }
✅ index.js exports: { errorHandler, notFoundHandler, ... }

🚨 DO NOT SKIP notFoundHandler - IT IS REQUIRED!`,

    database: `Generate database connection and migration system for PostgreSQL.

Database Name: ${dbName}

TABLES IN THIS PROJECT:
${project.schema.map((table: any) => `
- ${table.name}
  Fields: ${table.fields.map((f: any) => {
    const constraints = [];
    if (f.required) constraints.push('required');
    if (f.unique) constraints.push('unique');
    if (f.references) constraints.push(`FK→${f.references}`);
    return `${f.name}:${f.type}${constraints.length ? `(${constraints.join(',')})` : ''}`;
  }).join(', ')}`).join('\n')}

REQUIRED FILES:
1. src/database/index.js - Re-export connection functions
2. src/database/connections.js - Pool management with SSL auto-detection (PLURAL)
3. src/database/migrations.js - Migration runner utility (PLURAL)
4. src/database/migrations/001_initial_schema.sql - Complete schema creation
5. src/database/seeds.js - Sample data seeding utility (PLURAL)

🚨 CRITICAL DATABASE CONNECTION PATTERN - SINGLETON WITH PROPER RETURN:

FILE: src/database/connections.js
\`\`\`javascript
const { Pool } = require('pg');

const sslConfig = process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false }
  : false;

let pool = null;

const createPools = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: sslConfig,
      max: process.env.DB_POOL_MAX || 10,
      min: process.env.DB_POOL_MIN || 2,
      idleTimeoutMillis: process.env.DB_POOL_IDLE || 10000,
      connectionTimeoutMillis: 2000
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  
  return pool;
};

const getPools = () => {
  return createPools();
};

const closePools = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { createPools, getPools, closePools };
\`\`\`

FILE: src/database/index.js
\`\`\`javascript
const { createPools, getPools, closePools } = require('./connections');

module.exports = {
  createPools,
  getPools,
  closePools
};
\`\`\`

🚨 VALIDATION CHECKLIST - AI MUST VERIFY:
✅ createPools returns pool directly (NOT { pool })
✅ getPools returns pool directly (NOT { pool })
✅ Singleton pattern implemented (pool created once)
✅ SSL auto-detection based on NODE_ENV
✅ Pool error handling included
✅ closePools properly cleans up and nullifies pool
✅ Connection timeout and pool size configured

⚠️ MODELS MUST USE THIS PATTERN:
\`\`\`javascript
const { createPools } = require('../database/connections');

const createUserModels = () => {
  const pool = createPools();

  const findAllRecords = async () => {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
  };
  
  // ... rest of CRUD operations
};
\`\`\`

⚠️ COMPLETE MIGRATION SQL:
Generate the EXACT SQL below in migrations/001_initial_schema.sql:

\`\`\`sql
${migrationSQL}
\`\`\`

⚠️ CRITICAL: 
- Generate ALL ${project.schema.length} tables in the migration SQL!
- Return pool directly from createPools (no wrapper object)
- Implement singleton pattern to prevent connection leaks
- ALL function names MUST be PLURAL (createPools, getPools, closePools)`,


  models: `Generate database model modules using FUNCTIONAL factory pattern with COMPLETE CRUD operations.

Database: ${dbName}

🚨 CRITICAL: Each model MUST implement ALL database operations using pg library!

MODELS TO GENERATE:
${project.schema.map((table: any) => `
- ${table.name}
  File: ${toCamelCaseLocal(table.name)}Models.js (PLURAL)
  Factory: create${toPascalCaseLocal(table.name)}Models (PLURAL)
  Schema Fields (USE ONLY THESE):
${table.fields.map((f: any) => {
    const constraints = [];
    if (f.required) constraints.push('REQUIRED');
    if (f.unique) constraints.push('UNIQUE');
    if (f.references) constraints.push(`FK→${f.references}`);
    return `    • ${f.name}: ${f.type}${constraints.length ? ` (${constraints.join(', ')})` : ''}`;
  }).join('\n')}`).join('\n')}

REQUIRED FILES:
1. src/models/index.js - Re-export all model factories
${project.schema.map((table: any) => 
  `2. src/models/${toCamelCaseLocal(table.name)}Models.js - COMPLETE CRUD for ${table.name}`
).join('\n')}

🚨 MANDATORY COMPLETE EXAMPLE FOR EACH TABLE:

\`\`\`javascript
const { createPools } = require('../database/connections');
const { createNotFoundError } = require('../utils/errors');

const create${toPascalCaseLocal(project.schema[0]?.name || 'User')}Models = () => {
  const pool = createPools();

  // CREATE
  const createRecord = async (data) => {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => \`$\${i + 1}\`).join(', ');
    
    const query = \`
      INSERT INTO ${project.schema[0]?.name || 'users'} (\${fields.join(', ')})
      VALUES (\${placeholders})
      RETURNING *
    \`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  };

  // READ ALL with pagination
  const findAllRecords = async (filters = {}, options = {}) => {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;
    
    const whereClauses = ['deleted_at IS NULL'];
    const values = [];
    let valueIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        whereClauses.push(\`\${key} = $\${valueIndex}\`);
        values.push(value);
        valueIndex++;
      }
    });

    const whereClause = \`WHERE \${whereClauses.join(' AND ')}\`;
    
    const countQuery = \`SELECT COUNT(*) as total FROM ${project.schema[0]?.name || 'users'} \${whereClause}\`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    const query = \`
      SELECT * FROM ${project.schema[0]?.name || 'users'}
      \${whereClause}
      ORDER BY \${sortBy} \${sortOrder}
      LIMIT $\${valueIndex} OFFSET $\${valueIndex + 1}
    \`;
    
    const result = await pool.query(query, [...values, limit, offset]);

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  };

  // READ BY ID
  const findByIdRecord = async (id) => {
    const query = \`SELECT * FROM ${project.schema[0]?.name || 'users'} WHERE id = $1 AND deleted_at IS NULL\`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw createNotFoundError('${toPascalCaseLocal(project.schema[0]?.name || 'User')} not found');
    }
    
    return result.rows[0];
  };

  // UPDATE
  const updateByIdRecord = async (id, data) => {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, i) => \`\${field} = $\${i + 2}\`).join(', ');
    
    const query = \`
      UPDATE ${project.schema[0]?.name || 'users'}
      SET \${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    \`;
    
    const result = await pool.query(query, [id, ...values]);
    
    if (result.rows.length === 0) {
      throw createNotFoundError('${toPascalCaseLocal(project.schema[0]?.name || 'User')} not found');
    }
    
    return result.rows[0];
  };

  // SOFT DELETE
  const deleteByIdRecord = async (id) => {
    const query = \`
      UPDATE ${project.schema[0]?.name || 'users'}
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    \`;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw createNotFoundError('${toPascalCaseLocal(project.schema[0]?.name || 'User')} not found');
    }
    
    return result.rows[0];
  };

  // COUNT
  const countRecords = async (filters = {}) => {
    const whereClauses = ['deleted_at IS NULL'];
    const values = [];
    let valueIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        whereClauses.push(\`\${key} = $\${valueIndex}\`);
        values.push(value);
        valueIndex++;
      }
    });

    const query = \`SELECT COUNT(*) as total FROM ${project.schema[0]?.name || 'users'} WHERE \${whereClauses.join(' AND ')}\`;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  };

  return {
    createRecord,
    findAllRecords,
    findByIdRecord,
    updateByIdRecord,
    deleteByIdRecord,
    countRecords
  };
};

module.exports = { create${toPascalCaseLocal(project.schema[0]?.name || 'User')}Models };
\`\`\`

✅ MANDATORY CHECKLIST FOR EACH MODEL:
1. ✅ Import createPools from '../database/connections'
2. ✅ Call const pool = createPools() inside factory
3. ✅ Implement createRecord with INSERT ... RETURNING *
4. ✅ Implement findAllRecords with pagination, sorting, filters
5. ✅ Implement findByIdRecord with error handling
6. ✅ Implement updateByIdRecord with RETURNING *
7. ✅ Implement deleteByIdRecord (soft delete)
8. ✅ Implement countRecords
9. ✅ Use parameterized queries ($1, $2, etc.)
10. ✅ Include deleted_at IS NULL in all WHERE clauses
11. ✅ Export as { createTableNameModels }

⚠️ DO NOT:
❌ Use class-based models
❌ Forget parameterized queries
❌ Skip RETURNING * in INSERT/UPDATE
❌ Skip soft delete checks
❌ Add fields not in schema`,

    services: `Generate service modules using FUNCTIONAL factory pattern.

Database: ${dbName}

SERVICES TO GENERATE:
${project.schema.map((table: any) => `
- ${table.name}
  File: ${toCamelCaseLocal(table.name)}Services.js (PLURAL)
  Factory: create${toPascalCaseLocal(table.name)}Services
  Model: create${toPascalCaseLocal(table.name)}Models`).join('\n')}

REQUIRED FILES:
1. src/services/index.js - Re-export all service factories
${project.schema.map((table: any) => 
  `2. src/services/${toCamelCaseLocal(table.name)}Services.js - ${toPascalCaseLocal(table.name)} service (PLURAL)`
).join('\n')}

CRITICAL STANDARDS:
✅ Filename PLURAL: userServices.js, productServices.js
✅ Factory name PLURAL: createUserServices, createProductServices
✅ All function names PLURAL: getAllRecords, getRecords, createRecords, updateRecords, removeRecords`,

    handlers: `Generate handler modules using FUNCTIONAL approach.

Database: ${dbName}

HANDLERS TO GENERATE:
${project.schema.map((table: any) => `
- ${table.name}
  File: ${toCamelCaseLocal(table.name)}Handlers.js (PLURAL)
  Functions: handleGetAll${toPascalCaseLocal(table.name)}Records, handleGet${toPascalCaseLocal(table.name)}Records, handleCreate${toPascalCaseLocal(table.name)}Records, handleUpdate${toPascalCaseLocal(table.name)}Records, handleDelete${toPascalCaseLocal(table.name)}Records`).join('\n')}

REQUIRED FILES:
1. src/handlers/index.js - Re-export all handlers
${project.schema.map((table: any) => 
  `2. src/handlers/${toCamelCaseLocal(table.name)}Handlers.js - ${toPascalCaseLocal(table.name)} handlers (PLURAL)`
).join('\n')}

CRITICAL STANDARDS:
✅ Filename PLURAL: userHandlers.js, productHandlers.js
✅ All function names PLURAL with "Records" suffix`,

    routes: `Generate route files using Express Router.

Database: ${dbName}

ROUTES TO GENERATE:
${project.schema.map((table: any) => `
- ${table.name}
  File: ${toCamelCaseLocal(table.name)}Routes.js (PLURAL)
  Import handlers from: ../handlers/${toCamelCaseLocal(table.name)}Handlers`).join('\n')}

REQUIRED FILES:
1. src/routes/index.js - Mount all routes
${project.schema.map((table: any) => 
  `2. src/routes/${toCamelCaseLocal(table.name)}Routes.js - ${toPascalCaseLocal(table.name)} routes (PLURAL)`
).join('\n')}

CRITICAL STANDARDS:
✅ Filename PLURAL: userRoutes.js, productRoutes.js
✅ Import from PLURAL handler files

FILE: src/routes/index.js
\`\`\`javascript
const express = require('express');
const router = express.Router();

${project.schema.map((table: any) => {
  const camelName = toCamelCaseLocal(table.name);
  return `const { router: ${camelName}Router } = require('./${camelName}Routes');`;
}).join('\n')}

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
${project.schema.map((table: any) => {
  const camelName = toCamelCaseLocal(table.name);
  return `router.use('/${camelName}', ${camelName}Router);`;
}).join('\n')}

module.exports = { router };
\`\`\``,

    tests: `Generate test files using Jest with FUNCTIONAL approach.

Database: ${dbName}

REQUIRED FILES:
1. tests/setup.js - Test environment setup
2. tests/unit/models.test.js - Model unit tests
3. tests/integration/api.test.js - API integration tests

CRITICAL:
✅ All filenames PLURAL where applicable
✅ Use Jest and Supertest
✅ Follow same naming conventions as production code`,

    main: `Generate the main application entry point (src/index.js).

Database: ${dbName}

CRITICAL REQUIREMENTS:
✅ Import from PLURAL files
✅ Use proper middleware ordering
✅ Include health check endpoint
✅ Graceful shutdown handling

STRUCTURE:
\`\`\`javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const { createLogger } = require('./utils/logger');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware');
const { router: apiRouter } = require('./routes');
const { getPools, closePools } = require('./database/connections');

const logger = createLogger();
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(\`Server started on port \${PORT}\`);
  logger.info(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
  
  // Test database connection
  getPools().query('SELECT NOW()')
    .then(() => logger.info('Database connected successfully'))
    .catch(err => logger.error('Database connection failed', { error: err.message }));
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(\`\${signal} received, shutting down gracefully\`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await closePools();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
\`\`\``,
  };
}

// ============================================================================
// DOCKER FUNCTIONS
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
// DEPENDENCY MANAGEMENT
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
// CONFIG FUNCTIONS
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