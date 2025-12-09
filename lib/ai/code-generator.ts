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
export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  auth: boolean;
  group: string;
  body?: Record<string, string>;
}


export interface EnhancedGenerationContext extends GenerationContext {
  functionRegistry: FunctionRegistry;
  apiEndpoints?: Map<string, APIEndpoint[]>;
}

interface DiagramComponent {
  id: string;
  name: string;
  type: 'table' | 'custom';
  description: string;
  endpoints: APIEndpoint[];
  methods?: string[];
  dependencies?: string[];
  technology?: string;
  layer?: string;
}



function isValidJavaScriptIdentifier(name: string): boolean {
  // Must start with letter, $, or _
  // Can contain letters, digits, $, or _
  const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  // Reserved keywords
  const reservedWords = [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
    'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
    'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
    'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum',
    'await', 'implements', 'interface', 'package', 'private', 'protected',
    'public'
  ];

  return identifierRegex.test(name) && !reservedWords.includes(name);
}



function sanitizeToIdentifier(name: string): string {
  // First, try to extract and clean the component name
  let cleaned = extractComponentName(name);

  // If still not valid, do aggressive cleaning
  if (!isValidJavaScriptIdentifier(cleaned)) {
    cleaned = cleaned
      .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric
      .replace(/^\d+/, ''); // Remove leading numbers

    // If empty after cleaning, use default
    if (!cleaned) {
      cleaned = 'component';
    }

    // Ensure starts with lowercase
    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  return cleaned;
}




function extractAllComponents(project: Project): DiagramComponent[] {
  const components: DiagramComponent[] = [];
  const processedNames = new Set<string>();

  // 1. Extract from Schema (table-based components)
  project.schema.forEach(table => {
    const cleanName = sanitizeToIdentifier(table.name);
    const endpoints = getEndpointsForTable(project, table.name);

    components.push({
      id: table.id || `table-${cleanName}`,
      name: cleanName, // 🔥 USE SANITIZED NAME
      type: 'table',
      description: table.description || `${table.name} entity`,
      endpoints,
      methods: [],
      dependencies: []
    });

    processedNames.add(cleanName.toLowerCase());
  });

  // 2. Extract from API Map (custom components)
  if (project.diagrams?.apiMap?.nodes) {
    project.diagrams.apiMap.nodes.forEach((node: any) => {
      const rawName = node.data?.name || node.id;
      const cleanName = sanitizeToIdentifier(rawName); // 🔥 SANITIZE

      // Skip if already processed
      if (processedNames.has(cleanName.toLowerCase())) return;

      // Only process api-service nodes
      if (node.type !== 'api-service') return;

      const endpoints = extractEndpointsFromNode(node);

      if (endpoints.length > 0) {
        components.push({
          id: node.id,
          name: cleanName, // 🔥 USE SANITIZED NAME
          type: 'custom',
          description: node.data?.description || '',
          endpoints,
          methods: [],
          dependencies: []
        });

        processedNames.add(cleanName.toLowerCase());
      }
    });
  }

  // 3. Extract from LLD (custom components with implementations)
  if (project.diagrams?.lld?.nodes) {
    project.diagrams.lld.nodes.forEach((node: any) => {
      const rawName = node.data?.name || node.id;
      const cleanName = sanitizeToIdentifier(rawName); // 🔥 SANITIZE

      // Skip if already processed
      if (processedNames.has(cleanName.toLowerCase())) return;

      // Look for Controller/Handler/Service components
      const isController = node.data?.name?.includes('Controller');
      const isHandler = node.data?.name?.includes('Handler');
      const isService = node.data?.name?.includes('Service');

      if (!isController && !isHandler && !isService) return;

      // Extract or infer endpoints
      const endpoints = extractEndpointsFromLLDNode(node);

      if (endpoints.length > 0) {
        components.push({
          id: node.id,
          name: cleanName, // 🔥 USE SANITIZED NAME
          type: 'custom',
          description: node.data?.description || '',
          endpoints,
          methods: node.data?.metadata?.methods || [],
          dependencies: node.data?.metadata?.dependencies || [],
          technology: node.data?.metadata?.technology || '',
          layer: node.data?.metadata?.layer || ''
        });

        processedNames.add(cleanName.toLowerCase());
      }
    });
  }

  console.log(`\n📐 Extracted ${components.length} components from diagrams:`);
  console.log(`   • Table-based: ${components.filter(c => c.type === 'table').length}`);
  console.log(`   • Custom: ${components.filter(c => c.type === 'custom').length}`);

  components.forEach(c => {
    // 🔥 VALIDATE: Ensure all names are valid JavaScript identifiers
    if (!isValidJavaScriptIdentifier(c.name)) {
      console.warn(`   ⚠️  WARNING: Component name "${c.name}" is not a valid JavaScript identifier!`);
      c.name = sanitizeToIdentifier(c.name);
      console.warn(`   ✓ Fixed to: "${c.name}"`);
    }
    console.log(`   - ${c.name} (${c.type}): ${c.endpoints.length} endpoints`);
  });

  return components;
}

/**
 * Extract component name from node name or ID
 */
function extractComponentName(rawName: string): string {
  let name = rawName
    .replace(/Controller$/i, '')
    .replace(/Handler$/i, '')
    .replace(/Handlers$/i, '')
    .replace(/Service$/i, '')
    .replace(/Services$/i, '')
    .replace(/Router$/i, '')
    .replace(/Routes?$/i, '')
    .replace(/Model$/i, '')
    .replace(/Models$/i, '')
    .trim()
    .replace(/-api-service$/i, '')
    .replace(/-service$/i, '')
    .replace(/-api$/i, '')
    .replace(/ApiService$/i, '')
    .replace(/Service$/i, '')
    .replace(/Api$/i, '')
    .replace(/[-_\s]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim();

  const parts = name.split(/\s+/);
  name = parts
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join('');

  name = name.replace(/[^a-zA-Z0-9]/g, '');
  if (!name || name.length === 0) name = 'component';
  if (/^\d/.test(name)) name = 'component' + name;
  if (/^[A-Z]/.test(name)) name = name.charAt(0).toLowerCase() + name.slice(1);

  return name;
}

/**
 * Extract endpoints from API Map node
 */
function extractEndpointsFromNode(node: any): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];

  // Method 1: Explicit endpoints in metadata
  if (node.data?.metadata?.endpoints) {
    return node.data.metadata.endpoints.map((ep: any) => ({
      path: ep.path,
      method: ep.method || 'GET',
      description: ep.description || '',
      auth: ep.requiresAuth || false,
      group: node.data.name,
      body: ep.requestBody || {}
    }));
  }

  // Method 2: Infer from description (e.g., "/api/v1/hello")
  if (node.data?.description) {
    const pathMatch = node.data.description.match(/\/api\/v?\d*\/[\w-]+/);
    if (pathMatch) {
      endpoints.push({
        path: pathMatch[0],
        method: 'GET',
        description: node.data.description,
        auth: false,
        group: node.data.name,
        body: {}
      });
    }
  }

  return endpoints;
}

/**
 * Extract endpoints from LLD node
 */
function extractEndpointsFromLLDNode(node: any): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  const componentName = extractComponentName(node.data?.name || node.id);

  // Method 1: Explicit methods in metadata
  if (node.data?.metadata?.methods) {
    node.data.metadata.methods.forEach((method: string) => {
      // Parse method signature like "POST /api/v1/auth/login"
      const match = method.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\/api\/[^\s]+)/i);
      if (match) {
        endpoints.push({
          path: match[2],
          method: match[1],
          description: node.data.description || '',
          auth: false,
          group: componentName,
          body: {}
        });
      }
    });
  }

  // Method 2: Infer from description
  if (endpoints.length === 0 && node.data?.description) {
    // Look for path patterns in description
    const pathMatch = node.data.description.match(/\/api\/v?\d*\/[\w-]+/);
    if (pathMatch) {
      endpoints.push({
        path: pathMatch[0],
        method: 'GET',
        description: node.data.description,
        auth: false,
        group: componentName,
        body: {}
      });
    } else {
      // Default: create a proper GET endpoint with the component name
      endpoints.push({
        path: `/api/v1/${componentName}`,
        method: 'GET',
        description: node.data.description || `${componentName} endpoint`,
        auth: false,
        group: componentName,
        body: {}
      });
    }
  }

  // If still no endpoints, create a complete RESTful set
  if (endpoints.length === 0) {
    const basePath = `/api/v1/${componentName}`;
    endpoints.push(
      {
        path: basePath,
        method: 'GET',
        description: `Get all ${componentName} records`,
        auth: false,
        group: componentName,
        body: {}
      },
      {
        path: `${basePath}/:id`,
        method: 'GET',
        description: `Get ${componentName} by ID`,
        auth: false,
        group: componentName,
        body: {}
      },
      {
        path: basePath,
        method: 'POST',
        description: `Create new ${componentName}`,
        auth: false,
        group: componentName,
        body: {}
      },
      {
        path: `${basePath}/:id`,
        method: 'PUT',
        description: `Update ${componentName}`,
        auth: false,
        group: componentName,
        body: {}
      },
      {
        path: `${basePath}/:id`,
        method: 'DELETE',
        description: `Delete ${componentName}`,
        auth: false,
        group: componentName,
        body: {}
      }
    );
  }

  return endpoints;
}

/**
 * Extract endpoints from project data by group/table
 */
function getEndpointsForTable(project: Project, tableName: string): APIEndpoint[] {
  if (!project.endpoints || !Array.isArray(project.endpoints)) {
    return [];
  }

  // Find endpoints that match this table's group
  const tableGroup = toPascalCase(tableName);

  return project.endpoints.filter((endpoint: any) => {
    // Match by group name (case-insensitive)
    if (endpoint.group && endpoint.group.toLowerCase() === tableName.toLowerCase()) {
      return true;
    }

    // Match by path pattern (e.g., /api/v1/tasks)
    const pathMatch = endpoint.path.match(/\/api\/v\d+\/(\w+)/);
    if (pathMatch && pathMatch[1] === tableName.toLowerCase()) {
      return true;
    }

    return false;
  });
}

/**
 * Generate route method name from endpoint
 */
function getRouteMethodName(endpoint: APIEndpoint): string {
  const method = endpoint.method.toLowerCase();
  const pathParts = endpoint.path.split('/').filter(p => p && p !== 'api' && !p.startsWith('v'));

  // Extract resource name from path (last non-param part)
  const resourcePart = pathParts.find(p => !p.startsWith(':')) || 'Resource';

  // Determine action based on method and path structure
  let action = '';
  if (endpoint.path.includes(':id') || endpoint.path.includes('{id}')) {
    // Single resource operations
    if (method === 'get') action = 'Get';
    else if (method === 'put' || method === 'patch') action = 'Update';
    else if (method === 'delete') action = 'Delete';
  } else {
    // Collection operations
    if (method === 'get') action = 'GetAll';
    else if (method === 'post') action = 'Create';
  }

  return action || 'Handle';
}

/**
 * Generate handler function name from endpoint
 */
function getHandlerName(endpoint: APIEndpoint, componentName: string): string {
  const action = getRouteMethodName(endpoint);
  const pascalComponent = toPascalCase(componentName);
  return `handle${action}${pascalComponent}Records`;
}


// ============================================================================
// IMPROVED CONTEXT BUILDER - PASSES ALL GENERATED FUNCTIONS
// ============================================================================

function buildEnhancedContextPrompt(
  moduleSpec: ModuleSpec,
  ctx: EnhancedGenerationContext,
  attemptNumber: number
): string {
  const modulePrompts = getModulePrompts(ctx.project);

  let contextPrompt = EXPORT_STANDARDS + '\n\n';
  contextPrompt += modulePrompts[moduleSpec.type] || '';

  // ============================================================================
  // ARCHITECTURE DECISIONS CONTEXT
  // ============================================================================
  if (ctx.project.decisions?.decisions) {
    contextPrompt += '\n\n🏗️  ARCHITECTURE DECISIONS & SELECTED TOOLS:\n';
    contextPrompt += '='.repeat(80) + '\n';

    const decisions = extractArchitectureDecisions(ctx.project);

    decisions.forEach((decision, category) => {
      contextPrompt += `\n📌 ${category.toUpperCase()}: ${decision.name}\n`;
      contextPrompt += `   Reasoning: ${decision.reasoning}\n`;

      // Add specific implementation notes based on selected tools
      if (category === 'database' && decision.tool === 'postgresql') {
        contextPrompt += `   ⚠️  CRITICAL: Use PostgreSQL-specific features:\n`;
        contextPrompt += `   - UUID primary keys with uuid_generate_v4()\n`;
        contextPrompt += `   - TIMESTAMPTZ for all timestamps\n`;
        contextPrompt += `   - JSONB for flexible attributes\n`;
        contextPrompt += `   - Proper indexing strategy\n`;
      }

      if (category === 'cache' && decision.tool === 'redis') {
        contextPrompt += `   ⚠️  CRITICAL: Implement Redis caching:\n`;
        contextPrompt += `   - Cache frequently accessed data\n`;
        contextPrompt += `   - Use TTL for cache invalidation\n`;
        contextPrompt += `   - Implement cache-aside pattern\n`;
      }
    });

    contextPrompt += '\n' + '='.repeat(80) + '\n';
  }
  if (moduleSpec.components && moduleSpec.components.some(c => c.type === 'custom')) {
    const customComponents = moduleSpec.components.filter(c => c.type === 'custom');

    contextPrompt += '\n\n🎯 CUSTOM COMPONENTS - STRICT IMPLEMENTATION RULES:\n';
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += `⚠️  Generate individual files for each component - NO bundling!\n`;
    contextPrompt += `⚠️  Follow EXACT naming conventions shown below!\n\n`;

    customComponents.forEach((component, idx) => {
      contextPrompt += `\n${idx + 1}. ${component.name.toUpperCase()} COMPONENT\n`;
      contextPrompt += '-'.repeat(80) + '\n';
      contextPrompt += `   Component Name: ${component.name}\n`;
      contextPrompt += `   Source: ${component.layer || 'LLD/API Map diagram'}\n`;
      contextPrompt += `   Description: ${component.description}\n`;

      if (component.technology) {
        contextPrompt += `   Technology: ${component.technology}\n`;
      }

      // Show endpoints with EXACT function names
      if (component.endpoints.length > 0) {
        contextPrompt += `\n   📡 API Endpoints (${component.endpoints.length}):\n`;
        component.endpoints.forEach((endpoint, epIdx) => {
          const routePath = endpoint.path.replace(/\/api\/v\d+\/\w+/, '') || '/';
          const action = getRouteMethodName(endpoint);
          const handlerName = `handle${action}${toPascalCase(component.name)}Records`;

          contextPrompt += `\n   ${epIdx + 1}. ${endpoint.method.toUpperCase()} ${endpoint.path}\n`;
          contextPrompt += `      Route Path: '${routePath}'\n`;
          contextPrompt += `      Handler Function: ${handlerName}\n`;
          contextPrompt += `      Description: ${endpoint.description}\n`;
          contextPrompt += `      Auth: ${endpoint.auth ? 'Required ✓' : 'Not required ✗'}\n`;

          if (endpoint.body && Object.keys(endpoint.body).length > 0) {
            contextPrompt += `      Request Body:\n`;
            Object.entries(endpoint.body).forEach(([key, type]) => {
              contextPrompt += `        - ${key}: ${type}\n`;
            });
          }
        });
      }

      // CRITICAL: File naming with EXACT standards
      contextPrompt += `\n   ✅ MANDATORY FILE NAMING:\n`;

      if (moduleSpec.type === 'custom-handlers') {
        const fileName = `${toCamelCase(component.name)}Handlers.js`; // PLURAL
        contextPrompt += `      📄 File: src/handlers/${fileName}\n`;
        contextPrompt += `\n   ✅ HANDLER FUNCTIONS (EXACT NAMES):\n`;
        component.endpoints.forEach(ep => {
          const action = getRouteMethodName(ep);
          const funcName = `handle${action}${toPascalCase(component.name)}Records`;
          contextPrompt += `      • ${funcName}\n`;
          contextPrompt += `        Signature: async (req, res, next) => {\n`;
          contextPrompt += `          // FULL implementation required\n`;
          contextPrompt += `          // Use try-catch with next(error)\n`;
          contextPrompt += `        }\n`;
        });
        contextPrompt += `\n   ✅ EXPORT (EXACT FORMAT):\n`;
        const allHandlers = component.endpoints.map(ep => {
          const action = getRouteMethodName(ep);
          return `handle${action}${toPascalCase(component.name)}Records`;
        });
        contextPrompt += `      module.exports = { ${allHandlers.join(', ')} };\n`;
      }

      if (moduleSpec.type === 'custom-routes') {
        const fileName = `${toCamelCase(component.name)}Routes.js`; // PLURAL
        contextPrompt += `      📄 File: src/routes/${fileName}\n`;
        contextPrompt += `\n   ✅ ROUTES TO CREATE (EXACT IMPLEMENTATION):\n`;
        contextPrompt += `\n      const express = require('express');\n`;
        contextPrompt += `      const router = express.Router();\n`;

        // Import statement
        const allHandlers = component.endpoints.map(ep => {
          const action = getRouteMethodName(ep);
          return `handle${action}${toPascalCase(component.name)}Records`;
        });
        contextPrompt += `\n      const { ${allHandlers.join(', ')} } = require('../handlers/${toCamelCase(component.name)}Handlers');\n\n`;

        // Route definitions
        component.endpoints.forEach(ep => {
          const routePath = ep.path.replace(/\/api\/v\d+\/\w+/, '') || '/';
          const action = getRouteMethodName(ep);
          const handlerName = `handle${action}${toPascalCase(component.name)}Records`;

          contextPrompt += `      router.${ep.method.toLowerCase()}('${routePath}', ${handlerName});\n`;
        });

        contextPrompt += `\n   ✅ EXPORT:\n`;
        contextPrompt += `      module.exports = { router };\n`;
      }

      if (moduleSpec.type === 'custom-services') {
        const fileName = `${toCamelCase(component.name)}Services.js`; // PLURAL
        contextPrompt += `      📄 File: src/services/${fileName}\n`;
        contextPrompt += `\n   ✅ SERVICE FACTORY:\n`;
        contextPrompt += `      const create${toPascalCase(component.name)}Services = () => {\n`;
        contextPrompt += `        // Business logic functions\n`;
        contextPrompt += `        return { /* service methods */ };\n`;
        contextPrompt += `      };\n`;
        contextPrompt += `\n   ✅ EXPORT:\n`;
        contextPrompt += `      module.exports = { create${toPascalCase(component.name)}Services };\n`;
      }

      contextPrompt += '\n';
    });

    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += `\n⚠️  CRITICAL VALIDATION CHECKLIST:\n`;
    contextPrompt += `1. ✅ File names are camelCase + PLURAL suffix (userHandlers.js)\n`;
    contextPrompt += `2. ✅ Factory names are PLURAL (createUserServices)\n`;
    contextPrompt += `3. ✅ Function names include "Records" (handleGetUserRecords)\n`;
    contextPrompt += `4. ✅ Route paths are NOT empty ('/' or '/endpoint')\n`;
    contextPrompt += `5. ✅ All handlers have FULL implementations (no TODOs)\n`;
    contextPrompt += `6. ✅ Named exports only ({ funcA, funcB })\n`;
    contextPrompt += `7. ✅ Imports match exports exactly\n\n`;
  }


  // ============================================================================
  // LOW-LEVEL DESIGN COMPONENT MAPPING
  // ============================================================================
  if (ctx.project.diagrams?.lld) {
    const components = extractLLDComponents(ctx.project);
    const relevantComponents = mapComponentsToModules(components, moduleSpec.type);

    if (relevantComponents.length > 0) {
      contextPrompt += '\n\n🔧 LOW-LEVEL DESIGN COMPONENTS FOR THIS MODULE:\n';
      contextPrompt += '='.repeat(80) + '\n';
      contextPrompt += `⚠️  CRITICAL: Implement EXACTLY as specified in the architecture!\n\n`;

      relevantComponents.forEach((component, idx) => {
        contextPrompt += `\n${idx + 1}. ${component.name}\n`;
        contextPrompt += `   Description: ${component.description}\n`;
        contextPrompt += `   Technology: ${component.technology}\n`;

        if (component.methods && component.methods.length > 0) {
          contextPrompt += `   Methods to implement:\n`;
          component.methods.forEach((method: string) => {
            contextPrompt += `     • ${method}\n`;
          });
        }

        if (component.dependencies && component.dependencies.length > 0) {
          contextPrompt += `   Dependencies:\n`;
          component.dependencies.forEach((dep: string) => {
            contextPrompt += `     • ${dep}\n`;
          });
        }
      });

      contextPrompt += '\n' + '='.repeat(80) + '\n';
    }
  }

  // ============================================================================
  // SMART RECOMMENDATIONS & BEST PRACTICES
  // ============================================================================
  if (ctx.project.analysis?.smartRecommendations) {
    const relevantRecs = ctx.project.analysis.smartRecommendations.filter(
      (rec: any) =>
        rec.priority === 'High' ||
        rec.type.toLowerCase().includes(moduleSpec.type)
    );

    if (relevantRecs.length > 0) {
      contextPrompt += '\n\n💡 SMART RECOMMENDATIONS FOR THIS MODULE:\n';
      contextPrompt += '='.repeat(80) + '\n';

      relevantRecs.slice(0, 3).forEach((rec: any, idx: number) => {
        contextPrompt += `\n${idx + 1}. ${rec.title} (${rec.priority} Priority)\n`;
        contextPrompt += `   ${rec.description}\n`;
      });

      contextPrompt += '\n' + '='.repeat(80) + '\n';
    }
  }

  // ============================================================================
  // API ENDPOINTS FROM DIAGRAM (for routes and handlers)
  // ============================================================================
  if ((moduleSpec.type === 'routes' || moduleSpec.type === 'handlers') &&
    ctx.project.diagrams?.apiMap) {

    contextPrompt += '\n\n🌐 API ENDPOINTS FROM ARCHITECTURE DIAGRAM:\n';
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '⚠️  CRITICAL: Implement EXACT endpoints as shown in API Map!\n\n';

    const apiEndpoints = extractAPIEndpoints(ctx.project);

    moduleSpec.tables?.forEach(tableName => {
      const endpoints = apiEndpoints.get(tableName.toLowerCase()) ||
        ctx.apiEndpoints?.get(tableName) || [];

      if (endpoints.length > 0) {
        contextPrompt += `\n📋 ${tableName.toUpperCase()} ENDPOINTS (${endpoints.length} total):\n`;
        contextPrompt += '-'.repeat(80) + '\n';

        endpoints.forEach((endpoint, idx) => {
          contextPrompt += `\n${idx + 1}. ${endpoint.method.toUpperCase()} ${endpoint.path}\n`;
          contextPrompt += `   Description: ${endpoint.description}\n`;
          contextPrompt += `   Auth Required: ${endpoint.auth ? 'Yes ✓' : 'No ✗'}\n`;

          if (endpoint.body && Object.keys(endpoint.body).length > 0) {
            contextPrompt += `   Request Body:\n`;
            Object.entries(endpoint.body).forEach(([key, type]) => {
              contextPrompt += `     - ${key}: ${type}\n`;
            });
          }

          if (moduleSpec.type === 'handlers') {
            const handlerName = getHandlerName(endpoint, tableName);
            contextPrompt += `   ✅ Handler Function: ${handlerName}\n`;
            contextPrompt += `   Signature: async (req, res, next) => { ... }\n`;
          }

          if (moduleSpec.type === 'routes') {
            const handlerName = getHandlerName(endpoint, tableName);
            const routePath = endpoint.path.replace(/\/api\/v\d+\/\w+/, '');
            contextPrompt += `   ✅ Route: router.${endpoint.method.toLowerCase()}('${routePath}', ${handlerName})\n`;
            if (endpoint.auth) {
              contextPrompt += `   ✅ Add Auth Middleware: authenticateToken\n`;
            }
          }
        });

        contextPrompt += '\n';
      }
    });

    contextPrompt += '='.repeat(80) + '\n';
  }

  // ============================================================================
  // SECURITY REQUIREMENTS
  // ============================================================================
  if (ctx.project.analysis?.securityRecommendations &&
    (moduleSpec.type === 'auth' || moduleSpec.type === 'middleware')) {

    contextPrompt += '\n\n🔒 SECURITY REQUIREMENTS:\n';
    contextPrompt += '='.repeat(80) + '\n';

    ctx.project.analysis.securityRecommendations
      .filter((rec: any) => rec.priority === 'High')
      .slice(0, 3)
      .forEach((rec: any) => {
        contextPrompt += `\n• ${rec.title}\n`;
        contextPrompt += `  ${rec.description}\n`;
      });

    contextPrompt += '\n' + '='.repeat(80) + '\n';
  }

  // ============================================================================
  // EXISTING CONTEXT (Function Registry, Dependencies, etc.)
  // ============================================================================
  const registryContext = ctx.functionRegistry.buildContextForAI();
  contextPrompt += '\n\n' + registryContext;


  if (moduleSpec.type === 'custom-routes' && moduleSpec.customEndpoints) {
    contextPrompt += '\n\n🎯 CUSTOM API ENDPOINTS (Non-Table-Based):\n';
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '⚠️  These endpoints are NOT tied to database tables!\n\n';

    moduleSpec.customEndpoints.forEach((endpoint, idx) => {
      contextPrompt += `${idx + 1}. ${endpoint.method.toUpperCase()} ${endpoint.path}\n`;
      contextPrompt += `   Description: ${endpoint.description}\n`;
      contextPrompt += `   Handler: handleCustomHello (example)\n`;
      contextPrompt += `   Response: Simple JSON or string response\n\n`;
    });

    contextPrompt += '✅ CREATE FILES:\n';
    contextPrompt += '1. src/handlers/custom.js - Handler functions\n';
    contextPrompt += '2. src/routes/custom.js - Route definitions\n\n';

    contextPrompt += '📝 EXAMPLE IMPLEMENTATION:\n';
    contextPrompt += '```javascript\n';
    contextPrompt += '// src/handlers/custom.js\n';
    contextPrompt += 'const handleCustomHello = async (req, res, next) => {\n';
    contextPrompt += '  try {\n';
    contextPrompt += '    res.json({ message: "Hello, World!" });\n';
    contextPrompt += '  } catch (error) {\n';
    contextPrompt += '    next(error);\n';
    contextPrompt += '  }\n';
    contextPrompt += '};\n\n';
    contextPrompt += 'module.exports = { handleCustomHello };\n';
    contextPrompt += '```\n\n';
    contextPrompt += '='.repeat(80) + '\n';
  }

  // Enhanced dependency context
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

            const relativePath = file.path
              .replace(/^src\//, '../')
              .replace(/\.js$/, '');

            contextPrompt += `\n     ✅ COPY THIS IMPORT EXACTLY:\n`;
            contextPrompt += `     const { ${file.exports.join(', ')} } = require('${relativePath}');\n`;
          }
        });
      }
    }
    contextPrompt += '\n' + '='.repeat(80) + '\n';
  }

  // Retry context
  if (attemptNumber > 1) {
    contextPrompt += `\n\n🔄 RETRY ATTEMPT ${attemptNumber}:\n`;
    contextPrompt += '⚠️  Previous attempt failed validation. Review errors and fix!\n';
  }

  // Table-specific context
  if (moduleSpec.tables && moduleSpec.tables.length > 0) {
    contextPrompt += `\n\n📊 ENTITIES FOR THIS MODULE:\n`;
    contextPrompt += '='.repeat(80) + '\n';

    moduleSpec.tables.forEach(tableName => {
      const table = ctx.project.schema.find(t => t.name === tableName);

      if (table) {
        contextPrompt += `\n🗂️  ${tableName.toUpperCase()}\n`;

        // Show exact names based on module type
        if (moduleSpec.type === 'models') {
          const filename = NAMING_STANDARDS.MODEL_FILE(tableName);
          const factory = NAMING_STANDARDS.MODEL_FACTORY(tableName);
          contextPrompt += `   ✅ Filename: ${filename}\n`;
          contextPrompt += `   ✅ Factory: ${factory}\n`;
          contextPrompt += `   ✅ Export: module.exports = { ${factory} };\n`;
        }

        contextPrompt += `\n   Schema Fields (USE ONLY THESE):\n`;
        table.fields.forEach((field: any) => {
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

  return contextPrompt;
}


function buildOnboardingContextPrompt(project: Project, moduleSpec?: ModuleSpec): string {
  if (!project.onboardingContext) return '';

  let prompt = '\n\n🎯 PROJECT CONTEXT & ARCHITECTURE DECISIONS:\n';
  prompt += '='.repeat(80) + '\n';

  const context = project.onboardingContext;

  // Use case and analysis
  if (context.analysis?.useCase) {
    prompt += `\n📊 USE CASE: ${context.analysis.useCase.label}\n`;
    prompt += `Complexity: ${context.analysis.useCase.complexity}\n`;
    if (context.analysis.useCase.features) {
      prompt += `Features: ${context.analysis.useCase.features.join(', ')}\n`;
    }
  }

  // Architecture decisions
  if (project.decisions?.decisions) {
    prompt += `\n🏗️  ARCHITECTURE DECISIONS:\n`;
    project.decisions.decisions.forEach(decision => {
      if (decision.selectedTool) {
        prompt += `\n${decision.category.toUpperCase()}: ${decision.selectedTool}\n`;
        const selected = decision.recommendations?.find(r => r.id === decision.selectedTool);
        if (selected) {
          prompt += `  Reasoning: ${selected.description}\n`;
          if (selected.pros) {
            prompt += `  Pros: ${selected.pros.slice(0, 3).join('; ')}\n`;
          }
        }
      }
    });
  }

  // Database recommendations
  if (context.analysis?.databaseRecommendations) {
    const topDb = context.analysis.databaseRecommendations[0];
    if (topDb) {
      prompt += `\n💾 DATABASE CHOICE: ${topDb.name} (Score: ${topDb.score})\n`;
      prompt += `  Why: ${topDb.whyForUseCase?.join('; ')}\n`;
    }
  }

  // Security recommendations
  if (context.analysis?.securityRecommendations) {
    prompt += `\n🔒 SECURITY REQUIREMENTS (${context.analysis.securityRecommendations.length} total):\n`;
    context.analysis.securityRecommendations
      .filter(rec => rec.priority === 'High')
      .slice(0, 3)
      .forEach(rec => {
        prompt += `  • ${rec.title}: ${rec.description}\n`;
      });
  }

  // Smart recommendations for specific modules
  if (context.analysis?.smartRecommendations && moduleSpec.type) {
    const relevantRecs = context.analysis.smartRecommendations.filter(rec =>
      rec.type.toLowerCase().includes(moduleSpec.type) ||
      rec.priority === 'High'
    );

    if (relevantRecs.length > 0) {
      prompt += `\n💡 IMPLEMENTATION GUIDELINES for ${moduleSpec.type.toUpperCase()}:\n`;
      relevantRecs.slice(0, 3).forEach(rec => {
        prompt += `  • ${rec.title}\n`;
        prompt += `    ${rec.description}\n`;
      });
    }
  }

  // Scaling insights
  if (context.analysis?.scalingInsights) {
    prompt += `\n📈 SCALING CONSIDERATIONS:\n`;
    prompt += `  Expected Load: ${context.analysis.scalingInsights.expectedLoad}\n`;
    prompt += `  Read/Write Ratio: ${context.analysis.scalingInsights.readWriteRatio}\n`;
    prompt += `  Caching Strategy: ${context.analysis.scalingInsights.cachingStrategy}\n`;
  }

  // LLD component mapping (for specific module types)
  if (context.lld?.nodes && ['services', 'handlers', 'routes'].includes(moduleSpec.type)) {
    prompt += buildLLDContextForModule(context.lld, moduleSpec);
  }

  prompt += '\n' + '='.repeat(80) + '\n';
  return prompt;
}


function buildLLDContextForModule(lld: any, moduleSpec: ModuleSpec): string {
  let prompt = '\n\n🔧 LOW-LEVEL DESIGN COMPONENTS:\n';

  const layerMap: Record<string, string[]> = {
    'services': ['Services/Business Logic Layer', 'Repositories/Data Access Layer'],
    'handlers': ['Controllers Layer'],
    'routes': ['Controllers Layer'],
    'models': ['Models/Entities Layer'],
    'middleware': ['Middleware & Utilities Layer']
  };

  const relevantLayers = layerMap[moduleSpec.type] || [];
  const relevantNodes = lld.nodes.filter((node: any) =>
    relevantLayers.some(layer => node.data?.metadata?.layer === layer)
  );

  if (relevantNodes.length > 0) {
    prompt += `Found ${relevantNodes.length} relevant components:\n`;
    relevantNodes.forEach((node: any) => {
      prompt += `\n  Component: ${node.data.name}\n`;
      prompt += `  Description: ${node.data.description}\n`;
      if (node.data.metadata?.methods?.length > 0) {
        prompt += `  Methods: ${node.data.metadata.methods.join(', ')}\n`;
      }
      if (node.data.metadata?.dependencies?.length > 0) {
        prompt += `  Dependencies: ${node.data.metadata.dependencies.join(', ')}\n`;
      }
    });
  }

  return prompt;
}

// ============================================================================
// FIXED: DATABASE NAME CONSISTENCY
// ============================================================================

function getConsistentDbName(project: Project): string {
  // Use same logic everywhere
  return project.database?.name ||
    project.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}


function validateRouteImplementation(file: GeneratedFile): string[] {
  const issues: string[] = [];

  // Check for empty route paths
  const emptyRoutePattern = /router\.(get|post|put|delete|patch)\s*\(\s*['"]\s*['"]/g;
  if (emptyRoutePattern.test(file.content)) {
    issues.push('❌ Found empty route path - routes must have paths like "/" or "/:id"');
  }

  // Check for missing route paths
  const missingPathPattern = /router\.(get|post|put|delete|patch)\s*\(\s*handle/g;
  if (missingPathPattern.test(file.content)) {
    issues.push('❌ Route missing path parameter - should be router.method(path, handler)');
  }

  // Check function naming
  if (file.path.includes('Handlers.js') || file.path.includes('Services.js')) {
    if (!/Records\b/.test(file.content)) {
      issues.push('⚠️  Handler/Service functions should include "Records" suffix');
    }
  }

  // Check file naming
  if (file.path.match(/\/(handlers|services|models|routes)\//)) {
    const fileName = file.path.split('/').pop() || '';
    if (!fileName.endsWith('s.js') && !fileName.includes('index')) {
      issues.push(`❌ File name should be PLURAL: ${fileName}`);
    }
  }

  return issues;
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
This project follows specific architecture decisions and recommendations.
Review the "PROJECT CONTEXT & ARCHITECTURE DECISIONS" section carefully.

${ctx.project.onboardingContext ?
        'IMPORTANT: This project has predefined architecture and design decisions. ' +
        'Follow the selected tools, patterns, and recommendations provided in the context.'
        : ''}

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

4. ✅ CAMELCASE FILENAMES WITH PLURAL SUFFIXES
   ✓ userHandlers.js (NOT userHandler.js)
   ✓ userServices.js (NOT userService.js)
   ✓ userModels.js (NOT userModel.js)
   ✓ userRoutes.js (correct)

5. ✅ FUNCTION NAMING WITH "Records" SUFFIX
   ✓ handleGetUserRecords (NOT handleGetUser)
   ✓ handleCreateUserRecords (NOT handleCreateUser)
   ✓ getAllUserRecords (NOT getAllUsers)

6. ✅ ROUTE PATHS MUST NOT BE EMPTY
   ✓ router.get('/', handler)
   ✓ router.get('/:id', handler)
   ✗ router.get('', handler) ← WRONG!

7. ✅ USE ONLY SCHEMA FIELDS
   - Only use fields listed in "Schema (USE ONLY THESE FIELDS)"
   - DO NOT add role, status, or any unlisted fields

8. ✅ COMPLETE IMPLEMENTATIONS
   - NO placeholders or TODO comments
   - Full working code for all functions
   - Include error handling with try-catch
   - Use next(error) in handlers

9. ✅ SSL CONFIGURATION
   - For local development: ssl: false
   - For production: ssl: { rejectUnauthorized: false }
   - Use environment check: process.env.NODE_ENV === 'production'

10. ✅ FACTORY PATTERN
    - Models: const createUserModels = () => { ... }
    - Services: const createUserServices = () => { ... }
    - All factories return objects with methods

OTHER:
- Use CommonJS (require/module.exports) - NO ES6 imports
- Functional approach - NO classes
- PostgreSQL with pg library
- Parameterized queries ($1, $2, etc.)`;

    const userPrompt = buildEnhancedContextPrompt(moduleSpec, ctx, attemptNumber);

    console.log(`   📝 Context size: ${userPrompt.length} chars`);
    console.log(`   📚 Available functions: ${ctx.functionRegistry.getStats().totalFunctions}`);

    const result = await generateWithRetry(async () => {
      const response = await generateText({
        model: groq('openai/gpt-oss-120b'),
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

      // NEW: Validate route implementation
      if (file.path.includes('/routes/')) {
        const routeIssues = validateRouteImplementation(file);
        if (routeIssues.length > 0) {
          validationIssues.push(...routeIssues.map(issue => `${file.path}: ${issue}`));
        }
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

function extractLLDComponents(project: Project): Map<string, any> {
  const components = new Map<string, any>();

  if (!project.diagrams?.lld?.nodes) return components;

  project.diagrams.lld.nodes.forEach((node: any) => {
    const layer = node.data?.metadata?.layer || 'unknown';
    const name = node.data?.name || node.id;

    components.set(node.id, {
      id: node.id,
      name,
      description: node.data?.description || '',
      layer,
      methods: node.data?.metadata?.methods || [],
      dependencies: node.data?.metadata?.dependencies || [],
      technology: node.data?.metadata?.technology || ''
    });
  });

  return components;
}

/**
 * Extract API endpoints from API Map diagram
 */
function extractAPIEndpoints(project: Project): Map<string, APIEndpoint[]> {
  const endpointsByGroup = new Map<string, APIEndpoint[]>();

  // 1. Extract from grouped endpoints (existing logic)
  if (project.diagrams?.apiMap?.nodes) {
    project.diagrams.apiMap.nodes.forEach((node: any) => {
      if (node.type === 'api-service' && node.data?.metadata?.endpoints) {
        const endpoints: APIEndpoint[] = node.data.metadata.endpoints.map((ep: any) => ({
          path: ep.path,
          method: ep.method,
          description: ep.description,
          auth: ep.requiresAuth || false,
          group: node.data.name,
          body: ep.requestBody || {}
        }));

        endpointsByGroup.set(node.data.name.toLowerCase(), endpoints);
      }

      // 2. 🔥 NEW: Handle standalone API nodes (like hello-api-service)
      if (node.type === 'api-service' && node.data?.description?.includes('/api/')) {
        const pathMatch = node.data.description.match(/\/api\/[^,\s]*/);
        if (pathMatch) {
          const customEndpoint: APIEndpoint = {
            path: pathMatch[0],
            method: node.data.metadata?.method || 'GET',
            description: node.data.description,
            auth: false,
            group: 'custom',
            body: {}
          };

          const existing = endpointsByGroup.get('custom') || [];
          existing.push(customEndpoint);
          endpointsByGroup.set('custom', existing);
        }
      }
    });
  }


  if (!project.diagrams?.apiMap?.groups) return endpointsByGroup;

  project.diagrams.apiMap.groups.forEach((group: any) => {
    const endpoints: APIEndpoint[] = (group.endpoints || []).map((ep: any) => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      auth: ep.requiresAuth || false,
      group: group.name,
      body: ep.requestBody || {}
    }));

    endpointsByGroup.set(group.name.toLowerCase(), endpoints);
  });

  return endpointsByGroup;
}

/**
 * Extract architecture decisions and selected tools
 */
export function extractArchitectureDecisions(project: Project): Map<string, any> {
  const decisions = new Map<string, any>();

  if (!project.decisions?.decisions) return decisions;

  project.decisions.decisions.forEach((decision: any) => {
    if (decision.selectedTool) {
      const selected = decision.recommendations?.find(
        (r: any) => r.id === decision.selectedTool
      );

      decisions.set(decision.category, {
        tool: decision.selectedTool,
        name: selected?.name || decision.selectedTool,
        description: selected?.description || '',
        reasoning: decision.reasoning || '',
        metadata: selected?.metadata || {}
      });
    }
  });

  return decisions;
}

/**
 * Map LLD components to code modules
 */
function mapComponentsToModules(
  components: Map<string, any>,
  moduleType: string
): any[] {
  const layerMap: Record<string, string[]> = {
    'models': ['Models/Entities Layer', 'Models Layer'],
    'services': ['Services/Business Logic Layer', 'Services Layer'],
    'handlers': ['Controllers Layer'],
    'routes': ['Controllers Layer'],
    'middleware': ['Middleware & Utilities Layer']
  };

  const relevantLayers = layerMap[moduleType] || [];
  const mappedComponents: any[] = [];

  components.forEach((component, id) => {
    // Match by layer
    if (relevantLayers.some(layer => component.layer?.includes(layer))) {
      mappedComponents.push(component);
      return;
    }

    // 🔥 NEW: Match by component name pattern for custom components
    if (moduleType === 'handlers' && component.name?.includes('Controller')) {
      mappedComponents.push(component);
    }

    if (moduleType === 'routes' && component.name?.toLowerCase().includes('route')) {
      mappedComponents.push(component);
    }
  });

  return mappedComponents;
}

function getCustomEndpoints(project: Project): APIEndpoint[] {
  const customEndpoints: APIEndpoint[] = [];

  // Extract from API Map
  if (project.diagrams?.apiMap?.nodes) {
    project.diagrams.apiMap.nodes.forEach((node: any) => {
      if (node.type === 'api-service' &&
        node.data?.description?.includes('/api/') &&
        !node.data?.metadata?.endpoints) {

        const pathMatch = node.data.description.match(/\/api\/v?\d*\/(\w+)/);
        if (pathMatch) {
          customEndpoints.push({
            path: node.data.description.match(/\/api\/[^,\s]*/)?.[0] || '',
            method: 'GET',
            description: node.data.description,
            auth: false,
            group: 'custom',
            body: {}
          });
        }
      }
    });
  }

  // Extract from LLD
  if (project.diagrams?.lld?.nodes) {
    project.diagrams.lld.nodes.forEach((node: any) => {
      if (node.data?.name?.includes('Controller') &&
        !node.data?.metadata?.layer &&
        node.data?.description?.toLowerCase().includes('hello')) {

        customEndpoints.push({
          path: '/api/v1/hello',
          method: 'GET',
          description: node.data.description,
          auth: false,
          group: 'custom',
          body: {}
        });
      }
    });
  }

  return customEndpoints;
}


// ============================================================================
// MAIN GENERATION FUNCTION - REPLACE THIS ENTIRE SECTION
// ============================================================================

export async function generateCode(
  project: Project,
  options: CodeGenOptions,
  onProgress?: ProgressCallback
): Promise<CodeGenerationResult> {
  console.log('\n🚀 Starting DIAGRAM-DRIVEN code generation...');
  console.log('='.repeat(70));
  console.log(`📦 Project: ${project.name}`);

  // Log architecture information
  if (project.diagrams) {
    console.log(`\n📐 Architecture Diagrams Detected:`);
    if (project.diagrams.hld) console.log(`   ✓ High-Level Design (${project.diagrams.hld.nodes?.length || 0} components)`);
    if (project.diagrams.lld) console.log(`   ✓ Low-Level Design (${project.diagrams.lld.nodes?.length || 0} components)`);
    if (project.diagrams.apiMap) {
      const totalEndpoints = project.diagrams.apiMap.groups?.reduce(
        (sum: number, g: any) => sum + (g.endpoints?.length || 0), 0
      ) || 0;
      console.log(`   ✓ API Map (${totalEndpoints} endpoints)`);
    }
    if (project.diagrams.erd) console.log(`   ✓ ERD (${project.diagrams.erd.nodes?.length || 0} tables)`);
  }

  if (project.decisions?.decisions) {
    console.log(`\n🏗️  Architecture Decisions: ${project.decisions.decisions.length}`);
    const decisions = extractArchitectureDecisions(project);
    decisions.forEach((decision, category) => {
      console.log(`   ✓ ${category}: ${decision.name}`);
    });
  }

  console.log('='.repeat(70));

  // Build endpoint map
  const apiEndpoints = new Map<string, APIEndpoint[]>();

  // Prioritize API Map from diagrams
  if (project.diagrams?.apiMap) {
    const diagramEndpoints = extractAPIEndpoints(project);
    diagramEndpoints.forEach((endpoints, group) => {
      apiEndpoints.set(group, endpoints);
      console.log(`   ✓ ${group}: ${endpoints.length} endpoints (from API Map)`);
    });
  } else if (project.endpoints && Array.isArray(project.endpoints)) {
    // Fallback to project.endpoints
    project.schema.forEach(table => {
      const endpoints = getEndpointsForTable(project, table.name);
      if (endpoints.length > 0) {
        apiEndpoints.set(table.name, endpoints);
        console.log(`   ✓ ${table.name}: ${endpoints.length} endpoints`);
      }
    });
  }

  // Initialize enhanced context
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
    failedAttempts: new Map(),
    apiEndpoints
  };

  try {
    // Get base dependencies
    const baseDeps = getBaseDependencies(options.framework);
    Object.assign(ctx.allDependencies, baseDeps.dependencies);
    Object.assign(ctx.allDevDependencies, baseDeps.devDependencies);

    // Add dependencies based on architecture
    console.log('\n📦 Adding dependencies based on architecture decisions...');
    addConditionalDependencies(project, options, ctx.allDependencies, ctx.allDevDependencies);

    // Get module specs
    const moduleSpecs = getModuleSpecs(project, options);
    console.log(`\n📋 Generating ${moduleSpecs.length} modules with diagram guidance...\n`);

    // Generate modules
    for (let i = 0; i < moduleSpecs.length; i++) {
      const spec = moduleSpecs[i];

      if (onProgress) {
        onProgress(spec.type, i + 1, moduleSpecs.length);
      }

      console.log(`\n[${i + 1}/${moduleSpecs.length}] 🔨 Module: ${spec.type}`);

      // Show relevant diagram info
      if (project.diagrams?.lld) {
        const components = extractLLDComponents(project);
        const relevant = mapComponentsToModules(components, spec.type);
        if (relevant.length > 0) {
          console.log(`   📐 LLD Components: ${relevant.length}`);
        }
      }

      if ((spec.type === 'routes' || spec.type === 'handlers') && spec.tables) {
        const totalEndpoints = spec.tables.reduce((sum, table) => {
          return sum + (apiEndpoints.get(table.toLowerCase())?.length || apiEndpoints.get(table)?.length || 0);
        }, 0);
        if (totalEndpoints > 0) {
          console.log(`   🌐 API Endpoints: ${totalEndpoints}`);
        }
      }



      const result = await generateModuleWithValidation(spec, ctx);
      ctx.moduleResults.set(spec.type, result);

      if (result.success) {
        result.files.forEach(file => {
          ctx.generatedFiles.set(file.path, file);
        });

        Object.assign(ctx.allDependencies, result.dependencies);
        Object.assign(ctx.allDevDependencies, result.devDependencies);

        console.log(`   ✅ Success: ${result.files.length} files generated`);
      }

      if (i < moduleSpecs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate remaining files
    console.log('\n📦 Generating package.json...');
    const packageJson = generatePackageJson(project, options, ctx.allDependencies, ctx.allDevDependencies);
    ctx.generatedFiles.set(packageJson.path, packageJson);

    console.log('📝 Generating entry point (src/index.js)...');
    const entryPoint = generateEntryPoint(project, options, ctx);
    ctx.generatedFiles.set(entryPoint.path, entryPoint);
    ctx.functionRegistry.register(entryPoint.path, entryPoint.content);

    console.log('🗄️  Generating migration utility...');
    const migrationUtil = generateMigrationUtility(project);
    ctx.generatedFiles.set(migrationUtil.path, migrationUtil);
    ctx.functionRegistry.register(migrationUtil.path, migrationUtil.content);

    console.log('📝 Generating setup instructions...');
    const instructions = generateEnhancedInstructions(project, options, ctx);

    // Final stats
    const successfulModules = Array.from(ctx.moduleResults.values()).filter(m => m.success && m.validated);
    const totalModules = ctx.moduleResults.size;
    const successRate = (successfulModules.length / totalModules) * 100;

    console.log('\n' + '='.repeat(70));
    console.log('✅ DIAGRAM-DRIVEN CODE GENERATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`📦 Total Files: ${ctx.generatedFiles.size}`);
    console.log(`🏗️  Architecture Components Used: ${extractLLDComponents(project).size}`);
    console.log(`🌐 API Endpoints Integrated: ${Array.from(apiEndpoints.values()).flat().length}`);
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

function getModuleSpecs(project, options) {
  const tableNames = project.schema.map(t => t.name);

  const allComponents = extractAllComponents(project);

  const tableComponents = allComponents.filter(c => c.type === 'table');
  const customComponents = allComponents.filter(c => c.type === 'custom');

  console.log('\n🔍 VALIDATING COMPONENT NAMES:\n');
  allComponents.forEach(comp => {
    const isValid = isValidJavaScriptIdentifier(comp.name);
    console.log(`   ${isValid ? '✅' : '❌'} "${comp.name}" - Valid: ${isValid}`);

    if (!isValid) {
      console.log(`      Original might have been: "${comp.name}"`);
      console.log(`      Contains invalid chars: ${comp.name.match(/[^a-zA-Z0-9_$]/g)?.join(', ') || 'none'}`);
    }
  });

  // Detect custom endpoints
  const customEndpoints = getCustomEndpoints(project);
  const hasCustomEndpoints = customEndpoints.length > 0;

  const specs = [
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
        'src/utils/errors.js',
        'src/utils/responses.js',
        'src/utils/validations.js',
        'src/utils/loggers.js'
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
        'src/database/connections.js',
        'src/database/migrate.js',
        'src/database/migrations/001_initial_schema.sql',
        'src/database/seeds.js'
      ],
      criticalFiles: ['src/database/index.js', 'src/database/connections.js', 'src/database/migrate.js']
    },

    {
      type: 'middleware',
      priority: 6,
      dependencies: ['utils'],
      description: 'Express middleware',
      requiredFiles: [
        'src/middleware/index.js',
        'src/middleware/errorHandlers.js',
        'src/middleware/validations.js',
        'src/middleware/loggers.js'
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
        'src/auth/middlewares.js',
        'src/auth/handlers.js',
        'src/auth/services.js',
        'src/auth/routes.js',
        'src/auth/utils.js'
      ],
      criticalFiles: ['src/auth/index.js', 'src/auth/handlers.js']
    });
  }

  // TABLE-BASED COMPONENTS
  specs.push({
    type: 'models',
    priority: 5,
    dependencies: ['database', 'utils'],
    tables: tableComponents.map(c => c.name),
    description: 'Database models for all tables',
    requiredFiles: [
      'src/models/index.js',
      ...tableComponents.map(c => `src/models/${toCamelCase(c.name)}Models.js`) // PLURAL
    ],
    minFiles: tableComponents.length + 1,
    criticalFiles: ['src/models/index.js']
  });

  specs.push({
    type: 'services',
    priority: 8,
    dependencies: ['models', 'utils'],
    tables: tableComponents.map(c => c.name),
    description: 'Business logic services for tables',
    requiredFiles: [
      'src/services/index.js',
      ...tableComponents.map(c => `src/services/${toCamelCase(c.name)}Services.js`) // PLURAL
    ],
    minFiles: tableComponents.length + 1,
    criticalFiles: ['src/services/index.js']
  });

  specs.push({
    type: 'handlers',
    priority: 9,
    dependencies: ['services', 'utils'],
    tables: tableComponents.map(c => c.name),
    components: tableComponents,
    description: 'Request handlers for tables',
    requiredFiles: [
      'src/handlers/index.js',
      ...tableComponents.map(c => `src/handlers/${toCamelCase(c.name)}Handlers.js`) // PLURAL
    ],
    minFiles: tableComponents.length + 1,
    criticalFiles: ['src/handlers/index.js']
  });

  specs.push({
    type: 'routes',
    priority: 10,
    dependencies: ['handlers', 'middleware'],
    tables: tableComponents.map(c => c.name),
    components: tableComponents,
    description: 'API routes for tables',
    requiredFiles: [
      'src/routes/index.js',
      ...tableComponents.map(c => `src/routes/${toCamelCase(c.name)}Routes.js`) // PLURAL
    ],
    minFiles: tableComponents.length + 1,
    criticalFiles: ['src/routes/index.js']
  });

  // ============================================================================
  // CUSTOM COMPONENTS - FIXED WITH PROPER NAMING
  // ============================================================================
  if (customComponents.length > 0) {
    console.log(`\n🎯 Creating specs for ${customComponents.length} custom components with strict naming...`);

    // Services for custom components
    specs.push({
      type: 'custom-services',
      priority: 8.5,
      dependencies: ['utils', 'database'],
      components: customComponents,
      description: 'Business logic for custom components',
      requiredFiles: [
        ...customComponents.map(c => `src/services/${toCamelCase(c.name)}Services.js`) // PLURAL!
      ],
      minFiles: customComponents.length,
      criticalFiles: []
    });

    // Handlers for custom components
    specs.push({
      type: 'custom-handlers',
      priority: 9.5,
      dependencies: ['utils'],
      components: customComponents,
      description: 'Request handlers for custom components',
      requiredFiles: [
        ...customComponents.map(c => `src/handlers/${toCamelCase(c.name)}Handlers.js`) // PLURAL!
      ],
      minFiles: customComponents.length,
      criticalFiles: []
    });

    // Routes for custom components
    specs.push({
      type: 'custom-routes',
      priority: 10.5,
      dependencies: ['middleware'],
      components: customComponents,
      description: 'API routes for custom components',
      requiredFiles: [
        ...customComponents.map(c => `src/routes/${toCamelCase(c.name)}Routes.js`) // PLURAL!
      ],
      minFiles: customComponents.length,
      criticalFiles: []
    });
  }

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
      'terraform/terraform.tfvars',
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
// ============================================================================
// UPDATED ENTRY POINT - Register ALL Components
// ============================================================================

// function generateEntryPoint(
//   project: Project,
//   options: CodeGenOptions,
//   ctx: EnhancedGenerationContext
// ): GeneratedFile {
//   const allComponents = extractAllComponents(project);
//   const tableComponents = allComponents.filter(c => c.type === 'table');
//   const customComponents = allComponents.filter(c => c.type === 'custom');

//   // 🔥 VALIDATE ALL COMPONENT NAMES BEFORE USING
//   [...tableComponents, ...customComponents].forEach(comp => {
//     if (!isValidJavaScriptIdentifier(comp.name)) {
//       throw new Error(
//         `Invalid component name: "${comp.name}". ` +
//         `Component names must be valid JavaScript identifiers. ` +
//         `Please check your diagram node names.`
//       );
//     }
//   });

//   const content = `const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const dotenv = require('dotenv');

// // Import middleware
// const { errorHandler, notFoundHandler, requestLogger } = require('./middleware');
// const { createLogger } = require('./utils/logger');

// const logger = createLogger();

// // ============================================================================
// // TABLE-BASED ROUTES
// // ============================================================================
// ${tableComponents.map(comp => {
//     // 🔥 DOUBLE CHECK: comp.name is valid
//     const routerVarName = `${comp.name}Router`; // e.g., "userRouter"
//     const routeFile = `${comp.name}Routes`; // e.g., "userRoutes"

//     if (!isValidJavaScriptIdentifier(routerVarName)) {
//       throw new Error(`Invalid router variable name: ${routerVarName}`);
//     }

//     return `const { router: ${routerVarName} } = require('./routes/${routeFile}');`;
//   }).join('\n')}

// // ============================================================================
// // CUSTOM COMPONENT ROUTES (from LLD/API Map diagrams)
// // ============================================================================
// ${customComponents.map(comp => {
//     // 🔥 DOUBLE CHECK: comp.name is valid
//     const routerVarName = `${comp.name}Router`; // e.g., "helloApiRouter"
//     const routeFile = `${comp.name}Routes`; // e.g., "helloApiRoutes"

//     if (!isValidJavaScriptIdentifier(routerVarName)) {
//       throw new Error(`Invalid router variable name: ${routerVarName}`);
//     }

//     return `const { router: ${routerVarName} } = require('./routes/${routeFile}');`;
//   }).join('\n')}

// ${options.includeAuth ? "const { router: authRouter } = require('./auth/routes');" : ''}

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Security middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.CORS_ORIGIN?.split(',') || '*',
//   credentials: true
// }));
// app.use(compression());

// // Body parsing middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Request logging middleware
// app.use(requestLogger);

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'ok', 
//     timestamp: new Date().toISOString(),
//     service: '${project.name}',
//     environment: process.env.NODE_ENV || 'development',
//     components: {
//       tables: ${tableComponents.length},
//       custom: ${customComponents.length},
//       total: ${allComponents.length}
//     }
//   });
// });

// // ============================================================================
// // REGISTER TABLE-BASED ROUTES
// // ============================================================================
// ${tableComponents.map(comp => {
//     const basePath = comp.endpoints[0]?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
//     const routerVarName = `${comp.name}Router`;
//     return `app.use('${basePath}', ${routerVarName}); // ${comp.name}`;
//   }).join('\n')}

// // ============================================================================
// // REGISTER CUSTOM COMPONENT ROUTES
// // ============================================================================
// ${customComponents.map(comp => {
//     const firstEndpoint = comp.endpoints[0];
//     const basePath = firstEndpoint?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
//     const routerVarName = `${comp.name}Router`;
//     return `app.use('${basePath}', ${routerVarName}); // ${comp.name} (custom)`;
//   }).join('\n')}

// ${options.includeAuth ? "app.use('/api/auth', authRouter);" : ''}

// // 404 handler
// app.use(notFoundHandler);

// // Error handling middleware (must be last)
// app.use(errorHandler);

// // Start server
// if (require.main === module) {
//   app.listen(PORT, () => {
//     logger.info('Server starting', {
//       service: process.env.npm_package_name || '${project.name}',
//       port: PORT,
//       environment: process.env.NODE_ENV || 'development',
//       components: {
//         tables: ${tableComponents.length},
//         custom: ${customComponents.length}
//       }
//     });

//     console.log('='.repeat(60));
//     console.log(\`🚀 \${process.env.npm_package_name || '${project.name}'} Server\`);
//     console.log('='.repeat(60));
//     console.log(\`📡 Port: \${PORT}\`);
//     console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
//     console.log(\`\`);
//     console.log(\`📊 Registered Routes:\`);
// ${tableComponents.map(comp => {
//     const basePath = comp.endpoints[0]?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
//     return `    console.log(\`   • ${basePath} (${comp.name})\`);`;
//   }).join('\n')}
// ${customComponents.map(comp => {
//     const firstEndpoint = comp.endpoints[0];
//     const basePath = firstEndpoint?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
//     return `    console.log(\`   • ${basePath} (${comp.name} - custom)\`);`;
//   }).join('\n')}
//     console.log('='.repeat(60));
//     console.log(\`\\n✅ Server ready at http://localhost:\${PORT}\`);
//     console.log(\`📊 Health check: http://localhost:\${PORT}/health\\n\`);
//   });
// }

// module.exports = { app };`;

//   return {
//     path: 'src/index.js',
//     content,
//     description: 'Main application entry point with validated component names',
//     exports: ['app']
//   };
// }

function generateEntryPoint(
  project: Project,
  options: CodeGenOptions,
  ctx: EnhancedGenerationContext
): GeneratedFile {
  const allComponents = extractAllComponents(project);
  const tableComponents = allComponents.filter(c => c.type === 'table');
  const customComponents = allComponents.filter(c => c.type === 'custom');

  // 🔥 VALIDATE ALL COMPONENT NAMES BEFORE USING
  [...tableComponents, ...customComponents].forEach(comp => {
    if (!isValidJavaScriptIdentifier(comp.name)) {
      throw new Error(
        `Invalid component name: "${comp.name}". ` +
        `Component names must be valid JavaScript identifiers. ` +
        `Please check your diagram node names.`
      );
    }
  });

  // 🔥 NEW: Get actual route files from function registry
  const getActualRouteFiles = (components: DiagramComponent[]) => {
    const routeFiles: Array<{ comp: DiagramComponent; actualPath: string; routerVar: string }> = [];

    components.forEach(comp => {
      // Try to find the actual generated route file
      const possiblePaths = [
        `src/routes/${toCamelCase(comp.name)}Routes.js`,
        `src/routes/${comp.name}Routes.js`,
        `src/routes/${comp.name.toLowerCase()}Routes.js`,
      ];

      let foundPath: string | null = null;
      for (const path of possiblePaths) {
        const fileCtx = ctx.functionRegistry.get(path);
        if (fileCtx && fileCtx.exports.includes('router')) {
          foundPath = path;
          break;
        }
      }

      if (foundPath) {
        const routerVarName = `${comp.name}Router`;
        if (isValidJavaScriptIdentifier(routerVarName)) {
          routeFiles.push({
            comp,
            actualPath: foundPath,
            routerVar: routerVarName
          });
        } else {
          console.warn(`⚠️  Skipping invalid router variable: ${routerVarName}`);
        }
      } else {
        console.warn(`⚠️  Route file not found for component: ${comp.name}`);
        console.warn(`   Tried paths: ${possiblePaths.join(', ')}`);
      }
    });

    return routeFiles;
  };

  const tableRoutes = getActualRouteFiles(tableComponents);
  const customRoutes = getActualRouteFiles(customComponents);

  console.log(`\n📋 Entry Point Route Registration:`);
  console.log(`   Table routes: ${tableRoutes.length}/${tableComponents.length}`);
  console.log(`   Custom routes: ${customRoutes.length}/${customComponents.length}`);

  const content = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Import middleware
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware');
const { createLogger } = require('./utils/logger');

const logger = createLogger();

// ============================================================================
// TABLE-BASED ROUTES
// ============================================================================
${tableRoutes.map(({ actualPath, routerVar }) => {
    const relativePath = actualPath.replace(/^src\//, './').replace(/\.js$/, '');
    return `const { router: ${routerVar} } = require('${relativePath}');`;
  }).join('\n')}

// ============================================================================
// CUSTOM COMPONENT ROUTES (from LLD/API Map diagrams)
// ============================================================================
${customRoutes.map(({ actualPath, routerVar }) => {
    const relativePath = actualPath.replace(/^src\//, './').replace(/\.js$/, '');
    return `const { router: ${routerVar} } = require('${relativePath}');`;
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
    components: {
      tables: ${tableRoutes.length},
      custom: ${customRoutes.length},
      total: ${tableRoutes.length + customRoutes.length}
    }
  });
});

// ============================================================================
// REGISTER TABLE-BASED ROUTES
// ============================================================================
${tableRoutes.map(({ comp, routerVar }) => {
    const basePath = comp.endpoints[0]?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
    return `app.use('${basePath}', ${routerVar}); // ${comp.name}`;
  }).join('\n')}

// ============================================================================
// REGISTER CUSTOM COMPONENT ROUTES
// ============================================================================
${customRoutes.map(({ comp, routerVar }) => {
    const firstEndpoint = comp.endpoints[0];
    const basePath = firstEndpoint?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
    return `app.use('${basePath}', ${routerVar}); // ${comp.name} (custom)`;
  }).join('\n')}

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
      components: {
        tables: ${tableRoutes.length},
        custom: ${customRoutes.length}
      }
    });
    
    console.log('='.repeat(60));
    console.log(\`🚀 \${process.env.npm_package_name || '${project.name}'} Server\`);
    console.log('='.repeat(60));
    console.log(\`📡 Port: \${PORT}\`);
    console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`\`);
    console.log(\`📊 Registered Routes:\`);
${tableRoutes.map(({ comp }) => {
    const basePath = comp.endpoints[0]?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
    return `    console.log(\`   • ${basePath} (${comp.name})\`);`;
  }).join('\n')}
${customRoutes.map(({ comp }) => {
    const firstEndpoint = comp.endpoints[0];
    const basePath = firstEndpoint?.path.match(/\/api\/v?\d*\/[\w-]+/)?.[0] || `/api/v1/${comp.name}`;
    return `    console.log(\`   • ${basePath} (${comp.name} - custom)\`);`;
  }).join('\n')}
    console.log('='.repeat(60));
    console.log(\`\\n✅ Server ready at http://localhost:\${PORT}\`);
    console.log(\`📊 Health check: http://localhost:\${PORT}/health\\n\`);
  });
}

module.exports = { app };`;

  return {
    path: 'src/index.js',
    content,
    description: 'Main application entry point with function registry validation',
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