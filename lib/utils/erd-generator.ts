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
  type: 'default'
  position: { x: number; y: number }
  data: {
    label: string
    description: string
    fields: ERDField[]
    color: string
    indexes: string[]
    constraints: string[]
  }
}

export interface ERDRelationship {
  id: string
  source: string
  target: string
  type: 'smoothstep' | 'step'
  label: string
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

// Enhanced ERD layout for better ReactFlow visualization
const ERD_LAYOUT = {
  tableWidth: 300,
  tableHeight: 250,
  horizontalSpacing: 450,
  verticalSpacing: 350,
  startX: 50,
  startY: 50,
  maxTablesPerRow: 4
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
    permission: '#7C3AED' // Violet
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
  if (sourceTable.includes('_') && targetTable.includes('_')) {
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
  console.log(`  Tables to process: ${schemas.length}`)
  
  const nodes: ERDTable[] = []
  const edges: ERDRelationship[] = []
  const relationshipMap = new Map<string, number>()

  // Process each schema into ERD table node
  schemas.forEach((schema, index) => {
    const position = calculateERDPosition(index, schemas.length)
    
    const erdFields: ERDField[] = schema.fields.map((field: any) => ({
      name: field.name,
      type: field.type + (field.length ? `(${field.length})` : ''),
      isPrimaryKey: field.primary || false,
      isForeignKey: !!field.references,
      isUnique: field.unique || false,
      isNullable: field.nullable !== false,
      references: field.references ? {
        table: field.references.table,
        field: field.references.field
      } : undefined
    }))

    // Extract indexes
    const indexes = (schema.indexes || []).map((idx: any) => 
      `${idx.type || 'INDEX'} on ${idx.fields.join(', ')}`
    )

    // Extract constraints
    const constraints = (schema.constraints || []).map((c: any) => 
      c.definition || `${c.type}: ${c.name}`
    )

    nodes.push({
      id: `table-${schema.name.toLowerCase()}`,
      type: 'default',
      position,
      data: {
        label: schema.name,
        description: schema.comment || `Data table for ${schema.name.toLowerCase()}`,
        fields: erdFields,
        color: getTableColor(schema.name),
        indexes,
        constraints
      }
    })

    // Process relationships from foreign keys
    schema.fields.forEach((field: any) => {
      if (field.references) {
        const sourceId = `table-${schema.name.toLowerCase()}`
        const targetId = `table-${field.references.table.toLowerCase()}`
        const relationshipKey = `${sourceId}-${targetId}-${field.name}`
        
        if (!relationshipMap.has(relationshipKey)) {
          relationshipMap.set(relationshipKey, 1)
          
          const relationType = determineRelationType(schema.name, field.references.table, field)
          
          edges.push({
            id: `rel-${edges.length + 1}`,
            source: sourceId,
            target: targetId,
            type: 'smoothstep',
            label: `${field.name}`,
            animated: relationType === 'many-to-many',
            style: {
              stroke: getTableColor(field.references.table),
              strokeWidth: 2
            },
            markerEnd: {
              type: 'arrowclosed',
              color: getTableColor(field.references.table)
            },
            data: {
              sourceField: field.name,
              targetField: field.references.field,
              relationType
            }
          })
        }
      }
    })
  })

  const totalFields = nodes.reduce((sum, node) => sum + node.data.fields.length, 0)

  console.log('✅ ERD Generated Successfully')
  console.log(`  Tables: ${nodes.length}, Relationships: ${edges.length}, Fields: ${totalFields}`)

  return {
    id: `erd-${Date.now()}`,
    name: `${projectName} - Entity Relationship Diagram`,
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
  try {
    const systemPrompt = `You are a database architect expert. Analyze database schemas and provide insights about:
1. Relationship types and their correctness
2. Missing indexes that would improve performance
3. Normalization issues and suggestions
4. Potential performance bottlenecks

Return as valid JSON only.`
    
    const userPrompt = `Analyze database schema for "${projectName}":

Tables: ${schemas.slice(0, 8).map((s: any) => 
  `${s.name} (${s.fields.length} fields, ${(s.indexes || []).length} indexes)`
).join(', ')}

Key relationships: ${schemas.slice(0, 8).flatMap((s: any) => 
  s.fields.filter((f: any) => f.references).map((f: any) => 
    `${s.name}.${f.name} -> ${f.references.table}.${f.references.field}`
  )
).join(', ')}

Provide JSON response:
{
  "relationships": [
    {"from": "table1", "to": "table2", "type": "one-to-many", "description": "why"}
  ],
  "indexRecommendations": [
    {"table": "table1", "fields": ["field1", "field2"], "reason": "why"}
  ],
  "normalizationIssues": [
    {"table": "table1", "issue": "description", "suggestion": "fix"}
  ],
  "performanceWarnings": ["warning 1", "warning 2"]
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

    const erd = await generateERDFromSchemas(schemas, projectName)
    
    // Parse AI insights
    try {
      let aiInsights = response.text.trim()
      aiInsights = aiInsights.replace(/^```(?:json)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
      const insights = JSON.parse(aiInsights)
      ;(erd as any).aiInsights = insights
      console.log('✅ AI insights added to ERD')
    } catch (e) {
      console.warn('⚠️ Could not parse AI insights, using base ERD')
    }
    
    return erd
    
  } catch (error) {
    console.error('❌ Enhanced ERD generation failed:', error)
    return generateERDFromSchemas(schemas, projectName)
  }
}