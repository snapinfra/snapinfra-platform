// lib/utils/erd-generator.ts
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export interface ERDField {
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  isNullable: boolean
  references?: {
    table: string
    field: string
  }
}

export interface ERDTable {
  id: string
  type: 'default'  // ReactFlow will use default node renderer
  position: { x: number; y: number }
  data: {
    label: string
    description: string
    fields: ERDField[]
    color: string
    indexes: string[]
    constraints: string[]
  }
  // CRITICAL: Add dimensions for ReactFlow proper rendering
  style?: {
    width: number
    height: number
    border: string
    borderRadius: string
    padding: string
    backgroundColor: string
  }
}

export interface ERDRelationship {
  id: string
  source: string
  target: string
  type: 'smoothstep' | 'step' | 'default'
  label?: string
  animated?: boolean
  style?: {
    stroke?: string
    strokeWidth?: number
  }
  markerEnd?: {
    type: string
    color?: string
  }
  data?: {
    sourceField: string
    targetField: string
    relationType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  }
}

export interface ERDDiagram {
  id: string
  name: string
  nodes: ERDTable[]
  edges: ERDRelationship[]
  metadata: {
    totalTables: number
    totalRelationships: number
    totalFields: number
    createdAt: string
  }
}

const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY || ''
})

// IMPROVED: Better layout configuration for ReactFlow
const ERD_LAYOUT = {
  nodeWidth: 280,
  nodeHeight: 200,  // Base height, will adjust per table
  horizontalSpacing: 400,
  verticalSpacing: 300,
  startX: 100,
  startY: 100,
  maxTablesPerRow: 3  // Reduced for better visibility
}

function calculateNodeHeight(fieldsCount: number, indexesCount: number, constraintsCount: number): number {
  const baseHeight = 80  // Header + padding
  const fieldHeight = fieldsCount * 24  // Each field takes ~24px
  const indexHeight = indexesCount * 20  // Each index takes ~20px
  const constraintHeight = constraintsCount * 20  // Each constraint takes ~20px
  
  return Math.max(
    ERD_LAYOUT.nodeHeight, 
    baseHeight + fieldHeight + indexHeight + constraintHeight + 40
  )
}

function calculateERDPosition(index: number, totalTables: number): { x: number; y: number } {
  const tablesPerRow = Math.min(ERD_LAYOUT.maxTablesPerRow, Math.ceil(Math.sqrt(totalTables)))
  const row = Math.floor(index / tablesPerRow)
  const col = index % tablesPerRow
  
  // Center tables in each row
  const tablesInThisRow = Math.min(tablesPerRow, totalTables - (row * tablesPerRow))
  const rowWidth = (tablesInThisRow - 1) * ERD_LAYOUT.horizontalSpacing
  const startXForRow = ERD_LAYOUT.startX + ((ERD_LAYOUT.maxTablesPerRow - 1) * ERD_LAYOUT.horizontalSpacing - rowWidth) / 2
  
  return {
    x: startXForRow + (col * ERD_LAYOUT.horizontalSpacing),
    y: ERD_LAYOUT.startY + (row * ERD_LAYOUT.verticalSpacing)
  }
}

function getTableColor(tableName: string): string {
  const colorMap = {
    user: '#3B82F6',      // Blue
    auth: '#F59E0B',      // Orange
    task: '#8B5CF6',      // Purple
    product: '#10B981',   // Green
    order: '#EF4444',     // Red
    category: '#06B6D4',  // Cyan
    priority: '#EC4899',  // Pink
    setting: '#6B7280',   // Gray
    log: '#CA8A04',       // Yellow
    audit: '#DC2626',     // Dark Red
    permission: '#7C3AED', // Violet
    comment: '#8B5CF6',   // Purple
    tag: '#14B8A6'        // Teal
  }
  
  const key = Object.keys(colorMap).find(k => 
    tableName.toLowerCase().includes(k)
  )
  
  return key ? colorMap[key as keyof typeof colorMap] : '#6B7280'
}

function determineRelationType(
  sourceTable: string,
  targetTable: string,
  field: any
): 'one-to-one' | 'one-to-many' | 'many-to-many' {
  // Check if it's a junction table (many-to-many)
  const sourceTableLower = sourceTable.toLowerCase()
  const targetTableLower = targetTable.toLowerCase()
  
  if (sourceTableLower.includes('_') && 
      (sourceTableLower.split('_').some(part => targetTableLower.includes(part)))) {
    return 'many-to-many'
  }
  
  // Check if field is unique (one-to-one)
  if (field.unique) {
    return 'one-to-one'
  }
  
  // Default to one-to-many
  return 'one-to-many'
}

export async function generateERDFromSchemas(
  schemas: any[],
  projectName: string
): Promise<ERDDiagram> {
  console.log('🗺️ Generating Enhanced ERD from schemas...')
  console.log(`  Tables to process: ${schemas?.length || 0}`)
  
  // Validate input
  if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
    console.error('❌ No valid schemas array provided')
    throw new Error('No schemas provided for ERD generation')
  }
  
  const nodes: ERDTable[] = []
  const edges: ERDRelationship[] = []
  const relationshipMap = new Map<string, number>()
  let validSchemaCount = 0

  // Process each schema into ERD table node
  schemas.forEach((schema, index) => {
    try {
      // Validate schema structure
      if (!schema || typeof schema !== 'object') {
        console.warn(`⚠️ Schema at index ${index} is not an object, skipping`)
        return
      }

      if (!schema.name || typeof schema.name !== 'string') {
        console.warn(`⚠️ Schema at index ${index} has invalid or missing name, skipping`)
        return
      }

      if (!Array.isArray(schema.fields)) {
        console.warn(`⚠️ Schema "${schema.name}" has invalid fields (not array), skipping`)
        return
      }

      const position = calculateERDPosition(validSchemaCount, schemas.length)
      
      // IMPROVED: More robust field validation
      const erdFields: ERDField[] = schema.fields
        .filter((field: any) => {
          // More lenient validation - we want to keep fields even if some properties are missing
          if (!field) {
            console.warn(`⚠️ Null field in schema "${schema.name}"`)
            return false
          }
          if (typeof field !== 'object') {
            console.warn(`⚠️ Non-object field in schema "${schema.name}"`)
            return false
          }
          if (!field.name) {
            console.warn(`⚠️ Field without name in schema "${schema.name}"`)
            return false
          }
          return true  // Keep the field if it has at least a name
        })
        .map((field: any) => {
          // Provide defaults for missing properties
          const fieldType = field.type || 'VARCHAR'
          const typeWithLength = field.length ? `${fieldType}(${field.length})` : fieldType
          
          return {
            name: field.name,
            type: typeWithLength,
            isPrimaryKey: Boolean(field.primary || field.primaryKey || field.isPrimaryKey),
            isForeignKey: Boolean(field.references || field.foreignKey),
            isUnique: Boolean(field.unique || field.isUnique),
            isNullable: field.nullable !== false && field.required !== true,  // Default to nullable
            references: (field.references && typeof field.references === 'object') ? {
              table: String(field.references.table || ''),
              field: String(field.references.field || field.references.column || 'id')
            } : undefined
          }
        })

      // Ensure we have at least one field
      if (erdFields.length === 0) {
        console.warn(`⚠️ Schema "${schema.name}" has no valid fields after filtering`)
        // Add a placeholder field so the table isn't blank
        erdFields.push({
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isForeignKey: false,
          isUnique: true,
          isNullable: false
        })
      }

      // Extract indexes with validation
      const indexes = Array.isArray(schema.indexes) 
        ? schema.indexes
            .filter((idx: any) => idx && typeof idx === 'object')
            .map((idx: any) => {
              if (Array.isArray(idx.fields) && idx.fields.length > 0) {
                return `${idx.type || 'INDEX'} on ${idx.fields.join(', ')}`
              }
              if (idx.name) {
                return `${idx.type || 'INDEX'}: ${idx.name}`
              }
              return `${idx.type || 'INDEX'}`
            })
            .filter(Boolean)
        : []

      // Extract constraints with validation
      const constraints = Array.isArray(schema.constraints)
        ? schema.constraints
            .filter((c: any) => c && typeof c === 'object')
            .map((c: any) => {
              if (c.definition) return c.definition
              if (c.name && c.type) return `${c.type}: ${c.name}`
              if (c.name) return c.name
              if (c.type) return c.type
              return 'CONSTRAINT'
            })
            .filter(Boolean)
        : []

      // Sanitize table name for ID
      const sanitizedName = schema.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      const tableColor = getTableColor(schema.name)
      
      // Calculate dynamic height based on content
      const nodeHeight = calculateNodeHeight(erdFields.length, indexes.length, constraints.length)

      // CRITICAL FIX: Create node with proper ReactFlow structure
      const tableNode: ERDTable = {
        id: `table-${sanitizedName}`,
        type: 'default',
        position,
        data: {
          label: schema.name,
          description: schema.comment || schema.description || `Data table for ${schema.name}`,
          fields: erdFields,
          color: tableColor,
          indexes,
          constraints
        },
        // Add inline styles for ReactFlow rendering
        style: {
          width: ERD_LAYOUT.nodeWidth,
          height: nodeHeight,
          border: `2px solid ${tableColor}`,
          borderRadius: '8px',
          padding: '12px',
          backgroundColor: '#ffffff'
        }
      }

      nodes.push(tableNode)
      validSchemaCount++

      // Process relationships from foreign keys
      if (Array.isArray(schema.fields)) {
        schema.fields
          .filter((field: any) => 
            field && 
            typeof field === 'object' &&
            field.references && 
            typeof field.references === 'object' &&
            field.references.table
          )
          .forEach((field: any) => {
            try {
              const sourceId = `table-${sanitizedName}`
              const targetTable = field.references.table
              const targetSanitized = targetTable.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
              const targetId = `table-${targetSanitized}`
              const relationshipKey = `${sourceId}-${targetId}-${field.name}`
              
              // Avoid duplicate relationships
              if (!relationshipMap.has(relationshipKey)) {
                relationshipMap.set(relationshipKey, 1)
                
                const relationType = determineRelationType(schema.name, targetTable, field)
                const relationshipColor = getTableColor(targetTable)
                
                edges.push({
                  id: `rel-${edges.length + 1}`,
                  source: sourceId,
                  target: targetId,
                  type: 'smoothstep',
                  label: field.name || 'FK',
                  animated: relationType === 'many-to-many',
                  style: {
                    stroke: relationshipColor,
                    strokeWidth: 2
                  },
                  markerEnd: {
                    type: 'arrowclosed',
                    color: relationshipColor
                  },
                  data: {
                    sourceField: field.name,
                    targetField: field.references.field || 'id',
                    relationType
                  }
                })
              }
            } catch (edgeError) {
              console.warn(`⚠️ Error creating edge for field ${field.name}:`, edgeError)
            }
          })
      }
    } catch (nodeError) {
      console.error(`❌ Error processing schema at index ${index}:`, nodeError)
    }
  })

  // Final validation
  if (nodes.length === 0) {
    console.error('❌ No valid tables generated from schemas')
    throw new Error('No valid tables generated from schemas')
  }

  const totalFields = nodes.reduce((sum, node) => sum + (node.data?.fields?.length || 0), 0)

  console.log('✅ ERD Generated Successfully')
  console.log(`  Valid Schemas: ${validSchemaCount}/${schemas.length}`)
  console.log(`  Tables: ${nodes.length}, Relationships: ${edges.length}, Fields: ${totalFields}`)

  return {
    id: `erd-${Date.now()}`,
    name: `${projectName || 'Database'} - Entity Relationship Diagram`,
    nodes,
    edges,
    metadata: {
      totalTables: nodes.length,
      totalRelationships: edges.length,
      totalFields,
      createdAt: new Date().toISOString()
    }
  }
}

export async function generateEnhancedERD(
  schemas: any[],
  projectName: string,
  description?: string
): Promise<ERDDiagram> {
  console.log('🚀 Starting Enhanced ERD Generation')
  console.log(`  Project: ${projectName}`)
  console.log(`  Schemas provided: ${schemas?.length || 0}`)
  
  try {
    // Validate inputs
    if (!schemas || !Array.isArray(schemas)) {
      throw new Error('Schemas must be an array')
    }

    if (schemas.length === 0) {
      throw new Error('No schemas provided')
    }

    // IMPROVED: More lenient schema validation
    const validSchemas = schemas.filter(s => {
      if (!s || typeof s !== 'object') {
        console.warn('⚠️ Skipping non-object schema')
        return false
      }
      if (!s.name || typeof s.name !== 'string') {
        console.warn('⚠️ Skipping schema without valid name')
        return false
      }
      if (!Array.isArray(s.fields)) {
        console.warn(`⚠️ Skipping schema "${s.name}" - fields is not an array`)
        return false
      }
      // Don't require fields to have content - we'll add placeholder if needed
      return true
    })

    if (validSchemas.length === 0) {
      throw new Error('No valid schemas found - all schemas are missing required fields (name and fields array)')
    }

    console.log(`✅ Validated: ${validSchemas.length}/${schemas.length} schemas are valid`)

    // Generate base ERD first (this should always succeed now)
    const erd = await generateERDFromSchemas(validSchemas, projectName)
    
    // Try to get AI insights, but don't fail if it doesn't work
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('🤖 Generating AI insights...')
        
        const systemPrompt = `You are a database architect expert. Analyze database schemas and provide insights about:
1. Relationship types and their correctness
2. Missing indexes that would improve performance
3. Normalization issues and suggestions
4. Potential performance bottlenecks

Return as valid JSON only. Be concise and actionable.`
        
        // Build a more robust prompt with error handling
        const schemasSummary = validSchemas.slice(0, 8).map((s: any) => 
          `${s.name} (${s.fields?.length || 0} fields, ${(s.indexes || []).length} indexes)`
        ).join(', ')

        const relationshipsSummary = validSchemas
          .slice(0, 8)
          .flatMap((s: any) => 
            (s.fields || [])
              .filter((f: any) => f && f.references && f.references.table)
              .map((f: any) => 
                `${s.name}.${f.name} → ${f.references.table}.${f.references.field || 'id'}`
              )
          )
          .join(', ') || 'No relationships defined'

        const userPrompt = `Analyze database schema for "${projectName}":

Tables: ${schemasSummary}

Key relationships: ${relationshipsSummary}

Provide JSON response with this exact structure:
{
  "relationships": [
    {"from": "table1", "to": "table2", "type": "one-to-many", "description": "explanation"}
  ],
  "indexRecommendations": [
    {"table": "table1", "fields": ["field1"], "reason": "explanation"}
  ],
  "normalizationIssues": [
    {"table": "table1", "issue": "description", "suggestion": "fix"}
  ],
  "performanceWarnings": ["warning1", "warning2"]
}`

        const response = await generateText({
          model: groqProvider('llama-3.3-70b-versatile'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          maxTokens: 2000
        })

        // Parse AI insights with better error handling
        let aiInsights = response.text.trim()
        
        // Remove markdown code blocks if present
        aiInsights = aiInsights.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
        
        // Try to parse JSON
        const insights = JSON.parse(aiInsights)
        
        // Validate insights structure
        if (insights && typeof insights === 'object') {
          (erd as any).aiInsights = {
            relationships: Array.isArray(insights.relationships) ? insights.relationships : [],
            indexRecommendations: Array.isArray(insights.indexRecommendations) ? insights.indexRecommendations : [],
            normalizationIssues: Array.isArray(insights.normalizationIssues) ? insights.normalizationIssues : [],
            performanceWarnings: Array.isArray(insights.performanceWarnings) ? insights.performanceWarnings : []
          }
          console.log('✅ AI insights added to ERD')
        }
      } catch (aiError) {
        console.warn('⚠️ Could not generate AI insights:', aiError)
        console.warn('⚠️ Continuing with base ERD without AI insights')
      }
    } else {
      console.warn('⚠️ GROQ_API_KEY not found, skipping AI insights')
    }
    
    console.log('✅ Enhanced ERD generation complete')
    return erd
    
  } catch (error) {
    console.error('❌ Enhanced ERD generation failed:', error)
    throw error
  }
}