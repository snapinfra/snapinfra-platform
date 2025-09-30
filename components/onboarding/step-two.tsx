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
    <div className="w-full max-w-7xl mx-auto py-6 px-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Your Generated Database Schema</h1>
          <p className="text-sm text-muted-foreground">
            We've analyzed your requirements and created intelligent recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={complexity === 'complex' ? 'destructive' : complexity === 'medium' ? 'default' : 'secondary'}>
            {complexity.charAt(0).toUpperCase() + complexity.slice(1)} Project
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <Star className="w-3 h-3 mr-1" />
            AI Optimized
          </Badge>
        </div>
      </div>

      {/* Top Section: Database Recommendations, Schema Stats, Scaling Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Recommendations */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Database className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Database Recommendations</h3>
                <p className="text-xs text-muted-foreground">{dbRecommendations.length} options</p>
              </div>
            </div>
            <div className="space-y-3">
              {dbRecommendations.slice(0, 2).map((db: any, index: number) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedDatabase === db.name 
                      ? 'border-primary bg-primary/5' 
                      : 'border-transparent hover:border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedDatabase(db.name)}
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{db.name}</h4>
                        {index === 0 && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={db.score} className="w-12 h-1.5" />
                        <span className="text-xs font-medium">{db.score}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{db.bestFor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        {/* Schema Statistics */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <BarChart className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Schema Stats</h3>
                <p className="text-xs text-muted-foreground">Database overview</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-lg font-bold text-foreground">{data.schemas.length}</div>
                <div className="text-xs text-muted-foreground">Tables</div>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-lg font-bold text-foreground">{relationships.length}</div>
                <div className="text-xs text-muted-foreground">Relations</div>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-lg font-bold text-foreground">
                  {data.schemas.reduce((acc: number, schema: any) => acc + schema.fields.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Fields</div>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded">
                <div className="text-lg font-bold text-foreground">
                  {data.schemas.reduce((acc: number, schema: any) => acc + (schema.indexes?.length || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Indexes</div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Enterprise Features:</div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1">
                  {data.schemas.filter((s: any) => s.triggers?.length > 0).length} Triggers
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1">
                  {data.schemas.filter((s: any) => s.partitioning).length} Partitioned
                </Badge>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Scaling Strategy */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Scaling Strategy</h3>
                <p className="text-xs text-muted-foreground">Performance planning</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Load</span>
                <Badge variant={scalingInsights.expectedLoad === 'High' ? 'destructive' : 'default'} className="text-xs">
                  {scalingInsights.expectedLoad || 'Medium'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Read/Write Ratio</span>
                <Badge variant="outline" className="text-xs">{scalingInsights.readWriteRatio || '70:30'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Caching Strategy</span>
                <Badge variant="secondary" className="text-xs">{scalingInsights.cachingStrategy || 'Application-level'}</Badge>
              </div>
            </div>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-2">Key Considerations</h4>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  <span>Horizontal scaling for high load</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  <span>Read replicas for read-heavy workloads</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full" />
                  <span>Connection pooling optimization</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Middle Section: Full Width Database Schema */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Table className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Database Schema</h3>
                <p className="text-xs text-muted-foreground">{data.schemas.length} tables • {relationships.length} relationships</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showRelationships ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowRelationships(!showRelationships)}
              >
                {showRelationships ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                Relationships
              </Button>
            </div>
          </div>
          
          {/* Schema Visualization */}
          <div className="max-h-[700px] overflow-y-auto pr-2">
            <div className="relative">
              {/* Connection Lines SVG Overlay */}
              {showRelationships && relationships.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: Math.ceil(data.schemas.length / 3) * 280 + 'px' }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                     refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" className="fill-blue-500" />
                    </marker>
                  </defs>
                  {relationships.map((rel, i) => {
                    const fromIndex = data.schemas.findIndex((s: any) => s.name === rel.from)
                    const toIndex = data.schemas.findIndex((s: any) => s.name === rel.to)
                    
                    if (fromIndex === -1 || toIndex === -1) return null
                    
                    const colsPerRow = Math.min(3, Math.ceil(Math.sqrt(data.schemas.length)))
                    const fromRow = Math.floor(fromIndex / colsPerRow)
                    const fromCol = fromIndex % colsPerRow
                    const toRow = Math.floor(toIndex / colsPerRow)
                    const toCol = toIndex % colsPerRow
                    
                    const cardWidth = 280
                    const cardHeight = 250
                    const gapX = 24
                    const gapY = 24
                    
                    const x1 = fromCol * (cardWidth + gapX) + cardWidth / 2
                    const y1 = fromRow * (cardHeight + gapY) + cardHeight / 2
                    const x2 = toCol * (cardWidth + gapX) + cardWidth / 2
                    const y2 = toRow * (cardHeight + gapY) + cardHeight / 2
                    
                    return (
                      <g key={i}>
                        <line
                          x1={x1} y1={y1}
                          x2={x2} y2={y2}
                          stroke="rgb(59 130 246)" 
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          markerEnd="url(#arrowhead)"
                          className="opacity-70"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 8}
                          className="fill-blue-600 text-xs font-medium"
                          textAnchor="middle"
                          style={{ fontSize: '10px' }}
                        >
                          {rel.field}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
              
              {/* Table Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
                {data.schemas.map((schema: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`p-4 transition-all duration-200 cursor-pointer border-2 ${
                      selectedTable === schema.name 
                        ? 'border-primary shadow-lg transform scale-[1.02]' 
                        : 'border-transparent hover:border-border hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTable(selectedTable === schema.name ? null : schema.name)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <Table className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="font-semibold capitalize">{schema.name}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {schema.fields.length} fields
                          </Badge>
                          {schema.indexes && schema.indexes.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {schema.indexes.length} idx
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {schema.fields.map((field: any, fieldIndex: number) => (
                          <div 
                            key={fieldIndex} 
                            className="flex items-start gap-2 text-sm p-2 rounded transition-colors hover:bg-muted/50"
                          >
                            {getFieldIcon(field)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{field.name}</span>
                                <Badge variant="secondary" className={`text-xs ${getFieldTypeColor(field.type)}`}>
                                  {field.type}{field.length ? `(${field.length})` : ''}
                                </Badge>
                              </div>
                              {field.comment && (
                                <p className="text-xs text-muted-foreground mb-1">{field.comment}</p>
                              )}
                              <div className="flex items-center gap-1 flex-wrap">
                                {field.primary && <Badge variant="outline" className="text-xs">PK</Badge>}
                                {field.foreign && <Badge variant="outline" className="text-xs">FK</Badge>}
                                {field.unique && <Badge variant="outline" className="text-xs">UQ</Badge>}
                                {field.nullable === false && <Badge variant="outline" className="text-xs">NOT NULL</Badge>}
                                {field.default && <Badge variant="secondary" className="text-xs">DEFAULT</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Bottom Section: Smart Recommendations, Security, Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Recommendations */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Lightbulb className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Smart Recommendations</h3>
                <p className="text-xs text-muted-foreground">{smartRecs.length} suggestions</p>
              </div>
            </div>
            <div className="max-h-[250px] overflow-y-auto pr-2">
              <div className="space-y-2">
                {smartRecs.slice(0, 3).map((r: any, i: number) => {
                  const Icon = getRecommendationIcon(r.type)
                  return (
                    <div key={i} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <Icon className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h4 className="font-medium text-xs truncate">{r.title}</h4>
                            <Badge variant="outline" className="text-xs text-[10px] px-1">{r.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                          <Badge variant="secondary" className="text-[10px] px-1 mt-1">{r.type}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
            
        {/* Security Overview */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Security</h3>
                <p className="text-xs text-muted-foreground">{securityRecs.length} recommendations</p>
              </div>
            </div>
            <div className="max-h-[250px] overflow-y-auto pr-2">
              <div className="space-y-2">
                {securityRecs.slice(0, 3).map((rec: any, index: number) => {
                  const Icon = getSecurityIcon(rec.category)
                  return (
                    <div key={index} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <Icon className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h4 className="font-medium text-xs truncate">{rec.title}</h4>
                            <Badge 
                              variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'} 
                              className="text-[10px] px-1"
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                          <Badge variant="outline" className="text-[10px] px-1 mt-1">{rec.category}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Performance Optimizations */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Zap className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Performance</h3>
                <p className="text-xs text-muted-foreground">{optimizations.length} recommendations</p>
              </div>
            </div>
            <div className="max-h-[250px] overflow-y-auto pr-2">
              <div className="space-y-2">
                {optimizations.slice(0, 3).map((opt: any, index: number) => {
                  const Icon = getOptimizationIcon(opt.type)
                  return (
                    <div key={index} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <Icon className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h4 className="font-medium text-xs truncate">{opt.title}</h4>
                            <Badge variant={opt.impact === 'High' ? 'default' : 'secondary'} className="text-[10px] px-1">{opt.impact}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{opt.description}</p>
                          <Badge variant="outline" className="text-[10px] px-1 mt-1">{opt.type}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Requirements Summary */}
      <Card className="p-6 bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Original Requirements</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed italic pl-11">
            "{data.description}"
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onComplete} size="lg" className="bg-primary hover:bg-primary/90">
          Continue to API Endpoints
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
