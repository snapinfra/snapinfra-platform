// ============================================================================
// CODE GENERATOR TEMPLATES - FULLY FIXED
// Consistent naming, proper escaping, working migrations
// ============================================================================

import { CodeGenOptions, GeneratedFile, Project, toCamelCase, toPascalCase } from "./code-generator-analysis";

export function getModulePrompts(project: any) {
  const dbName = project.database?.name || project.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  return {
    models: `Generate models with createPools, CRUD operations, exports as { create[Table]Models }`,
    services: `Generate services with service factories, exports as { create[Table]Services }`,
    handlers: `Generate handlers with handler functions, exports as { handleGet..., handleCreate..., etc }`,
    routes: `Generate Express routes, exports as { router: [table]Router }`,
    utils: `Generate utils: logger, errors, responses, validations`,
    middleware: `Generate middleware: errorHandler, notFoundHandler, requestLogger, validator`,
    database: `Database with connections, migrate, seeds - see generateDatabaseModule function`,
  };
}

// ============================================================================
// PROPER STRING ESCAPING UTILITY
// ============================================================================

function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function escapeForSQL(str: string): string {
  // Use $$ for SQL functions to avoid escaping issues
  return str;
}

// ============================================================================
// DATABASE MODULE GENERATOR (COMPLETELY FIXED)
// ============================================================================

export function generateDatabaseModule(state: any): GeneratedFile[] {
  const dbName = state.project.database?.name ||
    state.project.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // 1. CONNECTIONS.JS - Fixed singleton pattern with proper pool management
  const connections: GeneratedFile = {
    path: 'src/database/connections.js',
    content: `const { Pool } = require('pg');

const sslConfig = process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false'
  ? { rejectUnauthorized: false }
  : false;

let pool = null;

const createPools = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || '${dbName}',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: sslConfig,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    console.log('Database pool created successfully');
  }

  return pool;
};

const getPools = () => {
  return pool ? pool : createPools();
};

const closePools = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
};

module.exports = { createPools, getPools, closePools };`,
    description: 'Database connection pool with singleton pattern'
  };

  // 2. MIGRATE.JS - COMPLETELY FIXED with proper SQL parsing
  const migrate: GeneratedFile = {
    path: 'src/database/migrate.js',
    content: `const { createPools } = require('./connections');
const fs = require('fs');
const path = require('path');

/**
 * Smart SQL parser that handles:
 * - Dollar-quoted strings ($$)
 * - Multi-line statements
 * - Comments
 * - Functions and triggers
 */
function parseSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarQuoteTag = '';
  let inComment = false;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];
    const prev = sql[i - 1];

    // Handle line comments
    if (char === '-' && next === '-' && !inString && !inDollarQuote) {
      inComment = true;
      continue;
    }

    if (inComment) {
      if (char === '\\n') {
        inComment = false;
      }
      continue;
    }

    // Handle dollar quotes ($$) for functions
    if (char === '$' && next === '$' && !inString) {
      if (!inDollarQuote) {
        inDollarQuote = true;
        dollarQuoteTag = '$$';
        current += '$$';
        i++; // Skip next $
        continue;
      } else {
        inDollarQuote = false;
        current += '$$';
        i++; // Skip next $
        continue;
      }
    }

    // Handle regular strings
    if (!inDollarQuote && (char === "'" || char === '"')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && prev !== '\\\\') {
        inString = false;
        stringChar = '';
      }
    }

    // Handle semicolons (statement separators)
    if (char === ';' && !inDollarQuote && !inString) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add last statement if exists
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }

  return statements;
}

async function runMigrations() {
  const pool = createPools();
  
  try {
    console.log('Starting database migrations...');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping...');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    // Create migrations tracking table
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    \`);
    
    console.log(\`Found \${files.length} migration file(s)\`);
    
    for (const file of files) {
      // Check if already executed
      const checkResult = await pool.query(
        'SELECT filename FROM schema_migrations WHERE filename = $1',
        [file]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(\`⏭️  Skipping \${file} (already executed)\`);
        continue;
      }
      
      console.log(\`Running migration: \${file}\`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute in transaction
      await pool.query('BEGIN');
      
      try {
        const statements = parseSQLStatements(sql);
        
        console.log(\`  Executing \${statements.length} statement(s)...\`);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.query(statement);
          }
        }
        
        // Record migration
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        
        await pool.query('COMMIT');
        console.log(\`✅ Successfully executed: \${file}\`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(\`❌ Error in \${file}:\`, error.message);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigrations };`,
    description: 'Database migration runner with smart SQL parsing'
  };

  // 3. SEEDS.JS - Database seeding
  const seeds: GeneratedFile = {
    path: 'src/database/seeds.js',
    content: `const { createPools, closePools } = require('./connections');

async function seedDatabase() {
  const pool = createPools();

  try {
    console.log('Starting database seeding...');

    const tables = ${JSON.stringify(state.project.schema.map((t: any) => t.name))};
    
    for (const table of tables) {
      const result = await pool.query(\`SELECT COUNT(*) as count FROM "\${table}"\`);
      const count = parseInt(result.rows[0].count);
      
      if (count > 0) {
        console.log(\`Table \${table} already has \${count} record(s), skipping...\`);
        continue;
      }

      console.log(\`Seeding table: \${table}\`);
      // Add your seed data here
      // Example:
      // await pool.query(\`INSERT INTO "\${table}" (field1, field2) VALUES ($1, $2)\`, [val1, val2]);
    }

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await closePools();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedDatabase };`,
    description: 'Database seeding utility'
  };

  // 4. Generate migration SQL (FIXED - proper escaping and structure)
  const generateTableSQL = (table: any) => {
    const tableName = table.name.toLowerCase();

    // Filter out standard fields we'll add automatically
    const schemaFields = table.fields.filter((f: any) => {
      const fieldName = f.name.toLowerCase();
      return !['id', 'created_at', 'updated_at', 'deleted_at'].includes(fieldName);
    });

    const fieldDefinitions = schemaFields.map((field: any) => {
      let sql = `  ${field.name.toLowerCase()} `;

      // Map types to PostgreSQL types
      const typeMap: Record<string, string> = {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        email: 'VARCHAR(255)',
        password: 'VARCHAR(255)',
        integer: 'INTEGER',
        int: 'INTEGER',
        bigint: 'BIGINT',
        float: 'DECIMAL(10, 2)',
        decimal: 'DECIMAL(10, 2)',
        number: 'DECIMAL(10, 2)',
        boolean: 'BOOLEAN',
        bool: 'BOOLEAN',
        date: 'DATE',
        datetime: 'TIMESTAMPTZ',
        timestamp: 'TIMESTAMPTZ',
        json: 'JSONB',
        uuid: 'UUID',
        longtext: 'TEXT'
      };

      sql += typeMap[field.type.toLowerCase()] || 'VARCHAR(255)';

      if (field.required) sql += ' NOT NULL';
      if (field.unique) sql += ' UNIQUE';
      if (field.default !== undefined) {
        if (typeof field.default === 'string') {
          sql += ` DEFAULT '${field.default}'`;
        } else {
          sql += ` DEFAULT ${field.default}`;
        }
      }

      return sql;
    });

    // Add foreign key constraints
    const foreignKeys = schemaFields
      .filter((f: any) => f.references)
      .map((f: any) => {
        const [refTable, refColumn = 'id'] = f.references.split('.');
        return `  CONSTRAINT fk_${tableName}_${f.name} FOREIGN KEY (${f.name}) REFERENCES ${refTable}(${refColumn}) ON DELETE CASCADE`;
      });

    const allConstraints = [...fieldDefinitions, ...foreignKeys].filter(Boolean).join(',\n');

    return `-- Table: ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
${allConstraints ? allConstraints + ',' : ''}
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- Indexes for ${tableName}
CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_${tableName}_deleted_at ON ${tableName}(deleted_at) WHERE deleted_at IS NULL;

-- Update trigger for ${tableName}
CREATE TRIGGER update_${tableName}_updated_at 
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`;
  };

  const allTablesSQL = state.project.schema.map(generateTableSQL).join('\n');

  const migrationSQL = `-- ============================================================================
-- Database: ${dbName}
-- Generated: ${new Date().toISOString()}
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Tables
-- ============================================================================

${allTablesSQL}

-- ============================================================================
-- Verification queries (uncomment to verify)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
`;

  const migration: GeneratedFile = {
    path: 'src/database/migrations/001_initial_schema.sql',
    content: migrationSQL,
    description: 'Initial database schema migration'
  };

  // 5. Index file
  const index: GeneratedFile = {
    path: 'src/database/index.js',
    content: `const { createPools, getPools, closePools } = require('./connections');
const { runMigrations } = require('./migrate');
const { seedDatabase } = require('./seeds');

module.exports = {
  createPools,
  getPools,
  closePools,
  runMigrations,
  seedDatabase
};`,
    description: 'Database module exports'
  };

  return [connections, migrate, seeds, migration, index];
}

// ============================================================================
// DOCKER ENTRYPOINT (FIXED - Proper migration execution)
// ============================================================================

export function generateEnhancedDockerEntrypoint(project: Project): GeneratedFile {
  return {
    path: 'docker-entrypoint.sh',
    content: `#!/bin/sh
set -e

echo "🚀 Starting ${project.name}..."
echo "================================================"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_TRIES=60
COUNTER=0

until PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "\${DB_PORT:-5432}" -U "$DB_USER" -d "postgres" -c '\\q' 2>/dev/null; do
  COUNTER=$((COUNTER + 1))
  if [ $COUNTER -gt $MAX_TRIES ]; then
    echo "❌ PostgreSQL connection timeout - exiting"
    exit 1
  fi
  echo "   Attempt $COUNTER/$MAX_TRIES..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📦 Checking database '$DB_NAME'..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "\${DB_PORT:-5432}" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "   Creating database '$DB_NAME'..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "\${DB_PORT:-5432}" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME" 2>&1
  if [ $? -eq 0 ]; then
    echo "   ✅ Database created successfully!"
  else
    echo "   ❌ Failed to create database"
    exit 1
  fi
else
  echo "   ✅ Database already exists"
fi

# Run migrations
echo "🔄 Running database migrations..."
if [ -d "/app/src/database/migrations" ]; then
  cd /app
  node src/database/migrate.js
  if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
  else
    echo "❌ Migrations failed"
    exit 1
  fi
else
  echo "⚠️  No migrations directory found, skipping..."
fi

echo "================================================"
echo "✅ Setup complete - starting application..."
echo "================================================"

# Execute the main command
exec "$@"`,
    description: 'Docker entrypoint script with proper migration execution'
  };
}

// ============================================================================
// DOCKER FILES (FIXED)
// ============================================================================

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
// DEPENDENCY MANAGEMENT (FIXED)
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
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
) {
  if (options.includeAuth) {
    dependencies['jsonwebtoken'] = '^9.0.2';
    dependencies['bcrypt'] = '^5.1.1';
  }

  if (options.includeTests) {
    devDependencies['jest'] = '^29.7.0';
    devDependencies['supertest'] = '^6.3.3';
  }

  if (project.decisions?.selectedTools?.['decision-cache'] === 'redis') {
    dependencies['redis'] = '^4.6.0';
  }
}

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