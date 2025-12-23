// ============================================================================
// DIAGRAM-DRIVEN CODE GENERATION PIPELINE
// Priority: LLD Diagrams > Schema Tables
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

// ============================================================================
// DIAGRAM PARSER - Extract structure from LLD
// ============================================================================

interface DiagramNode {
  id: string;
  type: string;
  data: {
    name: string;
    description: string;
    metadata: {
      layer: string;
      layerIndex: number;
      methods?: string[];
      dependencies?: string[];
      technology?: string;
    };
  };
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    protocol?: string;
    dataFlow?: string;
  };
}

interface DiagramStructure {
  layers: Map<string, DiagramNode[]>;
  dependencies: Map<string, string[]>;
  moduleMapping: Map<string, {
    type: 'controller' | 'service' | 'repository' | 'model' | 'middleware' | 'utility';
    layer: string;
    methods: string[];
    dependencies: string[];
    relatedTable?: string;
  }>;
}

class DiagramParser {
  private structure: DiagramStructure = {
    layers: new Map(),
    dependencies: new Map(),
    moduleMapping: new Map()
  };

  constructor(private lld: any) {
    this.parse();
  }

  private parse() {
    if (!this.lld?.nodes) {
      console.warn('⚠️  No LLD diagram found, falling back to schema-based generation');
      return;
    }

    console.log(`\n🎨 Parsing LLD diagram with ${this.lld.nodes.length} nodes...`);

    // Step 1: Group nodes by layer
    this.lld.nodes.forEach((node: DiagramNode) => {
      const layer = node.data?.metadata?.layer || 'Unknown';
      const nodes = this.structure.layers.get(layer) || [];
      nodes.push(node);
      this.structure.layers.set(layer, nodes);
    });

    // Step 2: Extract dependencies from edges
    if (this.lld.edges) {
      this.lld.edges.forEach((edge: DiagramEdge) => {
        const deps = this.structure.dependencies.get(edge.source) || [];
        if (!deps.includes(edge.target)) {
          deps.push(edge.target);
        }
        this.structure.dependencies.set(edge.source, deps);
      });
    }

    // Step 3: Map diagram modules to code structure
    this.lld.nodes.forEach((node: DiagramNode) => {
      const moduleName = node.data?.name;
      if (!moduleName) {
        console.warn(`⚠️  Skipping node without name: ${node.id}`);
        return;
      }

      const layer = node.data?.metadata?.layer || '';
      
      let type: 'controller' | 'service' | 'repository' | 'model' | 'middleware' | 'utility';
      let relatedTable: string | undefined;

      // Determine module type from layer and name
      if (layer.includes('Controllers') || layer.includes('Controller')) {
        type = 'controller';
        relatedTable = this.extractTableName(moduleName);
      } else if (layer.includes('Services') || layer.includes('Business Logic')) {
        type = 'service';
        relatedTable = this.extractTableName(moduleName);
      } else if (layer.includes('Repositories') || layer.includes('Data Access')) {
        type = 'repository';
        relatedTable = this.extractTableName(moduleName);
      } else if (layer.includes('Models') || layer.includes('Entities')) {
        type = 'model';
        relatedTable = this.extractTableName(moduleName);
      } else if (layer.includes('Middleware')) {
        type = 'middleware';
      } else {
        // Fallback: Try to infer from module name
        const nameLower = moduleName.toLowerCase();
        if (nameLower.includes('controller')) {
          type = 'controller';
          relatedTable = this.extractTableName(moduleName);
        } else if (nameLower.includes('service')) {
          type = 'service';
          relatedTable = this.extractTableName(moduleName);
        } else if (nameLower.includes('repository')) {
          type = 'repository';
          relatedTable = this.extractTableName(moduleName);
        } else if (nameLower.includes('model')) {
          type = 'model';
          relatedTable = this.extractTableName(moduleName);
        } else if (nameLower.includes('middleware')) {
          type = 'middleware';
        } else {
          type = 'utility';
        }
      }

      const methods = node.data?.metadata?.methods || [];
      const dependencies = node.data?.metadata?.dependencies || [];

      this.structure.moduleMapping.set(node.id, {
        type,
        layer: layer || 'Inferred',
        methods,
        dependencies,
        relatedTable
      });

      const layerInfo = layer ? layer : 'inferred from name';
      console.log(`   ✓ Mapped: ${moduleName} → ${type}${relatedTable ? ` (${relatedTable})` : ''} [${layerInfo}]`);
    });

    console.log(`✅ Diagram parsed: ${this.structure.moduleMapping.size} modules mapped`);
  }

  private extractTableName(moduleName: string): string | undefined {
    // Extract table name from module names like "UserController", "TaskService", etc.
    const patterns = [
      /^(.+)Controller$/i,
      /^(.+)Service$/i,
      /^(.+)Repository$/i,
      /^(.+)Model$/i,
      /^create(.+)Models$/i,
      /^create(.+)Services$/i
    ];

    for (const pattern of patterns) {
      const match = moduleName.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return undefined;
  }

  getStructure(): DiagramStructure {
    return this.structure;
  }

  getModulesByType(type: string): Array<{
    id: string;
    name: string;
    methods: string[];
    dependencies: string[];
    relatedTable?: string;
  }> {
    const modules: Array<any> = [];

    this.structure.moduleMapping.forEach((module, nodeId) => {
      if (module.type === type) {
        const node = this.lld.nodes.find((n: DiagramNode) => n.id === nodeId);
        if (node) {
          modules.push({
            id: nodeId,
            name: node.data.name,
            methods: module.methods,
            dependencies: module.dependencies,
            relatedTable: module.relatedTable
          });
        }
      }
    });

    return modules;
  }

  getLayerOrder(): string[] {
    // Return layers in dependency order (bottom-up)
    const layers = Array.from(this.structure.layers.keys());
    
    // Standard layer order
    const standardOrder = [
      'Models/Entities Layer',
      'Repositories/Data Access Layer',
      'Services/Business Logic Layer',
      'Controllers Layer',
      'Middleware & Utilities Layer',
      'External Integrations Layer',
      'Infrastructure Layer'
    ];

    return layers.sort((a, b) => {
      const indexA = standardOrder.findIndex(l => a.includes(l) || l.includes(a));
      const indexB = standardOrder.findIndex(l => b.includes(l) || l.includes(b));
      return indexA - indexB;
    });
  }
}

// ============================================================================
// DIAGRAM-DRIVEN MODULE SPEC GENERATOR
// ============================================================================

function getModuleSpecsFromDiagram(project: Project, options: CodeGenOptions): ModuleSpec[] {
  const parser = new DiagramParser(project.diagrams?.lld);
  const structure = parser.getStructure();
  const specs: ModuleSpec[] = [];

  console.log('\n🎯 Generating module specs from diagram...');

  // Priority 1: Infrastructure (unchanged)
  specs.push({
    type: 'terraform',
    priority: 1,
    dependencies: [],
    description: 'Terraform infrastructure for AWS ECS deployment',
    requiredFiles: [
      'terraform/main.tf',
      'terraform/variables.tf',
      'terraform/outputs.tf',
      'deploy.sh'
    ],
    criticalFiles: ['terraform/main.tf']
  });

  // Priority 2: Config (unchanged)
  specs.push({
    type: 'config',
    priority: 2,
    dependencies: [],
    description: 'Project configuration files',
    requiredFiles: ['package.json', '.env.example', '.gitignore'],
    criticalFiles: ['package.json']
  });

  // Priority 3: Docker (unchanged)
  specs.push({
    type: 'docker',
    priority: 3,
    dependencies: [],
    description: 'Docker configuration',
    requiredFiles: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  });

  // Priority 4: Database (unchanged)
  specs.push({
    type: 'database',
    priority: 4,
    dependencies: [],
    description: 'Database connection and migrations',
    requiredFiles: [
      'src/database/index.js',
      'src/database/connections.js',
      'src/database/migrate.js',
      'src/database/migrations/001_initial_schema.sql',
      'src/database/seeds.js',
    ],
    criticalFiles: ['src/database/connections.js']
  });

  // Priority 5: Utilities FROM DIAGRAM
  const utilityModules = parser.getModulesByType('utility');
  if (utilityModules.length > 0) {
    const utilityFiles = utilityModules.map(m => 
      `src/utils/${toCamelCase(m.name)}.js`
    );
    utilityFiles.unshift('src/utils/index.js');

    specs.push({
      type: 'utils',
      priority: 5,
      dependencies: [],
      description: 'Utility functions from LLD',
      modules: utilityModules.map(m => m.name),
      diagramData: new Map(utilityModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies
      }])),
      requiredFiles: utilityFiles,
      criticalFiles: ['src/utils/index.js']
    });
  } else {
    // Fallback to standard utils
    specs.push({
      type: 'utils',
      priority: 5,
      dependencies: [],
      description: 'Standard utility functions',
      requiredFiles: [
        'src/utils/index.js',
        'src/utils/logger.js',
        'src/utils/errors.js',
        'src/utils/responses.js',
        'src/utils/validations.js'
      ],
      criticalFiles: ['src/utils/index.js']
    });
  }

  // Priority 6: Middleware FROM DIAGRAM
  const middlewareModules = parser.getModulesByType('middleware');
  if (middlewareModules.length > 0) {
    const middlewareFiles = middlewareModules.map(m => 
      `src/middleware/${toCamelCase(m.name)}.js`
    );
    middlewareFiles.unshift('src/middleware/index.js');

    specs.push({
      type: 'middleware',
      priority: 6,
      dependencies: ['utils'],
      description: 'Express middleware from LLD',
      modules: middlewareModules.map(m => m.name),
      diagramData: new Map(middlewareModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies
      }])),
      requiredFiles: middlewareFiles,
      criticalFiles: ['src/middleware/index.js']
    });
  } else {
    // Fallback to standard middleware
    specs.push({
      type: 'middleware',
      priority: 6,
      dependencies: ['utils'],
      description: 'Standard Express middleware',
      requiredFiles: [
        'src/middleware/index.js',
        'src/middleware/errorHandler.js',
        'src/middleware/requestLogger.js',
        'src/middleware/validator.js'
      ],
      criticalFiles: ['src/middleware/index.js']
    });
  }

  // Priority 7: Models FROM DIAGRAM
  const modelModules = parser.getModulesByType('model');
  if (modelModules.length > 0) {
    const modelFiles = modelModules.map(m => 
      `src/models/${toCamelCase(m.relatedTable || m.name)}Models.js`
    );
    modelFiles.unshift('src/models/index.js');

    const tables = modelModules
      .map(m => m.relatedTable)
      .filter((t): t is string => t !== undefined);

    specs.push({
      type: 'models',
      priority: 7,
      dependencies: ['database', 'utils'],
      tables: tables.length > 0 ? tables : undefined,
      description: 'Database models from LLD',
      modules: modelModules.map(m => m.name),
      diagramData: new Map(modelModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies,
        relatedTable: m.relatedTable
      }])),
      requiredFiles: modelFiles,
      criticalFiles: ['src/models/index.js']
    });
  } else {
    // Fallback to schema-based models
    const tableNames = project.schema.map(t => t.name);
    specs.push({
      type: 'models',
      priority: 7,
      dependencies: ['database', 'utils'],
      tables: tableNames,
      description: 'Database models from schema',
      requiredFiles: [
        'src/models/index.js',
        ...tableNames.map(t => `src/models/${toCamelCase(t)}Models.js`)
      ],
      criticalFiles: ['src/models/index.js']
    });
  }

  // Priority 8: Services FROM DIAGRAM (Repositories mapped to Services)
  const serviceModules = [
    ...parser.getModulesByType('service'),
    ...parser.getModulesByType('repository')
  ];
  
  if (serviceModules.length > 0) {
    const serviceFiles = serviceModules.map(m => 
      `src/services/${toCamelCase(m.relatedTable || m.name)}Services.js`
    );
    serviceFiles.unshift('src/services/index.js');

    const tables = serviceModules
      .map(m => m.relatedTable)
      .filter((t): t is string => t !== undefined);

    specs.push({
      type: 'services',
      priority: 8,
      dependencies: ['models', 'utils'],
      tables: tables.length > 0 ? tables : undefined,
      description: 'Business logic services from LLD',
      modules: serviceModules.map(m => m.name),
      diagramData: new Map(serviceModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies,
        relatedTable: m.relatedTable
      }])),
      requiredFiles: serviceFiles,
      criticalFiles: ['src/services/index.js']
    });
  } else {
    // Fallback to schema-based services
    const tableNames = project.schema.map(t => t.name);
    specs.push({
      type: 'services',
      priority: 8,
      dependencies: ['models', 'utils'],
      tables: tableNames,
      description: 'Business logic services from schema',
      requiredFiles: [
        'src/services/index.js',
        ...tableNames.map(t => `src/services/${toCamelCase(t)}Services.js`)
      ],
      criticalFiles: ['src/services/index.js']
    });
  }

  // Priority 9: Handlers FROM DIAGRAM (Controllers mapped to Handlers)
  const controllerModules = parser.getModulesByType('controller');
  
  if (controllerModules.length > 0) {
    const handlerFiles = controllerModules.map(m => 
      `src/handlers/${toCamelCase(m.relatedTable || m.name)}Handlers.js`
    );
    handlerFiles.unshift('src/handlers/index.js');

    const tables = controllerModules
      .map(m => m.relatedTable)
      .filter((t): t is string => t !== undefined);

    specs.push({
      type: 'handlers',
      priority: 9,
      dependencies: ['services', 'utils'],
      tables: tables.length > 0 ? tables : undefined,
      description: 'Request handlers from LLD',
      modules: controllerModules.map(m => m.name),
      diagramData: new Map(controllerModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies,
        relatedTable: m.relatedTable
      }])),
      requiredFiles: handlerFiles,
      criticalFiles: ['src/handlers/index.js']
    });
  } else {
    // Fallback to schema-based handlers
    const tableNames = project.schema.map(t => t.name);
    specs.push({
      type: 'handlers',
      priority: 9,
      dependencies: ['services', 'utils'],
      tables: tableNames,
      description: 'Request handlers from schema',
      requiredFiles: [
        'src/handlers/index.js',
        ...tableNames.map(t => `src/handlers/${toCamelCase(t)}Handlers.js`)
      ],
      criticalFiles: ['src/handlers/index.js']
    });
  }

  // Priority 10: Routes FROM DIAGRAM
  const routeModules = controllerModules; // Routes follow controllers
  
  if (routeModules.length > 0) {
    const routeFiles = routeModules.map(m => 
      `src/routes/${toCamelCase(m.relatedTable || m.name)}Routes.js`
    );
    routeFiles.unshift('src/routes/index.js');

    const tables = routeModules
      .map(m => m.relatedTable)
      .filter((t): t is string => t !== undefined);

    specs.push({
      type: 'routes',
      priority: 10,
      dependencies: ['handlers', 'middleware'],
      tables: tables.length > 0 ? tables : undefined,
      description: 'API routes from LLD',
      modules: routeModules.map(m => m.name),
      diagramData: new Map(routeModules.map(m => [m.name, {
        methods: m.methods,
        dependencies: m.dependencies,
        relatedTable: m.relatedTable
      }])),
      requiredFiles: routeFiles,
      criticalFiles: ['src/routes/index.js']
    });
  } else {
    // Fallback to schema-based routes
    const tableNames = project.schema.map(t => t.name);
    specs.push({
      type: 'routes',
      priority: 10,
      dependencies: ['handlers', 'middleware'],
      tables: tableNames,
      description: 'API routes from schema',
      requiredFiles: [
        'src/routes/index.js',
        ...tableNames.map(t => `src/routes/${toCamelCase(t)}Routes.js`)
      ],
      criticalFiles: ['src/routes/index.js']
    });
  }

  // Priority 11: Main entry point
  specs.push({
    type: 'main',
    priority: 11,
    dependencies: ['routes', 'middleware', 'database'],
    description: 'Main application entry point',
    requiredFiles: ['src/index.js'],
    criticalFiles: ['src/index.js']
  });

  console.log(`✅ Generated ${specs.length} module specs from diagram`);
  
  // Log summary
  const diagramBased = specs.filter(s => s.diagramData).length;
  const schemaBased = specs.length - diagramBased;
  console.log(`   📊 Diagram-based: ${diagramBased}, Schema-based: ${schemaBased}`);

  return specs.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// ENHANCED PROMPT BUILDER WITH DIAGRAM CONTEXT
// ============================================================================

function buildDiagramContextPrompt(
  moduleSpec: ModuleSpec,
  state: any,
  attemptNumber: number
): string {
  let contextPrompt = '';

  // Add diagram-specific instructions if available
  if (moduleSpec.diagramData && moduleSpec.diagramData.size > 0) {
    contextPrompt += '\n\n🎨 DIAGRAM-DRIVEN GENERATION:\n';
    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '⚠️  CRITICAL: This module MUST follow the Low-Level Design (LLD) diagram!\n\n';

    moduleSpec.diagramData.forEach((data, moduleName) => {
      contextPrompt += `\n📦 Module: ${moduleName}\n`;
      contextPrompt += `   Type: ${moduleSpec.type}\n`;
      
      if (data.relatedTable) {
        contextPrompt += `   Related Table: ${data.relatedTable}\n`;
      }
      
      if (data.methods && data.methods.length > 0) {
        contextPrompt += `   Required Methods:\n`;
        data.methods.forEach((method: string) => {
          contextPrompt += `      • ${method}\n`;
        });
      }
      
      if (data.dependencies && data.dependencies.length > 0) {
        contextPrompt += `   Dependencies:\n`;
        data.dependencies.forEach((dep: string) => {
          contextPrompt += `      • ${dep}\n`;
        });
      }
      
      contextPrompt += '\n';
    });

    contextPrompt += '='.repeat(80) + '\n';
    contextPrompt += '🚨 YOU MUST IMPLEMENT ALL METHODS LISTED ABOVE!\n';
    contextPrompt += '🚨 USE EXACT METHOD NAMES FROM THE DIAGRAM!\n';
    contextPrompt += '🚨 FOLLOW DEPENDENCIES AS SPECIFIED!\n';
    contextPrompt += '='.repeat(80) + '\n\n';
  }

  // Add module-specific instructions
  const moduleInstructions = getModuleInstructions(moduleSpec.type);
  contextPrompt += moduleInstructions;

  // Add table schema if relevant
  if (moduleSpec.tables && moduleSpec.tables.length > 0) {
    contextPrompt += '\n\n📋 DATABASE SCHEMA:\n';
    contextPrompt += '='.repeat(80) + '\n';
    
    moduleSpec.tables.forEach(tableName => {
      const table = state.project.schema.find((t: any) => t.name === tableName);
      if (table) {
        contextPrompt += `\nTable: ${table.name}\n`;
        contextPrompt += 'Fields:\n';
        table.fields.forEach((field: any) => {
          const constraints = [];
          if (field.required) constraints.push('REQUIRED');
          if (field.unique) constraints.push('UNIQUE');
          if (field.references) constraints.push(`FK→${field.references}`);
          contextPrompt += `   • ${field.name}: ${field.type}${constraints.length ? ` (${constraints.join(', ')})` : ''}\n`;
        });
      }
    });
    
    contextPrompt += '='.repeat(80) + '\n';
  }

  // Add retry context if needed
  if (attemptNumber > 1) {
    contextPrompt += `\n\n🔄 RETRY ATTEMPT ${attemptNumber}\n`;
    contextPrompt += 'Previous attempt failed. Please ensure:\n';
    contextPrompt += '1. ALL methods from diagram are implemented\n';
    contextPrompt += '2. EXACT method names are used\n';
    contextPrompt += '3. ALL dependencies are properly imported\n';
    contextPrompt += '4. Code follows the diagram structure\n\n';
  }

  return contextPrompt;
}

function getModuleInstructions(moduleType: string): string {
  const instructions: Record<string, string> = {
    models: `
Generate database model modules using FUNCTIONAL factory pattern.

REQUIREMENTS:
- Factory function: create[TableName]Models
- Methods: createRecord, findAllRecords, findByIdRecord, updateByIdRecord, deleteByIdRecord, countRecords
- Use parameterized queries with pg library
- Include soft delete support (deleted_at IS NULL)
- Export as: module.exports = { create[TableName]Models }
`,
    services: `
Generate service modules using FUNCTIONAL factory pattern.

REQUIREMENTS:
- Factory function: create[TableName]Services
- Methods: getAllRecords, getRecordById, createRecords, updateRecords, removeRecords
- Import model factories and call them
- Handle business logic and validation
- Export as: module.exports = { create[TableName]Services }
`,
    handlers: `
Generate request handler modules using FUNCTIONAL approach.

REQUIREMENTS:
- Functions: handleGetAll[Table]Records, handleGet[Table]Records, handleCreate[Table]Records, handleUpdate[Table]Records, handleDelete[Table]Records
- Import service factories and call them
- Use sendSuccess/sendError from utils
- Handle try-catch for errors
- Export as: module.exports = { handleGetAll...., handleGet..., ... }
`,
    routes: `
Generate Express route modules.

REQUIREMENTS:
- Import handlers from ../handlers/[table]Handlers
- Create Express router
- Define REST endpoints (GET, POST, PUT, DELETE)
- Apply middleware as needed
- Export as: module.exports = { router: [table]Router }
`,
    utils: `
Generate utility modules using FUNCTIONAL approach.

REQUIREMENTS:
- Pure functions only (no classes)
- Each utility should be self-contained
- Export all functions as named exports
- Include proper JSDoc comments
`,
    middleware: `
Generate Express middleware using FUNCTIONAL approach.

REQUIREMENTS:
- Standard Express middleware signature: (req, res, next) or (err, req, res, next)
- No classes, only functions
- Import utilities as needed
- Export as named exports
`
  };

  return instructions[moduleType] || '';
}

// ============================================================================
// EXPORT MODIFIED FUNCTION
// ============================================================================

export {
  DiagramParser,
  getModuleSpecsFromDiagram,
  buildDiagramContextPrompt
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your main pipeline, replace getModuleSpecs with:

const moduleSpecs = getModuleSpecsFromDiagram(project, options);

// And in buildContextPrompt, use:

const contextPrompt = buildDiagramContextPrompt(moduleSpec, state, attemptNumber);
*/