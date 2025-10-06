"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, Database, Table, Key, Link, Eye, EyeOff, Edit3, Check, Lightbulb, Zap, TrendingUp, Shield, Clock, Users, BarChart, CloudLightning, Cpu, HardDrive, Globe, Star, Lock, Settings, FileText, Layers, AlertTriangle } from "lucide-react"

interface StepTwoProps {
  data: any
  onComplete: () => void
  onBack: () => void
}

export function StepTwo({ data, onComplete, onBack }: StepTwoProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showRelationships, setShowRelationships] = useState(true)
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState(data.database)
  const [expandedSection, setExpandedSection] = useState<string | null>('database')

  const getFieldIcon = (field: any) => {
    if (field.primary) return <Key className="h-3 w-3 text-amber-600" />
    if (field.foreign) return <Link className="h-3 w-3 text-blue-600" />
    return <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
  }

  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'uuid': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'varchar': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'text': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'integer': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'bigint': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'decimal': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      'boolean': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'timestamp': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'timestamptz': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'json': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      'jsonb': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      'enum': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
    }
    return colors[type.toLowerCase()] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }

  const getRelationships = () => {
    const relationships: Array<{from: string, to: string, field: string}> = []
    data.schemas.forEach((schema: any) => {
      schema.fields.forEach((field: any) => {
        if (field.foreign) {
          const [targetTable] = field.foreign.split('.')
          relationships.push({
            from: schema.name,
            to: targetTable,
            field: field.name
          })
        }
      })
    })
    return relationships
  }

  // Use AI-generated analysis or fallback to simple detection
  const getAnalysis = () => {
    if (data.analysis?.success) {
      console.log('Step Two Analysis Data:', data.analysis)
      return data.analysis
    }
    
    // Fallback for backward compatibility
    return {
      useCase: { key: 'generic', label: 'General Application', features: [], complexity: 'simple' },
      databaseRecommendations: [
        {
          name: 'PostgreSQL',
          score: 95,
          reasons: ['Excellent ACID compliance', 'Advanced indexing'],
          bestFor: 'Complex applications with relationships',
          pros: ['ACID compliant', 'Advanced features'],
          cons: ['Higher memory usage'],
          whyForUseCase: ['Great for relational data', 'Supports complex queries']
        }
      ],
      scalingInsights: {
        expectedLoad: 'Medium' as const,
        readWriteRatio: '70:30',
        cachingStrategy: 'Application-level',
        indexingPriority: []
      },
      smartRecommendations: [],
      optimizationSuggestions: [],
      securityRecommendations: []
    }
  }

  // Get icon for optimization type
  const getOptimizationIcon = (type: string) => {
    const icons: Record<string, any> = {
      indexing: Zap,
      caching: CloudLightning,
      monitoring: Eye,
      backup: Shield,
      performance: BarChart,
      infrastructure: Cpu,
      security: Lock,
      maintenance: HardDrive,
    }
    return icons[type] || Zap
  }

  // Get icon for security category
  const getSecurityIcon = (category: string) => {
    const icons: Record<string, any> = {
      authentication: Shield,
      authorization: Key,
      data: Lock,
      infrastructure: Users,
    }
    return icons[category] || Shield
  }

  // Get icon for smart recommendation type  
  const getRecommendationIcon = (type: string) => {
    const icons: Record<string, any> = {
      architecture: Lightbulb,
      performance: BarChart,
      security: Shield,
      scalability: TrendingUp,
    }
    return icons[type] || Lightbulb
  }

  const relationships = getRelationships()
  const analysis = getAnalysis()
  
  // Data should now come in the exact format we need from focused APIs
  const dbRecommendations = (analysis.databaseRecommendations || []).sort((a: any, b: any) => b.score - a.score)
  const scalingInsights = analysis.scalingInsights || { expectedLoad: 'Medium' as const, readWriteRatio: '70:30', cachingStrategy: 'Application-level', indexingPriority: [] }
  const smartRecs = analysis.smartRecommendations || []
  const optimizations = analysis.optimizationSuggestions || []
  const securityRecs = analysis.securityRecommendations || []
  const complexity = analysis.useCase?.complexity || 'simple'

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-12">
      {/* Hero Title with Animated Stats */}
      <div className="text-center space-y-4 max-w-[900px] mx-auto mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#107a4d]/10 text-[#107a4d] text-xs font-medium mb-2">
          <Check className="w-3 h-3" />
          Schema Generated
        </div>
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Your enterprise database architecture
        </h1>
        <div className="flex items-center justify-center gap-6 text-sm text-[#605A57]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#107a4d] animate-pulse"></div>
            <span>{data.schemas.length} tables</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#107a4d] animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <span>{relationships.length} relationships</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-[#605A57]/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#107a4d] animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <span>{data.schemas.reduce((acc: number, schema: any) => acc + schema.fields.length, 0)} fields</span>
          </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#107a4d]/20 to-transparent"></div>
      </div>

      {/* Key Stats - Superior Interactive Cards */}
      <div className="grid grid-cols-3 gap-6 max-w-[900px] mx-auto">
        {/* Recommended Database */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'database' ? null : 'database')}
          className={`group relative p-6 rounded-xl transition-all duration-300 overflow-hidden ${
            expandedSection === 'database'
              ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl shadow-[#107a4d]/15 scale-[1.02] border-2 border-[#107a4d]/30'
              : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
          }`}
        >
          {/* Subtle pattern overlay */}
          <div className={`absolute inset-0 opacity-[0.03] ${
            expandedSection === 'database' ? 'bg-[radial-gradient(circle_at_30%_50%,_#107a4d_1px,_transparent_1px)] bg-[length:20px_20px]' : ''
          }`}></div>
          
          <div className="relative">
            <div className="flex items-center justify-center mb-3">
              <Database className={`w-6 h-6 ${expandedSection === 'database' ? 'text-[#107a4d]' : 'text-[#107a4d]'}`} />
            </div>
            <div className={`text-2xl font-bold mb-2 ${expandedSection === 'database' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'}`}>
              {dbRecommendations[0]?.name || 'PostgreSQL'}
            </div>
            <div className={`text-xs mb-2 ${expandedSection === 'database' ? 'text-[#605A57]' : 'text-[#605A57]'}`}>
              Recommended Database
            </div>
            {/* Progress indicator */}
            <div className="mt-3">
              <div className={`h-1.5 rounded-full overflow-hidden ${expandedSection === 'database' ? 'bg-[#107a4d]/15' : 'bg-[#107a4d]/10'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${expandedSection === 'database' ? 'bg-[#107a4d]' : 'bg-[#107a4d]'}`}
                  style={{ width: `${dbRecommendations[0]?.score || 95}%` }}
                ></div>
              </div>
              <div className={`text-[10px] font-semibold mt-1 ${expandedSection === 'database' ? 'text-[#107a4d]' : 'text-[#107a4d]'}`}>
                {dbRecommendations[0]?.score || 95}% compatibility
              </div>
            </div>
          </div>
        </button>
        
        {/* Complexity */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'complexity' ? null : 'complexity')}
          className={`group relative p-6 rounded-xl transition-all duration-300 overflow-hidden ${
            expandedSection === 'complexity'
              ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl shadow-[#107a4d]/15 scale-[1.02] border-2 border-[#107a4d]/30'
              : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
          }`}
        >
          <div className={`absolute inset-0 opacity-[0.03] ${
            expandedSection === 'complexity' ? 'bg-[radial-gradient(circle_at_30%_50%,_#107a4d_1px,_transparent_1px)] bg-[length:20px_20px]' : ''
          }`}></div>
          
          <div className="relative">
            <div className="flex items-center justify-center mb-3">
              <Layers className={`w-6 h-6 ${expandedSection === 'complexity' ? 'text-[#107a4d]' : 'text-[#107a4d]'}`} />
            </div>
            <div className={`text-2xl font-bold capitalize mb-2 ${expandedSection === 'complexity' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'}`}>
              {complexity}
            </div>
            <div className={`text-xs ${expandedSection === 'complexity' ? 'text-[#605A57]' : 'text-[#605A57]'}`}>
              Project Complexity
            </div>
            <div className={`mt-3 flex items-center gap-1 text-[10px] font-semibold ${
              expandedSection === 'complexity' ? 'text-[#107a4d]' : 'text-[#107a4d]'
            }`}>
              <span>{data.schemas.length} tables</span>
              <span className="opacity-50">•</span>
              <span>{relationships.length} relations</span>
            </div>
          </div>
        </button>
        
        {/* Expected Load */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'load' ? null : 'load')}
          className={`group relative p-6 rounded-xl transition-all duration-300 overflow-hidden ${
            expandedSection === 'load'
              ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl shadow-[#107a4d]/15 scale-[1.02] border-2 border-[#107a4d]/30'
              : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
          }`}
        >
          <div className={`absolute inset-0 opacity-[0.03] ${
            expandedSection === 'load' ? 'bg-[radial-gradient(circle_at_30%_50%,_#107a4d_1px,_transparent_1px)] bg-[length:20px_20px]' : ''
          }`}></div>
          
          <div className="relative">
            <div className="flex items-center justify-center mb-3">
              <TrendingUp className={`w-6 h-6 ${expandedSection === 'load' ? 'text-[#107a4d]' : 'text-[#107a4d]'}`} />
            </div>
            <div className={`text-2xl font-bold mb-2 ${expandedSection === 'load' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'}`}>
              {scalingInsights.expectedLoad || 'Medium'}
            </div>
            <div className={`text-xs ${expandedSection === 'load' ? 'text-[#605A57]' : 'text-[#605A57]'}`}>
              Expected Load
            </div>
            <div className={`mt-3 text-[10px] font-semibold ${
              expandedSection === 'load' ? 'text-[#107a4d]' : 'text-[#107a4d]'
            }`}>
              {scalingInsights.readWriteRatio || '70:30'} read/write
            </div>
          </div>
        </button>
      </div>
      
      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#107a4d]/20 to-transparent"></div>
      </div>

      {/* Schema Tables - Superior Grid */}
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-base font-semibold text-[#1d1d1f]">Database Tables</h2>
          <p className="text-xs text-[#605A57]">Click any table to explore all fields</p>
        </div>
        
        {/* Table Cards - Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.schemas.map((schema: any, index: number) => (
            <button 
              key={index} 
              onClick={() => setSelectedTable(selectedTable === schema.name ? null : schema.name)}
              className={`group relative p-5 rounded-xl transition-all duration-300 text-left overflow-hidden ${
                selectedTable === schema.name
                  ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl shadow-[#107a4d]/10 scale-[1.02] border-2 border-[#107a4d]/30'
                  : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg hover:scale-[1.01]'
              }`}
            >
              {/* Subtle pattern overlay */}
              <div className={`absolute inset-0 opacity-[0.03] ${
                selectedTable === schema.name ? 'bg-[radial-gradient(circle_at_30%_50%,_#107a4d_1px,_transparent_1px)] bg-[length:15px_15px]' : ''
              }`}></div>
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      selectedTable === schema.name ? 'bg-[#107a4d]/15' : 'bg-[#107a4d]/10'
                    }`}>
                      <Table className={`w-3.5 h-3.5 ${
                        selectedTable === schema.name ? 'text-[#107a4d]' : 'text-[#107a4d]'
                      }`} />
                    </div>
                    <h4 className={`font-semibold text-sm capitalize ${
                      selectedTable === schema.name ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
                    }`}>
                      {schema.name}
                    </h4>
                  </div>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTable === schema.name ? 'bg-[#107a4d]/15 text-[#107a4d]' : 'bg-[#107a4d]/10 text-[#107a4d]'
                  }`}>
                    {schema.fields.length} fields
                  </div>
                </div>
                
                <div className="space-y-1">
                  {(selectedTable === schema.name ? schema.fields : schema.fields.slice(0, 3)).map((field: any, fieldIndex: number) => (
                    <div 
                      key={fieldIndex} 
                      className="flex items-center gap-2 text-xs py-1"
                    >
                      <div>
                        {getFieldIcon(field)}
                      </div>
                      <span className="flex-1 text-[#37322F]">
                        {field.name}
                      </span>
                      <span className="text-[#605A57]">
                        {field.type}
                      </span>
                    </div>
                  ))}
                  {schema.fields.length > 3 && selectedTable !== schema.name && (
                    <div className="text-xs text-[#605A57] pt-1 font-medium">+{schema.fields.length - 3} more fields</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#107a4d]/20 to-transparent"></div>
      </div>

      {/* Architecture Insights - Enterprise Focus */}
      <div className="max-w-[1000px] mx-auto mt-16">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-base font-semibold text-[#1d1d1f]">Architecture Insights</h2>
          <p className="text-xs text-[#605A57]">Click any card to view detailed insights</p>
        </div>
        
        <div className="space-y-5">
        {/* Database Recommendation Details - Conditionally shown */}
        {expandedSection === 'database' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white border border-[#107a4d]/20 rounded-lg p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Database Selection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#605A57] mb-2">Recommended: <span className="font-semibold text-[#1d1d1f]">{dbRecommendations[0]?.name || 'PostgreSQL'}</span></p>
              <p className="text-xs text-[#605A57] leading-relaxed">{dbRecommendations[0]?.bestFor || 'Excellent for complex relational data with ACID compliance'}</p>
              <div className="mt-3 space-y-1">
                {(dbRecommendations[0]?.pros || ['ACID compliance', 'Advanced indexing', 'JSON support']).slice(0, 3).map((pro: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#605A57]">
                    <Check className="w-3 h-3 text-[#107a4d]" />
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-[#605A57] uppercase tracking-wide mb-1">Read/Write Pattern</p>
                <p className="text-sm text-[#1d1d1f] font-medium">{scalingInsights.readWriteRatio || '70:30'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#605A57] uppercase tracking-wide mb-1">Caching Strategy</p>
                <p className="text-sm text-[#1d1d1f] font-medium">{scalingInsights.cachingStrategy || 'Application-level'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#605A57] uppercase tracking-wide mb-1">Scaling Approach</p>
                <p className="text-sm text-[#1d1d1f] font-medium">Horizontal with read replicas</p>
              </div>
            </div>
          </div>
        </div>
        </div>
        )}

        {/* Complexity Analysis Details - Conditionally shown */}
        {expandedSection === 'complexity' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white border border-[#107a4d]/20 rounded-lg p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Complexity Analysis</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#605A57] mb-2">Your project is classified as <span className="font-semibold text-[#1d1d1f] capitalize">{complexity}</span> complexity</p>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-xs text-[#605A57]">
                  <Check className="w-3 h-3 text-[#107a4d]" />
                  <span>{data.schemas.length} interconnected tables</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#605A57]">
                  <Check className="w-3 h-3 text-[#107a4d]" />
                  <span>{relationships.length} foreign key relationships</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#605A57]">
                  <Check className="w-3 h-3 text-[#107a4d]" />
                  <span>Enterprise-grade schema design</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        )}

        {/* Scaling Strategy - Conditionally shown */}
        {expandedSection === 'load' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white border border-[#107a4d]/20 rounded-lg p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Scaling Strategy for {scalingInsights.expectedLoad} Load</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[#605A57] uppercase tracking-wide mb-2">Read/Write Pattern</p>
              <p className="text-sm text-[#1d1d1f] font-medium mb-2">{scalingInsights.readWriteRatio || '70:30'}</p>
              <p className="text-xs text-[#605A57]">Optimized for read-heavy workloads with caching</p>
            </div>
            <div>
              <p className="text-[10px] text-[#605A57] uppercase tracking-wide mb-2">Caching Strategy</p>
              <p className="text-sm text-[#1d1d1f] font-medium mb-2">{scalingInsights.cachingStrategy || 'Application-level'}</p>
              <p className="text-xs text-[#605A57]">Redis recommended for session and query caching</p>
            </div>
          </div>
        </div>
        </div>
        )}

        {/* Key Relationships - Now Interactive */}
        {relationships.length > 0 && (
          <button 
            onClick={() => setExpandedSection(expandedSection === 'relationships' ? null : 'relationships')}
            className={`w-full text-left rounded-lg p-6 transition-all duration-300 ${
              expandedSection === 'relationships'
                ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl border-2 border-[#107a4d]/30'
                : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  expandedSection === 'relationships' ? 'bg-[#107a4d]/15' : 'bg-[#107a4d]/10'
                }`}>
                  <Link className={`w-4 h-4 ${
                    expandedSection === 'relationships' ? 'text-[#107a4d]' : 'text-[#107a4d]'
                  }`} />
                </div>
                <h3 className={`text-sm font-semibold ${
                  expandedSection === 'relationships' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
                }`}>
                  Key Relationships ({relationships.length})
                </h3>
              </div>
              <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                expandedSection === 'relationships' ? 'bg-[#107a4d]/15 text-[#107a4d]' : 'bg-[#107a4d]/10 text-[#107a4d]'
              }`}>
                {expandedSection === 'relationships' ? 'Click to collapse' : 'Click to expand'}
              </div>
            </div>
            
            {expandedSection === 'relationships' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {relationships.map((rel, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-2 border-b border-[#107a4d]/10 last:border-0">
                    <span className="text-[#1d1d1f] font-medium">{rel.from}</span>
                    <ArrowRight className="w-3 h-3 text-[#605A57]" />
                    <span className="text-[#605A57]">{rel.field}</span>
                    <ArrowRight className="w-3 h-3 text-[#605A57]" />
                    <span className="text-[#1d1d1f] font-medium">{rel.to}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {relationships.slice(0, 3).map((rel, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-2 border-b border-[rgba(55,50,47,0.04)] last:border-0">
                    <span className="text-[#37322F] font-medium">{rel.from}</span>
                    <ArrowRight className="w-3 h-3 text-[#605A57]" />
                    <span className="text-[#605A57]">{rel.field}</span>
                    <ArrowRight className="w-3 h-3 text-[#605A57]" />
                    <span className="text-[#37322F] font-medium">{rel.to}</span>
                  </div>
                ))}
                {relationships.length > 3 && (
                  <p className="text-xs text-[#605A57] pt-2">+{relationships.length - 3} more relationships</p>
                )}
              </div>
            )}
          </button>
        )}

        {/* Critical Recommendations - Now Interactive */}
        {(smartRecs.length > 0 || securityRecs.length > 0 || optimizations.length > 0) && (
          <button
            onClick={() => setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')}
            className={`w-full text-left rounded-lg p-6 transition-all duration-300 ${
              expandedSection === 'recommendations'
                ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl border-2 border-[#107a4d]/30'
                : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  expandedSection === 'recommendations' ? 'bg-[#107a4d]/15' : 'bg-[#107a4d]/10'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    expandedSection === 'recommendations' ? 'text-[#107a4d]' : 'text-[#107a4d]'
                  }`} />
                </div>
                <h3 className={`text-sm font-semibold ${
                  expandedSection === 'recommendations' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
                }`}>
                  Critical Recommendations
                </h3>
              </div>
              <div className={`text-xs font-medium px-3 py-1 rounded-full ${
                expandedSection === 'recommendations' ? 'bg-[#107a4d]/15 text-[#107a4d]' : 'bg-[#107a4d]/10 text-[#107a4d]'
              }`}>
                {expandedSection === 'recommendations' ? 'Click to collapse' : 'Click to expand'}
              </div>
            </div>
            
            <div className="space-y-3">
              {expandedSection === 'recommendations' ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* ALL High Priority Security */}
                  {securityRecs.filter((r: any) => r.priority === 'High').map((rec: any, i: number) => (
                    <div key={`sec-${i}`} className="flex items-start gap-3 p-3 bg-white/60 border border-[#107a4d]/20 rounded-lg">
                      <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1d1d1f]">{rec.title}</p>
                          <Badge variant="destructive" className="text-[10px]">High Priority</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* ALL High Impact Performance */}
                  {optimizations.filter((o: any) => o.impact === 'High').map((opt: any, i: number) => (
                    <div key={`opt-${i}`} className="flex items-start gap-3 p-3 bg-white/60 border border-[#107a4d]/20 rounded-lg">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1d1d1f]">{opt.title}</p>
                          <Badge variant="default" className="text-[10px]">High Impact</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] leading-relaxed">{opt.description}</p>
                      </div>
                    </div>
                  ))}

                  {/* ALL Architecture Recommendations */}
                  {smartRecs.filter((r: any) => r.priority === 'high' || r.priority === 'medium').map((rec: any, i: number) => (
                    <div key={`smart-${i}`} className="flex items-start gap-3 p-3 bg-white/60 border border-[#107a4d]/20 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-[#107a4d] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1d1d1f]">{rec.title}</p>
                          <Badge variant="secondary" className="text-[10px]">{rec.type}</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Preview: First 2 High Priority Security */}
                  {securityRecs.filter((r: any) => r.priority === 'High').slice(0, 1).map((rec: any, i: number) => (
                    <div key={`sec-${i}`} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg">
                      <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1d1d1f]">{rec.title}</p>
                          <Badge variant="destructive" className="text-[10px]">High Priority</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Preview: First High Impact Performance */}
                  {optimizations.filter((o: any) => o.impact === 'High').slice(0, 1).map((opt: any, i: number) => (
                    <div key={`opt-${i}`} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1d1d1f]">{opt.title}</p>
                          <Badge variant="default" className="text-[10px]">High Impact</Badge>
                        </div>
                        <p className="text-xs text-[#605A57] leading-relaxed">{opt.description}</p>
                      </div>
                    </div>
                  ))}

                  {/* Show count of remaining items */}
                  {(securityRecs.filter((r: any) => r.priority === 'High').length + 
                    optimizations.filter((o: any) => o.impact === 'High').length + 
                    smartRecs.filter((r: any) => r.priority === 'high' || r.priority === 'medium').length) > 2 && (
                    <p className="text-xs text-[#605A57] pt-2">
                      +{securityRecs.filter((r: any) => r.priority === 'High').length + 
                        optimizations.filter((o: any) => o.impact === 'High').length + 
                        smartRecs.filter((r: any) => r.priority === 'high' || r.priority === 'medium').length - 2} more recommendations
                    </p>
                  )}
                </div>
              )}
            </div>
          </button>
        )}

        {/* Indexing Strategy - Now Interactive */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'indexing' ? null : 'indexing')}
          className={`w-full text-left rounded-lg p-6 transition-all duration-300 ${
            expandedSection === 'indexing'
              ? 'bg-gradient-to-br from-[#e8f5f0] to-[#d4ede4] shadow-xl border-2 border-[#107a4d]/30'
              : 'bg-white border-2 border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/30 hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                expandedSection === 'indexing' ? 'bg-[#107a4d]/15' : 'bg-[#107a4d]/10'
              }`}>
                <Zap className={`w-4 h-4 ${
                  expandedSection === 'indexing' ? 'text-[#107a4d]' : 'text-[#107a4d]'
                }`} />
              </div>
              <h3 className={`text-sm font-semibold ${
                expandedSection === 'indexing' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
              }`}>
                Indexing & Performance
              </h3>
            </div>
            <div className={`text-xs font-medium px-3 py-1 rounded-full ${
              expandedSection === 'indexing' ? 'bg-[#107a4d]/15 text-[#107a4d]' : 'bg-[#107a4d]/10 text-[#107a4d]'
            }`}>
              {expandedSection === 'indexing' ? 'Click to collapse' : 'Click to expand'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className={`text-[10px] uppercase tracking-wide mb-2 ${
                expandedSection === 'indexing' ? 'text-[#605A57]' : 'text-[#605A57]'
              }`}>Total Indexes</p>
              <p className={`text-2xl font-bold ${
                expandedSection === 'indexing' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
              }`}>{data.schemas.reduce((acc: number, schema: any) => acc + (schema.indexes?.length || 0), 0)}</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-wide mb-2 ${
                expandedSection === 'indexing' ? 'text-[#605A57]' : 'text-[#605A57]'
              }`}>Primary Keys</p>
              <p className={`text-2xl font-bold ${
                expandedSection === 'indexing' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
              }`}>{data.schemas.length}</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-wide mb-2 ${
                expandedSection === 'indexing' ? 'text-[#605A57]' : 'text-[#605A57]'
              }`}>Foreign Keys</p>
              <p className={`text-2xl font-bold ${
                expandedSection === 'indexing' ? 'text-[#107a4d]' : 'text-[#1d1d1f]'
              }`}>{relationships.length}</p>
            </div>
          </div>
          
          {expandedSection === 'indexing' && (
            <div className="mt-4 pt-4 border-t border-[#107a4d]/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <p className="text-xs text-[#605A57] leading-relaxed">
                  Auto-indexed on primary keys, foreign keys, and frequently queried fields. Consider composite indexes for multi-column lookups.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 border border-[#107a4d]/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-3 h-3 text-[#107a4d]" />
                      <p className="text-xs font-semibold text-[#1d1d1f]">Optimized Queries</p>
                    </div>
                    <p className="text-xs text-[#605A57]">B-tree indexes on all primary and foreign keys for fast lookups</p>
                  </div>
                  <div className="bg-white/60 border border-[#107a4d]/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-3 h-3 text-[#107a4d]" />
                      <p className="text-xs font-semibold text-[#1d1d1f]">Composite Indexes</p>
                    </div>
                    <p className="text-xs text-[#605A57]">Multi-column indexes recommended for complex WHERE clauses</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </button>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="max-w-[1000px] mx-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-[#107a4d]/20 to-transparent"></div>
      </div>

      {/* Action Buttons - Clean and Centered */}
      <div className="flex justify-center items-center gap-4 pt-16 max-w-[800px] mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
        <Button 
          onClick={onComplete} 
          size="lg" 
          className="px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all hover:scale-105 text-base font-semibold"
        >
          Proceed to API Testing
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
