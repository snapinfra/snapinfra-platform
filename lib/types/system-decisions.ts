export interface ToolRecommendation {
  id: string
  category: string
  component: string // Which architecture component this relates to
  name: string
  type: 'open-source' | 'commercial' | 'managed-service'
  description: string
  pros: string[]
  cons: string[]
  pricing: {
    model: 'free' | 'freemium' | 'subscription' | 'usage-based' | 'enterprise'
    cost?: string
    details?: string
  }
  complexity: 'low' | 'medium' | 'high'
  popularity: number // 1-100 score
  documentation: string
  alternatives: string[]
  integration: {
    effort: 'low' | 'medium' | 'high'
    timeEstimate: string
    dependencies: string[]
  }
  metadata: {
    github?: string
    website?: string
    dockerImage?: string
    cloudProvider?: string
    supportLevel?: 'community' | 'commercial' | 'enterprise'
  }
}

export interface SystemDecision {
  id: string
  title: string
  description: string
  category: 'infrastructure' | 'database' | 'monitoring' | 'security' | 'development' | 'deployment' | 'analytics'
  component: string
  recommendations: ToolRecommendation[]
  selectedTool: string // ID of selected tool
  reasoning: string
  impact: 'low' | 'medium' | 'high'
  urgency: 'optional' | 'recommended' | 'critical'
}

export interface SystemDecisionsSummary {
  projectName: string
  architecture: {
    complexity: 'simple' | 'moderate' | 'complex'
    components: number
    estimatedCost: {
      development: string
      monthly: string
      annual: string
    }
    timeline: {
      mvp: string
      production: string
      scale: string
    }
  }
  decisions: SystemDecision[]
  integrationPlan: {
    phase1: string[] // Critical components
    phase2: string[] // Recommended components  
    phase3: string[] // Optional/Future components
  }
  totalCostEstimate: {
    development: number
    monthlyOperational: number
    annualOperational: number
  }
  riskAssessment: {
    technical: string[]
    operational: string[]
    financial: string[]
  }
}

export interface DecisionFilter {
  category?: string
  type?: 'open-source' | 'commercial' | 'managed-service'
  complexity?: 'low' | 'medium' | 'high'
  urgency?: 'optional' | 'recommended' | 'critical'
}