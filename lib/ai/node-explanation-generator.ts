// lib/ai/node-explanation-generator.ts

interface NodeExplanationParams {
  nodes: any[]
  projectContext: {
    name: string
    description?: string
    schemas?: any[]
  }
  diagramType: 'ERD' | 'HLD' | 'LLD' | 'DFD' | 'API'
}

interface AIExplanation {
  whyChosen: string
  howItFits: string
  tradeoffs: string
  bestPractices: string
}

export async function generateNodeExplanations(
  params: NodeExplanationParams
): Promise<any[]> {
  const { nodes, projectContext, diagramType } = params

  console.log(`🤖 Generating AI explanations for ${nodes?.length || 0} ${diagramType} nodes...`)

  // Validate input
  if (!nodes || !Array.isArray(nodes)) {
    console.error('❌ Invalid nodes array provided')
    return []
  }

  if (nodes.length === 0) {
    console.warn('⚠️ No nodes to generate explanations for')
    return []
  }

  try {
    // Return nodes with default explanations immediately
    // This prevents any async issues or blank results
    const nodesWithExplanations = nodes.map((node, index) => {
      try {
        // Validate node structure
        if (!node || typeof node !== 'object') {
          console.warn(`⚠️ Node at index ${index} is invalid, skipping`)
          return node
        }

        // Ensure node.data exists
        if (!node.data || typeof node.data !== 'object') {
          console.warn(`⚠️ Node at index ${index} has no data object, initializing`)
          node.data = {}
        }

        // Generate contextual default explanation based on diagram type
        const defaultExplanation = generateDefaultExplanation(node, diagramType, projectContext)

        // Add explanation to node.data
        return {
          ...node,
          data: {
            ...node.data,
            aiExplanation: defaultExplanation
          }
        }
      } catch (nodeError) {
        console.error(`❌ Error processing node at index ${index}:`, nodeError)
        return node // Return original node if there's an error
      }
    })

    console.log(`✅ Generated explanations for ${nodesWithExplanations.length} nodes`)
    return nodesWithExplanations

  } catch (error) {
    console.error('❌ Failed to generate node explanations:', error)
    // Return original nodes if everything fails
    return nodes
  }
}

function generateDefaultExplanation(
  node: any,
  diagramType: string,
  projectContext: any
): AIExplanation {
  const nodeType = node.type || 'component'
  const nodeName = node.data?.label || node.data?.name || node.id || 'Component'
  const nodeDescription = node.data?.description || ''

  // For ERD specifically
  if (diagramType === 'ERD') {
    const tableName = nodeName
    const fieldCount = node.data?.fields?.length || 0
    const hasRelationships = node.data?.fields?.some((f: any) => f.isForeignKey) || false
    const primaryKeys = node.data?.fields?.filter((f: any) => f.isPrimaryKey) || []

    return {
      whyChosen: `The "${tableName}" table is essential for storing ${nodeDescription.toLowerCase() || 'data'} in ${projectContext.name}. ${
        hasRelationships 
          ? 'It maintains relationships with other tables through foreign keys.' 
          : 'It operates as an independent entity in the database schema.'
      }`,
      howItFits: `This table integrates into the ${projectContext.name} data model with ${fieldCount} field${fieldCount !== 1 ? 's' : ''}, ${
        primaryKeys.length > 0 
          ? `using ${primaryKeys.map((pk: any) => pk.name).join(', ')} as primary key${primaryKeys.length > 1 ? 's' : ''}` 
          : 'supporting the overall data structure'
      }. ${
        hasRelationships
          ? 'Its foreign key relationships ensure data integrity across the system.'
          : 'It stores self-contained data without direct dependencies.'
      }`,
      tradeoffs: `${
        fieldCount > 15
          ? 'Large number of fields may indicate need for normalization. '
          : fieldCount < 3
          ? 'Minimal fields suggest a focused, single-purpose table. '
          : 'Balanced field count supports maintainability. '
      }${
        hasRelationships
          ? 'Foreign key relationships ensure data integrity but may impact write performance.'
          : 'Independence from other tables simplifies queries but may require data duplication.'
      }`,
      bestPractices: `Follow standard database best practices: ${
        primaryKeys.length > 0 ? '✓ Primary key defined, ' : '⚠️ Add a primary key, '
      }${
        node.data?.indexes?.length > 0
          ? `✓ ${node.data.indexes.length} index${node.data.indexes.length > 1 ? 'es' : ''} defined, `
          : '⚠️ Consider adding indexes for frequently queried columns, '
      }${
        hasRelationships ? '✓ Referential integrity via foreign keys, ' : ''
      }ensure proper data types, add constraints where needed, and document the schema.`
    }
  }

  // For other diagram types (HLD, LLD, etc.)
  return {
    whyChosen: `"${nodeName}" provides essential ${nodeType} functionality for ${projectContext.name}. ${
      nodeDescription ? `It ${nodeDescription.toLowerCase()}.` : 'It handles critical system operations.'
    }`,
    howItFits: `This ${nodeType} integrates with other components to handle ${nodeType} responsibilities in the ${projectContext.name} architecture. It serves as a key part of the system's ${
      nodeType.includes('service') ? 'business logic' :
      nodeType.includes('database') ? 'data persistence' :
      nodeType.includes('gateway') ? 'request routing' :
      nodeType.includes('cache') ? 'performance optimization' :
      'overall functionality'
    }.`,
    tradeoffs: `Selected for its balance of performance, scalability, and ease of integration. ${
      nodeType.includes('service')
        ? 'Microservice isolation provides flexibility but adds network overhead.'
        : nodeType.includes('database')
        ? 'Centralized data storage ensures consistency but may become a bottleneck.'
        : nodeType.includes('cache')
        ? 'Caching improves speed but requires cache invalidation strategy.'
        : 'Consider monitoring and scaling strategies as load increases.'
    }`,
    bestPractices: `Follow standard ${nodeType} best practices for configuration and deployment: ${
      nodeType.includes('service')
        ? 'implement health checks, use circuit breakers, ensure proper error handling'
        : nodeType.includes('database')
        ? 'optimize queries, implement backup strategies, use connection pooling'
        : nodeType.includes('gateway')
        ? 'configure rate limiting, implement authentication, enable logging'
        : nodeType.includes('cache')
        ? 'set appropriate TTLs, implement cache warming, monitor hit rates'
        : 'ensure proper monitoring, logging, and alerting'
    }.`
  }
}

// Optional: Advanced AI-powered explanations (only call if API key available)
export async function generateAdvancedExplanations(
  nodes: any[],
  projectContext: any,
  diagramType: string
): Promise<any[]> {
  // This function can be called separately if you want AI-powered explanations
  // For now, it's optional and won't block the main flow
  console.log('⚠️ Advanced AI explanations not implemented yet - using smart defaults')
  return nodes
}