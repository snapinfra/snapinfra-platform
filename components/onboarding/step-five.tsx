"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Settings, 
  ExternalLink,
  Github,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Calendar,
  Target,
  AlertTriangle,
  Info,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  BarChart3,
  Building2,
  CloudIcon,
  Database,
  Network,
  Lock,
  Activity,
  Layers,
  Globe,
  Cpu,
  Package,
  CheckSquare,
  XCircle,
  Download,
  GitCompare
} from "lucide-react"

import { SystemDecisionsSummary, SystemDecision, ToolRecommendation } from '@/lib/types/system-decisions'
import { generateSystemDecisions } from '@/lib/utils/system-decisions'
import { SystemArchitecture } from '@/lib/types/architecture'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface StepFiveProps {
  data: {
    projectName?: string
    description?: string
    schemas?: any[]
    analysis?: any
    endpoints?: any[]
    architecture?: SystemArchitecture
  }
  onComplete: (payload?: { decisions: SystemDecisionsSummary; selectedTools: Record<string, string> }) => void
  onBack: () => void
}

export function StepFive({ data, onComplete, onBack }: StepFiveProps) {
  const [decisions, setDecisions] = useState<SystemDecisionsSummary | null>(null)
  const [selectedTools, setSelectedTools] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [comparisonTools, setComparisonTools] = useState<string[]>([])
  const [filters, setFilters] = useState({
    type: 'all',
    urgency: 'all',
    category: 'all',
    complexity: 'all',
    pricing: 'all',
    popularity: 'all'
  })
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'cost' | 'complexity'>('popularity')
  const [groupBy, setGroupBy] = useState<'category' | 'component' | 'type' | 'none'>('category')

  useEffect(() => {
    const generateDecisions = async () => {
      setIsGenerating(true)
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (data.architecture) {
        const decisionsSummary = generateSystemDecisions(data.architecture, data)
        setDecisions(decisionsSummary)
        
        // Initialize selected tools with recommendations
        const initialSelections: Record<string, string> = {}
        decisionsSummary.decisions.forEach(decision => {
          initialSelections[decision.id] = decision.selectedTool
        })
        setSelectedTools(initialSelections)
      }
      
      setIsGenerating(false)
    }
    
    generateDecisions()
  }, [data])

  const handleToolSelection = (decisionId: string, toolId: string) => {
    setSelectedTools(prev => ({
      ...prev,
      [decisionId]: toolId
    }))
  }

  const handleComparisonToggle = (toolId: string, decisionId: string) => {
    setComparisonTools(prev => {
      const toolKey = `${decisionId}:${toolId}`
      return prev.includes(toolKey) 
        ? prev.filter(id => id !== toolKey)
        : [...prev, toolKey]
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'database': return Database
      case 'infrastructure': return CloudIcon
      case 'security': return Lock
      case 'monitoring': return Activity
      case 'deployment': return Package
      case 'analytics': return BarChart3
      default: return Settings
    }
  }

  const getTypeColor = (type: ToolRecommendation['type']) => {
    switch (type) {
      case 'open-source': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'commercial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'managed-service': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getUrgencyColor = (urgency: SystemDecision['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'recommended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'optional': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getComplexityColor = (complexity: ToolRecommendation['complexity']) => {
    switch (complexity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
    }
  }

  const filteredAndSearchedDecisions = decisions?.decisions.filter(decision => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        decision.title.toLowerCase().includes(searchLower) ||
        decision.description.toLowerCase().includes(searchLower) ||
        decision.component.toLowerCase().includes(searchLower) ||
        decision.recommendations.some(r => 
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower)
        )
      if (!matchesSearch) return false
    }

    // Category filter
    if (filters.category !== 'all' && decision.category !== filters.category) return false
    
    // Urgency filter
    if (filters.urgency !== 'all' && decision.urgency !== filters.urgency) return false
    
    // Tool type filter
    if (filters.type !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.type !== filters.type) return false
    }

    // Complexity filter
    if (filters.complexity !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.complexity !== filters.complexity) return false
    }

    // Pricing filter
    if (filters.pricing !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.pricing.model !== filters.pricing) return false
    }

    // Popularity filter
    if (filters.popularity !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool) {
        const popularityThreshold = filters.popularity === 'high' ? 85 : 60
        const meetsPopularity = filters.popularity === 'high' ? 
          selectedTool.popularity >= popularityThreshold :
          selectedTool.popularity < popularityThreshold
        if (!meetsPopularity) return false
      }
    }

    return true
  }) || []

  // Group and sort decisions
  const processedDecisions = (() => {
    let processed = [...filteredAndSearchedDecisions]
    
    // Sort decisions
    processed.sort((a, b) => {
      const toolA = a.recommendations.find(r => r.id === selectedTools[a.id])
      const toolB = b.recommendations.find(r => r.id === selectedTools[b.id])
      
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title)
        case 'popularity':
          return (toolB?.popularity || 0) - (toolA?.popularity || 0)
        case 'complexity':
          const complexityOrder = { 'low': 1, 'medium': 2, 'high': 3 }
          return (complexityOrder[toolA?.complexity || 'medium']) - (complexityOrder[toolB?.complexity || 'medium'])
        default:
          return 0
      }
    })

    return processed
  })()

  // Group decisions if needed
  const groupedDecisions = (() => {
    if (groupBy === 'none') return { 'All Decisions': processedDecisions }
    
    const groups: Record<string, typeof processedDecisions> = {}
    
    processedDecisions.forEach(decision => {
      let groupKey = ''
      switch (groupBy) {
        case 'category':
          groupKey = decision.category.charAt(0).toUpperCase() + decision.category.slice(1)
          break
        case 'component':
          groupKey = decision.component.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
          break
        case 'type':
          const tool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
          groupKey = tool?.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
          break
        default:
          groupKey = 'All'
      }
      
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(decision)
    })
    
    return groups
  })()

  if (isGenerating) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Analyzing Your System Architecture</h2>
            <p className="text-muted-foreground">
              Generating intelligent tool recommendations and integration strategies...
            </p>
          </div>
          <div className="flex justify-center space-x-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Tool Analysis
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cost Estimation
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Risk Assessment
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!decisions) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Error Generating Decisions</h2>
          <p className="text-muted-foreground">
            There was an issue analyzing your system architecture. Please try again.
          </p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-6 space-y-6">
      {/* Header */}
      <div className="text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>
              <Building2 className="w-6 h-6 text-primary" />
              Enterprise Architecture Decisions
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              AI-powered tool selection and architecture recommendations for <span className="font-medium">{decisions.projectName}</span>. 
              Acting as your lead architect, we've analyzed your requirements, team size, budget, and compliance needs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode)
                setComparisonTools([])
              }}
              className="flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Compare Tools
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Enterprise Context & Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground capitalize">
            {decisions.architecture.complexity}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Complexity</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {decisions.architecture.estimatedCost.monthly}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Monthly Cost</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {decisions.architecture.timeline.mvp}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">MVP Timeline</div>
        </Card>
        
        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {decisions.decisions.length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Tool Decisions</div>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {decisions.riskAssessment.technical.length + decisions.riskAssessment.operational.length + decisions.riskAssessment.financial.length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Risk Items</div>
        </Card>

        <Card className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-foreground">
            {Object.keys(groupedDecisions).length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">Categories</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Executive Summary
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Tool Selection
            {filteredAndSearchedDecisions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filteredAndSearchedDecisions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Implementation
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cost Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Development</span>
                  <span className="font-semibold text-lg">{decisions.architecture.estimatedCost.development}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Operational</span>
                  <span className="font-semibold text-lg">{decisions.architecture.estimatedCost.monthly}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Annual Operational</span>
                  <span className="font-semibold text-lg">{decisions.architecture.estimatedCost.annual}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total First Year</span>
                  <span className="font-bold text-xl text-primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(decisions.totalCostEstimate.development + decisions.totalCostEstimate.annualOperational)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tool Distribution
              </h3>
              <div className="space-y-3">
                {['open-source', 'commercial', 'managed-service'].map(type => {
                  const count = decisions.decisions.filter(d => {
                    const tool = d.recommendations.find(r => r.id === selectedTools[d.id])
                    return tool?.type === type
                  }).length
                  const percentage = (count / decisions.decisions.length) * 100
                  
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type.replace('-', ' ')}</span>
                        <span>{count} tools ({Math.round(percentage)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <div className="space-y-6">
            {/* Search and Filtering */}
            <Card className="p-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search tools, categories, or components..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="complexity">Complexity</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="component">Component</SelectItem>
                      <SelectItem value="type">Tool Type</SelectItem>
                      <SelectItem value="none">No Grouping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({...prev, category: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="deployment">Deployment</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tool Type</label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="open-source">Open Source</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="managed-service">Managed Service</SelectItem>
                        <SelectItem value="freemium">Freemium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Complexity</label>
                    <Select value={filters.complexity} onValueChange={(value) => setFilters(prev => ({...prev, complexity: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Urgency</label>
                    <Select value={filters.urgency} onValueChange={(value) => setFilters(prev => ({...prev, urgency: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="recommended">Recommended</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pricing</label>
                    <Select value={filters.pricing} onValueChange={(value) => setFilters(prev => ({...prev, pricing: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="freemium">Freemium</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="usage-based">Usage Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Popularity</label>
                    <Select value={filters.popularity} onValueChange={(value) => setFilters(prev => ({...prev, popularity: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="high">High (85+)</SelectItem>
                        <SelectItem value="low">Moderate (60-84)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters Summary */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Showing {processedDecisions.length} of {decisions.decisions.length} decisions</span>
                  {searchTerm && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      Search: {searchTerm}
                      <XCircle className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {Object.entries(filters).map(([key, value]) => {
                    if (value !== 'all') {
                      return (
                        <Badge key={key} variant="outline" className="flex items-center gap-1 capitalize">
                          {key}: {value.replace('-', ' ')}
                          <XCircle 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => setFilters(prev => ({...prev, [key]: 'all'}))} 
                          />
                        </Badge>
                      )
                    }
                    return null
                  })}
                  {(searchTerm || Object.values(filters).some(v => v !== 'all')) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('')
                        setFilters({
                          type: 'all',
                          urgency: 'all',
                          category: 'all',
                          complexity: 'all',
                          pricing: 'all',
                          popularity: 'all'
                        })
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Decisions List */}
            <div className="space-y-4">
              {Object.keys(groupedDecisions).length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="space-y-2">
                    <Settings className="w-8 h-8 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">No decisions found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or search terms to see tool recommendations.
                    </p>
                  </div>
                </Card>
              ) : (
                Object.entries(groupedDecisions).map(([groupName, decisions]) => (
                  <div key={groupName} className="space-y-4">
                    {groupBy !== 'none' && (
                      <div className="flex items-center gap-2 mt-6 mb-3">
                        <div className="h-px bg-border flex-1" />
                        <h3 className="text-sm font-medium text-muted-foreground px-3">
                          {groupName} ({decisions.length})
                        </h3>
                        <div className="h-px bg-border flex-1" />
                      </div>
                    )}
                    {decisions.map((decision) => {
                const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
                
                return (
                  <Card key={decision.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{decision.title}</h3>
                            <Badge className={getUrgencyColor(decision.urgency)}>
                              {decision.urgency}
                            </Badge>
                            <Badge variant="outline">
                              {decision.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{decision.description}</p>
                          <p className="text-sm text-blue-600">{decision.reasoning}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {decision.impact === 'high' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {decision.impact === 'medium' && <Info className="w-5 h-5 text-yellow-500" />}
                          {decision.impact === 'low' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decision.recommendations.map((tool) => {
                          const isSelected = selectedTools[decision.id] === tool.id
                          
                          return (
                            <Card 
                              key={tool.id}
                              className={`p-4 cursor-pointer transition-all duration-200 ${
                                isSelected 
                                  ? 'ring-2 ring-primary bg-primary/5' 
                                  : 'hover:shadow-md hover:border-primary/50'
                              }`}
                              onClick={() => handleToolSelection(decision.id, tool.id)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-sm">{tool.name}</h4>
                                      {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge className={getTypeColor(tool.type)} variant="secondary">
                                        {tool.type.replace('-', ' ')}
                                      </Badge>
                                      <span className={`text-xs font-medium ${getComplexityColor(tool.complexity)}`}>
                                        {tool.complexity}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs">{tool.popularity}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground">{tool.description}</p>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span>Cost:</span>
                                    <span className="font-medium">{tool.pricing.cost || 'Free'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Setup:</span>
                                    <span className="font-medium">{tool.integration.timeEstimate}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <div className="flex">
                                    {tool.pros.slice(0, 2).map((pro, i) => (
                                      <div key={i} className="flex items-center">
                                        <ThumbsUp className="w-3 h-3 text-green-500 mr-1" />
                                        <span className="text-xs text-green-600">{pro}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {tool.metadata.website && (
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="text-xs">Learn more</span>
                                    {tool.metadata.github && <Github className="w-3 h-3" />}
                                  </div>
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Implementation Roadmap
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Phase 1: Critical Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {decisions.integrationPlan.phase1.map((item, i) => (
                      <Badge key={i} variant="destructive">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Timeline: {decisions.architecture.timeline.mvp}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Phase 2: Recommended Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {decisions.integrationPlan.phase2.map((item, i) => (
                      <Badge key={i} variant="default">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Timeline: {decisions.architecture.timeline.production}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Phase 3: Optional Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {decisions.integrationPlan.phase3.map((item, i) => (
                      <Badge key={i} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Timeline: {decisions.architecture.timeline.scale}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                <Zap className="w-5 h-5" />
                Technical Risks
              </h3>
              <div className="space-y-2">
                {decisions.riskAssessment.technical.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.technical.length === 0 && (
                  <p className="text-sm text-muted-foreground">No significant technical risks identified.</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-600">
                <Users className="w-5 h-5" />
                Operational Risks
              </h3>
              <div className="space-y-2">
                {decisions.riskAssessment.operational.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.operational.length === 0 && (
                  <p className="text-sm text-muted-foreground">No significant operational risks identified.</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                <DollarSign className="w-5 h-5" />
                Financial Risks
              </h3>
              <div className="space-y-2">
                {decisions.riskAssessment.financial.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.financial.length === 0 && (
                  <p className="text-sm text-muted-foreground">No significant financial risks identified.</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <div className="space-y-6">
            {/* Compliance Framework Assessment */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Compliance Framework Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['SOC 2', 'HIPAA', 'PCI DSS', 'GDPR', 'ISO 27001', 'FedRAMP'].map((framework) => {
                  const isRequired = decisions.decisions.some(d => d.reasoning?.toLowerCase().includes(framework.toLowerCase()))
                  const hasCompliantTools = decisions.decisions.some(d => {
                    const tool = d.recommendations.find(r => r.id === d.selectedTool)
                    return tool?.type === 'managed-service' // Assumption: managed services are more compliant
                  })
                  
                  return (
                    <Card key={framework} className={cn(
                      "p-4 border-2",
                      isRequired ? "border-orange-200 bg-orange-50" : "border-gray-200"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{framework}</h4>
                        {isRequired ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCompliantTools ? (
                          <CheckSquare className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {hasCompliantTools ? 'Likely Compliant' : 'Needs Assessment'}
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </Card>

            {/* Security Best Practices */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Security Best Practices
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Implemented Practices</h4>
                  <div className="space-y-2">
                    {[
                      'End-to-end encryption in transit',
                      'Role-based access control (RBAC)',
                      'Automated security scanning',
                      'Multi-factor authentication',
                      'Network segmentation',
                      'Audit logging and monitoring'
                    ].map((practice, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-orange-700">Recommended Additions</h4>
                  <div className="space-y-2">
                    {[
                      'Zero-trust network architecture',
                      'Data loss prevention (DLP)',
                      'Regular penetration testing',
                      'Incident response automation',
                      'Backup encryption and testing',
                      'Vendor security assessments'
                    ].map((practice, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Vendor Management */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Vendor Management & Due Diligence
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Primary Vendors</h4>
                  <div className="space-y-3">
                    {Array.from(new Set(
                      decisions.decisions.map(d => {
                        const tool = d.recommendations.find(r => r.id === d.selectedTool)
                        return tool?.metadata.cloudProvider || tool?.name.split(' ')[0]
                      }).filter(Boolean)
                    )).slice(0, 5).map((vendor, i) => (
                      <Card key={i} className="p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{vendor}</span>
                          <Badge variant="outline">Enterprise</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due diligence recommended
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Due Diligence Checklist</h4>
                  <div className="space-y-2">
                    {[
                      'Security certifications (SOC 2, ISO 27001)',
                      'Data processing agreements (DPA)',
                      'Business continuity planning',
                      'Financial stability assessment',
                      'Reference customer interviews',
                      'SLA and support tier evaluation',
                      'Data residency and sovereignty',
                      'Exit strategy and data portability'
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Cost Optimization */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Cost Optimization Strategies
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700">Short-term (0-6 months)</h4>
                  <div className="space-y-2">
                    {[
                      'Right-size compute resources',
                      'Implement auto-scaling',
                      'Use reserved instances',
                      'Optimize data storage tiers'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700">Medium-term (6-18 months)</h4>
                  <div className="space-y-2">
                    {[
                      'Multi-cloud strategy',
                      'Containerization adoption',
                      'Serverless migration',
                      'Data archiving policies'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-purple-700">Long-term (18+ months)</h4>
                  <div className="space-y-2">
                    {[
                      'Edge computing adoption',
                      'AI/ML cost optimization',
                      'Green computing initiatives',
                      'Strategic vendor negotiations'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => onComplete(decisions ? { decisions, selectedTools } : undefined)} size="lg" className="px-8">
          Complete & Deploy
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}