"use client"

import React, { useState, useEffect, useRef } from "react"
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
  GitCompare,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react"

import { SystemDecisionsSummary, SystemDecision, ToolRecommendation } from '@/lib/types/system-decisions'
import { SystemArchitecture } from '@/lib/types/architecture'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useOnboardingData } from '@/lib/appContext/app-context'
import { loadDecisions } from "@/lib/appContext/storage-utils"
interface StepFiveProps {
  data: {
    projectName?: string
    description?: string
    schemas?: any[]
    analysis?: any
    endpoints?: any[]
    architecture?: SystemArchitecture
    decisions?: SystemDecisionsSummary
    selectedTools?: Record<string, string>
  }
  onComplete: (payload?: { decisions: SystemDecisionsSummary; selectedTools: Record<string, string> }) => void
  onBack: () => void
}

export function StepFive({ data, onComplete, onBack }: StepFiveProps) {
  const { data: onboardingData, updateData } = useOnboardingData()

  console.log(onboardingData, 'onboarding data in step five')

  // Initialize from props or onboarding data
  const [decisions, setDecisions] = useState<SystemDecisionsSummary | null>(
    loadDecisions().decisions || null
  )

  console.log(decisions, 'decisions state in step five')

  const [selectedTools, setSelectedTools] = useState<Record<string, string>>(
    data.selectedTools || onboardingData?.selectedTools || {}
  )

  const [isGenerating, setIsGenerating] = useState(!decisions)
  const [activeTab, setActiveTab] = useState("decisions")
  const [searchTerm, setSearchTerm] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [comparisonTools, setComparisonTools] = useState<string[]>([])
  const [filters, setFilters] = useState({
    type: 'all',
    urgency: 'critical',
    category: 'all',
    complexity: 'all',
    pricing: 'all',
    popularity: 'all'
  })
  const [showAllDecisions, setShowAllDecisions] = useState(false)
  const [expandedToolCards, setExpandedToolCards] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'cost' | 'complexity'>('popularity')
  const [groupBy, setGroupBy] = useState<'category' | 'component' | 'type' | 'none'>('category')

  // Gamification state
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0)
  const [completedDecisions, setCompletedDecisions] = useState<Set<string>>(new Set())
  const [achievements, setAchievements] = useState<string[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [monthlyBudget, setMonthlyBudget] = useState(5000)
  const [showCelebration, setShowCelebration] = useState(false)

  // Ref to preserve scroll position
  const scrollPositionRef = useRef<number>(0)
  const shouldRestoreScroll = useRef<boolean>(false)
  const hasGeneratedRef = useRef<boolean>(false)

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasGeneratedRef.current) {
      return
    }

    // If we already have decisions, don't generate again
    if (decisions) {
      hasGeneratedRef.current = true
      setIsGenerating(false)
      return
    }

    const generateDecisions = async () => {
      setIsGenerating(true)
      hasGeneratedRef.current = true

      try {
        if (!data.architecture) {
          throw new Error('Architecture data is required to generate system decisions')
        }

        // Make real HTTP request to AI-powered API endpoint
        const response = await fetch('/api/generate-system-decisions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            architecture: data.architecture,
            projectData: {
              projectName: data.projectName,
              description: data.description,
              schemas: data.schemas,
              endpoints: data.endpoints,
              analysis: data.analysis,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate system decisions')
        }

        const decisionsSummary: SystemDecisionsSummary = await response.json()

        // Strict validation - no fallback to mock data
        if (!decisionsSummary.decisions || decisionsSummary.decisions.length === 0) {
          throw new Error('AI did not generate any system decisions')
        }

        setDecisions(decisionsSummary)

        // Initialize selected tools with recommendations
        const initialSelections: Record<string, string> = {}
        decisionsSummary.decisions.forEach(decision => {
          initialSelections[decision.id] = decision.selectedTool
        })
        setSelectedTools(initialSelections)

        // Save to AppContext instead of localStorage
        await updateData({
          decisions: decisionsSummary,
          selectedTools: initialSelections
        })
      } catch (error) {
        console.error('Failed to generate system decisions:', error)
        setDecisions(null)
        hasGeneratedRef.current = false
        alert(
          `Failed to generate system decisions: ${error instanceof Error ? error.message : 'Unknown error'
          }. Please try again.`
        )
      } finally {
        setIsGenerating(false)
      }
    }

    generateDecisions()
  }, [])

  // Effect to restore scroll position after selection
  useEffect(() => {
    if (shouldRestoreScroll.current) {
      const targetScroll = scrollPositionRef.current

      window.scrollTo({ top: targetScroll, behavior: 'instant' })

      requestAnimationFrame(() => {
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      })

      setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      }, 0)

      shouldRestoreScroll.current = false
    }
  }, [selectedTools])

  const handleToolSelection = async (decisionId: string, toolId: string) => {
    setSelectedTools(prev => {
      const updated = {
        ...prev,
        [decisionId]: toolId
      }

      // Update AppContext asynchronously
      if (decisions) {
        updateData({
          decisions,
          selectedTools: updated
        })
      }

      return updated
    })
  }

  const calculateTotalMonthlyCost = () => {
    if (!decisions) return 0
    let total = 0
    Object.entries(selectedTools).forEach(([decisionId, toolId]) => {
      const decision = decisions.decisions.find(d => d.id === decisionId)
      const tool = decision?.recommendations.find(r => r.id === toolId)
      if (tool?.pricing.cost) {
        const costMatch = tool.pricing.cost.match(/\d+/)
        if (costMatch) {
          total += parseInt(costMatch[0])
        }
      }
    })
    return total
  }

  const calculateToolScore = (tool: ToolRecommendation) => {
    let score = 0
    score += tool.popularity * 0.4
    score += tool.complexity === 'low' ? 30 : tool.complexity === 'medium' ? 20 : 10
    score += tool.type === 'open-source' ? 20 : tool.type === 'freemium' ? 15 : 5
    return Math.round(score)
  }

  const handleGamifiedSelection = (decisionId: string, toolId: string) => {
    scrollPositionRef.current = window.scrollY
    shouldRestoreScroll.current = true

    const decision = decisions?.decisions.find(d => d.id === decisionId)
    const tool = decision?.recommendations.find(r => r.id === toolId)

    handleToolSelection(decisionId, toolId)

    if (tool) {
      const score = calculateToolScore(tool)

      setCompletedDecisions(prev => {
        const isNewDecision = !prev.has(decisionId)

        if (isNewDecision) {
          setTotalScore(current => current + score)

          const newAchievements = []
          if (tool.type === 'open-source' && !achievements.includes('open-source-advocate')) {
            newAchievements.push('open-source-advocate')
          }
          if (tool.complexity === 'low' && !achievements.includes('simplicity-seeker')) {
            newAchievements.push('simplicity-seeker')
          }
          if (prev.size + 1 === decisions?.decisions.length) {
            newAchievements.push('decision-master')
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 3000)
          }
          if (newAchievements.length > 0) {
            setAchievements(current => [...current, ...newAchievements])
          }

          return new Set([...prev, decisionId])
        }

        return prev
      })
    }
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
      case 'open-source': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
      case 'low': return 'text-blue-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
    }
  }

  const ProgressIndicator = () => (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex items-center gap-2.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`transition-all duration-300 rounded-full ${step < 5
              ? 'w-2.5 h-2.5 bg-[#005BE3]'
              : step === 5
                ? 'w-10 h-2.5 bg-[#005BE3]'
                : 'w-2.5 h-2.5 bg-[rgba(55,50,47,0.2)]'
              }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-[#605A57]">Step 5 of 5</span>
    </div>
  )

  const filteredAndSearchedDecisions = decisions?.decisions.filter(decision => {
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

    if (filters.category !== 'all' && decision.category !== filters.category) return false
    if (filters.urgency !== 'all' && decision.urgency !== filters.urgency) return false

    if (filters.type !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.type !== filters.type) return false
    }

    if (filters.complexity !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.complexity !== filters.complexity) return false
    }

    if (filters.pricing !== 'all') {
      const selectedTool = decision.recommendations.find(r => r.id === selectedTools[decision.id])
      if (selectedTool && selectedTool.pricing.model !== filters.pricing) return false
    }

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

  const processedDecisions = React.useMemo(() => {
    let processed = [...filteredAndSearchedDecisions]

    processed.sort((a, b) => {
      const toolA = a.recommendations[0]
      const toolB = b.recommendations[0]

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
  }, [filteredAndSearchedDecisions, sortBy])

  const groupedDecisions = React.useMemo(() => {
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
          const firstTool = decision.recommendations[0]
          groupKey = firstTool?.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
          break
        default:
          groupKey = 'All'
      }

      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(decision)
    })

    return groups
  }, [processedDecisions, groupBy])

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-6 space-y-6">

      {/* Header */}
      <div className="text-left space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#005BE3]/10 text-[#005BE3] text-xs font-medium mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Tool Selection
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-normal leading-[1.2] text-[#1d1d1f]">
              Enterprise Architecture Decisions
            </h1>
            <p className="text-sm text-[#605A57] max-w-3xl leading-relaxed">
              AI-powered tool selection and architecture recommendations for <span className="font-semibold text-[#1d1d1f]">{decisions.projectName}</span>.
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
              className="flex items-center gap-2 h-9 px-4 text-xs"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Tools
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-9 px-4 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#005BE3]/20 to-transparent"></div>
      </div>

      {/* Enterprise Context & Key Metrics - Monochrome */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Complexity</div>
            <div className="text-xl font-bold text-[#1d1d1f] capitalize">
              {decisions.architecture.complexity}
            </div>
          </div>
        </Card>

        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Monthly Cost</div>
            <div className="text-xl font-bold text-[#1d1d1f]">
              {decisions.architecture.estimatedCost.monthly}
            </div>
          </div>
        </Card>

        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">MVP Timeline</div>
            <div className="text-xl font-bold text-[#1d1d1f]">
              {decisions.architecture.timeline.mvp}
            </div>
          </div>
        </Card>

        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Settings className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Tool Decisions</div>
            <div className="text-xl font-bold text-[#1d1d1f]">
              {decisions.decisions.length}
            </div>
          </div>
        </Card>

        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Risk Items</div>
            <div className="text-xl font-bold text-[#1d1d1f]">
              {decisions.riskAssessment.technical.length + decisions.riskAssessment.operational.length + decisions.riskAssessment.financial.length}
            </div>
          </div>
        </Card>

        <Card className="group relative bg-gradient-to-br from-white to-gray-50 border border-[rgba(55,50,47,0.12)] p-4 text-center hover:border-[#1d1d1f]/20 hover:shadow-md transition-all">
          <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="w-6 h-6 text-[#1d1d1f]" />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#605A57] mb-1">Categories</div>
            <div className="text-xl font-bold text-[#1d1d1f]">
              {Object.keys(groupedDecisions).length}
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5 mb-6 h-auto p-1.5 bg-gray-100">
          <TabsTrigger value="decisions" className="flex items-center gap-2 text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="w-4 h-4" />
            Tool Selection
            {filteredAndSearchedDecisions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
                {filteredAndSearchedDecisions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4" />
            Implementation
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2 text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            Risks
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2 text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="w-4 h-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <DollarSign className="w-5 h-5 text-[#005BE3]" />
                Cost Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#605A57]">Development</span>
                  <span className="font-semibold text-base text-[#1d1d1f]">{decisions.architecture.estimatedCost.development}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#605A57]">Monthly Operational</span>
                  <span className="font-semibold text-base text-[#1d1d1f]">{decisions.architecture.estimatedCost.monthly}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#605A57]">Annual Operational</span>
                  <span className="font-semibold text-base text-[#1d1d1f]">{decisions.architecture.estimatedCost.annual}</span>
                </div>
                <Separator className="bg-[rgba(55,50,47,0.12)]" />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-sm text-[#1d1d1f]">Total First Year</span>
                  <span className="font-bold text-xl text-[#005BE3]">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(decisions.totalCostEstimate.development + decisions.totalCostEstimate.annualOperational)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <TrendingUp className="w-5 h-5 text-[#005BE3]" />
                Tool Distribution
              </h3>
              <div className="space-y-4">
                {['open-source', 'commercial', 'managed-service'].map(type => {
                  const count = decisions.decisions.filter(d => {
                    const tool = d.recommendations.find(r => r.id === selectedTools[d.id])
                    return tool?.type === type
                  }).length
                  const percentage = (count / decisions.decisions.length) * 100

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-[#1d1d1f] font-medium">{type.replace('-', ' ')}</span>
                        <span className="text-[#605A57]">{count} tools ({Math.round(percentage)}%)</span>
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
          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
              <Card className="p-8 max-w-md mx-4 text-center space-y-4 animate-in zoom-in duration-500">
                <CheckCircle className="w-16 h-16 text-[#005BE3] mx-auto" />
                <h3 className="text-2xl font-bold text-[#1d1d1f]">Architecture Complete!</h3>
                <p className="text-[#605A57]">You've successfully designed your entire tech stack.</p>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Badge className="text-base px-4 py-2 bg-[#005BE3] text-white">
                    {totalScore} Points
                  </Badge>
                </div>
              </Card>
            </div>
          )}

          <div className="space-y-6">
            {/* Gamification Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Progress Card */}
              <Card className="p-5 border border-[rgba(55,50,47,0.12)] bg-white shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1d1d1f]">Progress</span>
                    <CheckCircle className="w-5 h-5 text-[#005BE3]" />
                  </div>
                  <div className="text-3xl font-bold text-[#1d1d1f]">
                    {Math.round((completedDecisions.size / (decisions?.decisions.length || 1)) * 100)}%
                  </div>
                  <Progress
                    value={(completedDecisions.size / (decisions?.decisions.length || 1)) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-[#605A57]">
                    {completedDecisions.size} of {decisions?.decisions.length} decisions made
                  </p>
                </div>
              </Card>

              {/* Score Card */}
              <Card className="p-5 border border-[rgba(55,50,47,0.12)] bg-white shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1d1d1f]">Score</span>
                    <Star className="w-5 h-5 text-[#005BE3]" />
                  </div>
                  <div className="text-3xl font-bold text-[#1d1d1f]">
                    {totalScore}
                  </div>
                  <p className="text-xs text-[#605A57]">
                    Based on tool quality & fit
                  </p>
                </div>
              </Card>

              {/* Monthly Cost Card */}
              <Card className="p-5 border border-[rgba(55,50,47,0.12)] bg-white shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1d1d1f]">Monthly Cost</span>
                    <DollarSign className="w-5 h-5 text-[#005BE3]" />
                  </div>
                  <div className="text-3xl font-bold text-[#1d1d1f]">
                    ${calculateTotalMonthlyCost()}
                  </div>
                  <div className="space-y-1">
                    <Progress
                      value={(calculateTotalMonthlyCost() / monthlyBudget) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-[#605A57]">
                      Budget: ${monthlyBudget}/mo
                    </p>
                  </div>
                </div>
              </Card>

              {/* Achievements Card */}
              <Card className="p-5 border border-[rgba(55,50,47,0.12)] bg-white shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1d1d1f]">Achievements</span>
                    <Badge variant="secondary" className="text-xs">{achievements.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {achievements.includes('open-source-advocate') && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        Open Source
                      </Badge>
                    )}
                    {achievements.includes('simplicity-seeker') && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        Simplicity
                      </Badge>
                    )}
                    {achievements.includes('decision-master') && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        Complete
                      </Badge>
                    )}
                    {achievements.length === 0 && (
                      <p className="text-xs text-[#605A57]">Make selections to earn achievements</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Auto-Pilot Banner */}
            {completedDecisions.size === 0 && (
              <Card className="p-6 bg-gradient-to-r from-[#005BE3]/10 to-purple-50 border-2 border-[#005BE3]/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#005BE3]" />
                      <h3 className="text-lg font-bold text-[#1d1d1f]">AI Auto-Pilot Mode</h3>
                    </div>
                    <p className="text-sm text-[#605A57] max-w-2xl">
                      Let our AI select the best tools for your stack based on industry best practices. You can review and customize later.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!decisions) return
                      const recommendedSelections: Record<string, string> = {}
                      decisions.decisions.forEach(decision => {
                        recommendedSelections[decision.id] = decision.selectedTool
                        handleGamifiedSelection(decision.id, decision.selectedTool)
                      })

                      setSelectedTools(recommendedSelections)

                      // Update cache
                      localStorage.setItem('onboarding-decisions', JSON.stringify({
                        decisions,
                        selectedTools: recommendedSelections
                      }))

                      // Show success message
                      setTimeout(() => {
                        alert('AI has selected all recommended tools! Review below or continue to complete onboarding.')
                      }, 500)
                    }}
                    className="px-8 py-6 bg-[#005BE3] hover:bg-[#004CC2] gap-2 text-base font-semibold shadow-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Use AI Auto-Pilot
                  </Button>
                </div>
              </Card>
            )}

            {/* Quick Controls */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1.5">
                  <Settings className="w-4 h-4 mr-2" />
                  {filteredAndSearchedDecisions.length}/{decisions?.decisions.length || 0} Decisions
                </Badge>
                <Button
                  variant={filters.urgency === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (filters.urgency === 'critical') {
                      setFilters(prev => ({ ...prev, urgency: 'all' }))
                      setShowAllDecisions(true)
                    } else {
                      setFilters(prev => ({ ...prev, urgency: 'critical' }))
                      setShowAllDecisions(false)
                    }
                  }}
                  className="h-9 px-4 text-xs gap-2"
                >
                  {filters.urgency === 'critical' ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show All {decisions?.decisions.length || 0} Decisions
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Show Critical Only
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#605A57]" />
                  <Select value={filters.urgency} onValueChange={(value) => setFilters(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger className="w-36 h-9 text-xs border-[rgba(55,50,47,0.12)]">
                      <SelectValue placeholder="Filter by urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgency</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Monthly budget"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 5000)}
                  className="w-32 h-9 text-sm border-[rgba(55,50,47,0.12)]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      type: 'all',
                      urgency: 'all',
                      category: 'all',
                      complexity: 'all',
                      pricing: 'all',
                      popularity: 'all'
                    })
                  }}
                  className="h-9 px-3 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>

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
                        <Card key={decision.id} className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
                          <div className="space-y-5">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-semibold text-[#1d1d1f]">{decision.title}</h3>
                                  <Badge className={`${getUrgencyColor(decision.urgency)} text-xs h-5 px-2`}>
                                    {decision.urgency}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs h-5 px-2 border-[rgba(55,50,47,0.12)]">
                                    {decision.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-[#605A57] leading-relaxed">{decision.description}</p>
                                <p className="text-sm text-[#005BE3] font-medium">{decision.reasoning}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {decision.impact === 'high' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                {decision.impact === 'medium' && <Info className="w-5 h-5 text-yellow-500" />}
                                {decision.impact === 'low' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {decision.recommendations.map((tool) => {
                                const isSelected = selectedTools[decision.id] === tool.id
                                const isRecommended = tool.id === decision.selectedTool
                                const isExpanded = expandedToolCards.has(`${decision.id}-${tool.id}`)

                                return (
                                  <Card
                                    key={tool.id}
                                    className={`relative p-4 cursor-pointer transition-all duration-300 border group ${isSelected
                                      ? 'ring-2 ring-[#005BE3] border-[#005BE3] bg-gradient-to-br from-[#005BE3]/10 to-[#005BE3]/5 shadow-lg'
                                      : isRecommended
                                        ? 'border-[#005BE3]/30 bg-[#005BE3]/5 hover:shadow-lg hover:border-[#005BE3]/50'
                                        : 'border-[rgba(55,50,47,0.12)] hover:shadow-md hover:border-[rgba(55,50,47,0.2)]'
                                      }`}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      if (!isSelected) {
                                        handleGamifiedSelection(decision.id, tool.id)
                                      }
                                    }}
                                  >
                                    {/* Selection Checkmark */}
                                    {isSelected && (
                                      <div className="absolute -top-2 -left-2 z-10">
                                        <div className="w-8 h-8 rounded-full bg-[#005BE3] flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                          <CheckCircle className="w-5 h-5 text-white fill-[#005BE3]" />
                                        </div>
                                      </div>
                                    )}

                                    {/* Recommended Badge */}
                                    {!isSelected && isRecommended && (
                                      <div className="absolute -top-2 -right-2 z-10">
                                        <Badge className="bg-[#005BE3] text-white text-[10px] h-6 px-2 shadow-md">
                                          <Sparkles className="w-2.5 h-2.5 mr-1" />
                                          Recommended
                                        </Badge>
                                      </div>
                                    )}

                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="space-y-1.5 flex-1">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-[#1d1d1f] group-hover:text-[#005BE3] transition-colors">{tool.name}</h4>
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge className={`${getTypeColor(tool.type)} text-[10px] h-5 px-2 font-medium`} variant="secondary">
                                              {tool.type.replace('-', ' ')}
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] h-5 px-2 border ${getComplexityColor(tool.complexity)}`}>
                                              {tool.complexity} complexity
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs font-bold text-[#1d1d1f]">{tool.popularity}</span>
                                          </div>
                                          <span className="text-[9px] text-[#605A57]">rating</span>
                                        </div>
                                      </div>

                                      <p className="text-xs text-[#605A57] leading-relaxed line-clamp-2">{tool.description}</p>

                                      {/* Compact Cost & Setup */}
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <DollarSign className="w-3.5 h-3.5 text-[#005BE3]" />
                                          <span className="font-bold text-[#1d1d1f]">{tool.pricing.cost || 'Free'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-[#605A57]" />
                                          <span className="font-medium text-[#605A57]">{tool.integration.timeEstimate}</span>
                                        </div>
                                      </div>

                                      {/* Progressive Disclosure - Show details button */}
                                      {!isExpanded ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full h-8 text-xs text-[#005BE3] hover:text-[#004CC2] hover:bg-[#005BE3]/5"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedToolCards(prev => new Set(prev).add(`${decision.id}-${tool.id}`))
                                          }}
                                        >
                                          View Details
                                        </Button>
                                      ) : (
                                        <>
                                          <div className="flex flex-col gap-1.5">
                                            {tool.pros.slice(0, 2).map((pro, i) => (
                                              <div key={i} className="flex items-center gap-1.5">
                                                <ThumbsUp className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                <span className="text-xs text-blue-700">{pro}</span>
                                              </div>
                                            ))}
                                          </div>

                                          {tool.metadata.website && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(55,50,47,0.08)] text-[#605A57] hover:text-[#005BE3] transition-colors">
                                              <ExternalLink className="w-3 h-3" />
                                              <span className="text-xs font-medium">Learn more</span>
                                              {tool.metadata.github && <Github className="w-3 h-3" />}
                                            </div>
                                          )}

                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-8 text-xs text-[#605A57] hover:text-[#1d1d1f]"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setExpandedToolCards(prev => {
                                                const updated = new Set(prev)
                                                updated.delete(`${decision.id}-${tool.id}`)
                                                return updated
                                              })
                                            }}
                                          >
                                            Hide Details
                                          </Button>
                                        </>
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

            {/* Cost Summary & Recommendations */}
            {completedDecisions.size > 0 && (
              <Card className="p-6 border border-[rgba(55,50,47,0.12)] bg-white shadow-sm">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-[#005BE3]" />
                      Stack Summary
                    </h3>
                    <Badge className="bg-[#005BE3] text-white px-4 py-2 text-base">
                      {totalScore} Points
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Monthly Cost */}
                    <div className="bg-white rounded-lg p-4 border border-[rgba(55,50,47,0.12)] shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-[#005BE3]" />
                        <span className="text-sm font-medium text-[#605A57]">Monthly Cost</span>
                      </div>
                      <div className="text-2xl font-bold text-[#1d1d1f]">
                        ${calculateTotalMonthlyCost()}
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#605A57]">Budget usage</span>
                          <span className="font-medium text-[#1d1d1f]">
                            {Math.round((calculateTotalMonthlyCost() / monthlyBudget) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={(calculateTotalMonthlyCost() / monthlyBudget) * 100}
                          className="h-2"
                        />
                      </div>
                      {calculateTotalMonthlyCost() > monthlyBudget && (
                        <div className="mt-2 flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-xs font-medium">Over budget</span>
                        </div>
                      )}
                    </div>

                    {/* Tool Breakdown */}
                    <div className="bg-white rounded-lg p-4 border border-[rgba(55,50,47,0.12)] shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-[#005BE3]" />
                        <span className="text-sm font-medium text-[#605A57]">Tool Mix</span>
                      </div>
                      <div className="space-y-2">
                        {['open-source', 'commercial', 'managed-service'].map(type => {
                          const count = Object.entries(selectedTools).filter(([decisionId, toolId]) => {
                            const decision = decisions?.decisions.find(d => d.id === decisionId)
                            const tool = decision?.recommendations.find(r => r.id === toolId)
                            return tool?.type === type
                          }).length
                          if (count === 0) return null
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-xs capitalize text-[#605A57]">{type.replace('-', ' ')}</span>
                              <span className="text-sm font-bold text-[#1d1d1f]">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="bg-white rounded-lg p-4 border border-[rgba(55,50,47,0.12)] shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-[#005BE3]" />
                        <span className="text-sm font-medium text-[#605A57]">Performance</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#605A57]">Avg. Complexity</span>
                          <Badge variant="outline" className="text-xs">
                            {(() => {
                              const complexities = Object.entries(selectedTools).map(([decisionId, toolId]) => {
                                const decision = decisions?.decisions.find(d => d.id === decisionId)
                                const tool = decision?.recommendations.find(r => r.id === toolId)
                                return tool?.complexity === 'low' ? 1 : tool?.complexity === 'medium' ? 2 : 3
                              })
                              const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length
                              return avg < 1.5 ? 'Low' : avg < 2.5 ? 'Medium' : 'High'
                            })()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#605A57]">Avg. Rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold text-[#1d1d1f]">
                              {(() => {
                                const ratings = Object.entries(selectedTools).map(([decisionId, toolId]) => {
                                  const decision = decisions?.decisions.find(d => d.id === decisionId)
                                  const tool = decision?.recommendations.find(r => r.id === toolId)
                                  return tool?.popularity || 0
                                })
                                return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements Unlocked */}
                  {achievements.length > 0 && (
                    <div className="bg-[#fafafa] p-4 rounded-lg border border-[rgba(55,50,47,0.12)]">
                      <h4 className="text-sm font-semibold text-[#1d1d1f] mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#005BE3]" />
                        Achievements Unlocked
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {achievements.includes('open-source-advocate') && (
                          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium">
                            Open Source Advocate
                          </Badge>
                        )}
                        {achievements.includes('simplicity-seeker') && (
                          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium">
                            Simplicity Seeker
                          </Badge>
                        )}
                        {achievements.includes('decision-master') && (
                          <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium">
                            Decision Master
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="space-y-6">
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <Calendar className="w-5 h-5 text-[#005BE3]" />
                Implementation Roadmap
              </h3>
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <h4 className="font-semibold text-sm text-red-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Phase 1: Critical Components
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {decisions.integrationPlan.phase1.map((item, i) => (
                      <Badge key={i} variant="destructive" className="text-xs h-6 px-2.5">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-red-600 font-medium">
                    Timeline: {decisions.architecture.timeline.mvp}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                  <h4 className="font-semibold text-sm text-yellow-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Phase 2: Recommended Components
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {decisions.integrationPlan.phase2.map((item, i) => (
                      <Badge key={i} className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-6 px-2.5">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Timeline: {decisions.architecture.timeline.production}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h4 className="font-semibold text-sm text-blue-700 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Phase 3: Optional Components
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {decisions.integrationPlan.phase3.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs h-6 px-2.5">{item}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">
                    Timeline: {decisions.architecture.timeline.scale}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-red-600">
                <Zap className="w-5 h-5" />
                Technical Risks
              </h3>
              <div className="space-y-3">
                {decisions.riskAssessment.technical.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#1d1d1f] leading-relaxed">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.technical.length === 0 && (
                  <p className="text-sm text-[#605A57] text-center py-4">No significant technical risks identified.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-yellow-600">
                <Users className="w-5 h-5" />
                Operational Risks
              </h3>
              <div className="space-y-3">
                {decisions.riskAssessment.operational.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#1d1d1f] leading-relaxed">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.operational.length === 0 && (
                  <p className="text-sm text-[#605A57] text-center py-4">No significant operational risks identified.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-orange-600">
                <DollarSign className="w-5 h-5" />
                Financial Risks
              </h3>
              <div className="space-y-3">
                {decisions.riskAssessment.financial.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#1d1d1f] leading-relaxed">{risk}</span>
                  </div>
                ))}
                {decisions.riskAssessment.financial.length === 0 && (
                  <p className="text-sm text-[#605A57] text-center py-4">No significant financial risks identified.</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            {/* Compliance Framework Assessment */}
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <Shield className="w-5 h-5 text-[#005BE3]" />
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
                          <CheckSquare className="w-4 h-4 text-blue-500" />
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
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <Lock className="w-5 h-5 text-[#005BE3]" />
                Security Best Practices
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-4 text-[#005BE3]">Implemented Practices</h4>
                  <div className="space-y-2.5">
                    {[
                      'End-to-end encryption in transit',
                      'Role-based access control (RBAC)',
                      'Automated security scanning',
                      'Multi-factor authentication',
                      'Network segmentation',
                      'Audit logging and monitoring'
                    ].map((practice, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckSquare className="w-4 h-4 text-[#005BE3] flex-shrink-0" />
                        <span className="text-sm text-[#525252]">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-4 text-orange-600">Recommended Additions</h4>
                  <div className="space-y-2.5">
                    {[
                      'Zero-trust network architecture',
                      'Data loss prevention (DLP)',
                      'Regular penetration testing',
                      'Incident response automation',
                      'Backup encryption and testing',
                      'Vendor security assessments'
                    ].map((practice, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-[#525252]">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Vendor Management */}
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <Building2 className="w-5 h-5 text-purple-600" />
                Vendor Management & Due Diligence
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-4 text-[#1d1d1f]">Primary Vendors</h4>
                  <div className="space-y-3">
                    {Array.from(new Set(
                      decisions.decisions.map(d => {
                        const tool = d.recommendations.find(r => r.id === d.selectedTool)
                        return tool?.metadata.cloudProvider || tool?.name.split(' ')[0]
                      }).filter(Boolean)
                    )).slice(0, 5).map((vendor, i) => (
                      <Card key={i} className="p-3.5 bg-[#fafafa] border-[rgba(55,50,47,0.08)]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#1d1d1f]">{vendor}</span>
                          <Badge variant="outline" className="text-xs">Enterprise</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] mt-1.5">
                          Due diligence recommended
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-4 text-[#1d1d1f]">Due Diligence Checklist</h4>
                  <div className="space-y-2.5">
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
                      <div key={i} className="flex items-start gap-3">
                        <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#525252] leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Cost Optimization */}
            <Card className="p-6 border-[rgba(55,50,47,0.12)] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-[#1d1d1f]">
                <TrendingUp className="w-5 h-5 text-[#005BE3]" />
                Cost Optimization Strategies
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="space-y-3.5">
                  <h4 className="text-sm font-semibold text-[#005BE3]">Short-term (0-6 months)</h4>
                  <div className="space-y-2.5">
                    {[
                      'Right-size compute resources',
                      'Implement auto-scaling',
                      'Use reserved instances',
                      'Optimize data storage tiers'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Target className="w-4 h-4 text-[#005BE3] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#525252]">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3.5">
                  <h4 className="text-sm font-semibold text-blue-600">Medium-term (6-18 months)</h4>
                  <div className="space-y-2.5">
                    {[
                      'Multi-cloud strategy',
                      'Containerization adoption',
                      'Serverless migration',
                      'Data archiving policies'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#525252]">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3.5">
                  <h4 className="text-sm font-semibold text-purple-600">Long-term (18+ months)</h4>
                  <div className="space-y-2.5">
                    {[
                      'Edge computing adoption',
                      'AI/ML cost optimization',
                      'Green computing initiatives',
                      'Strategic vendor negotiations'
                    ].map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Star className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#525252]">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[rgba(55,50,47,0.08)] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-[#605A57]">
              <div className="font-medium text-[#1d1d1f]">{completedDecisions.size} of {decisions?.decisions.length || 0} decisions made</div>
              <div>Monthly cost: ${calculateTotalMonthlyCost()}</div>
            </div>
            <Button
              onClick={() => onComplete(decisions ? { decisions, selectedTools } : undefined)}
              size="lg"
              disabled={completedDecisions.size === 0}
              className="px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all hover:scale-105 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalize Architecture ({completedDecisions.size}/{decisions?.decisions.length || 0})
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden under sticky button */}
      <div className="h-24"></div>
    </div>
  )
}