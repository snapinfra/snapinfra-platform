"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowRight, Zap, Database, Code, Shield, Rocket, CheckCircle, Brain, Gauge } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StepOneProps {
  onComplete: (data: any) => void
}

interface GenerationStage {
  id: string
  title: string
  description: string
  icon: any
  status: 'pending' | 'loading' | 'completed'
}

export function StepOne({ onComplete }: StepOneProps) {
  const [description, setDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStages, setGenerationStages] = useState<GenerationStage[]>([
    {
      id: 'backend',
      title: 'Database Schema',
      description: 'Analyzing requirements and generating database structure',
      icon: Database,
      status: 'pending'
    },
    {
      id: 'endpoints',
      title: 'API Endpoints',
      description: 'Creating RESTful API endpoints and routes',
      icon: Code,
      status: 'pending'
    },
    {
      id: 'recommendations',
      title: 'Database Recommendations',
      description: 'Analyzing optimal database choices for your use case',
      icon: Brain,
      status: 'pending'
    },
    {
      id: 'smart',
      title: 'Smart Recommendations',
      description: 'Generating intelligent architecture suggestions',
      icon: Rocket,
      status: 'pending'
    },
    {
      id: 'performance',
      title: 'Performance Analysis',
      description: 'Optimizing for scalability and performance',
      icon: Gauge,
      status: 'pending'
    },
    {
      id: 'security',
      title: 'Security Analysis',
      description: 'Implementing security best practices',
      icon: Shield,
      status: 'pending'
    }
  ])

  const updateStageStatus = (stageId: string, status: 'pending' | 'loading' | 'completed') => {
    setGenerationStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, status } : stage
    ))
  }

  const handleGenerate = async () => {
    if (!description.trim()) return

    setIsGenerating(true)
    
    // Reset all stages to pending
    setGenerationStages(prev => prev.map(stage => ({ ...stage, status: 'pending' as const })))

    try {
      // Stage 1: Backend Schema Generation
      updateStageStatus('backend', 'loading')
      updateStageStatus('endpoints', 'loading')
      
      const backendResponse = await fetch('/api/generate-backend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          options: {
            temperature: 0.7,
            maxTokens: 6000,
          },
        }),
      })

      const backendResult = await backendResponse.json()
      
      if (!backendResult.success) {
        console.error('Backend generation failed:', backendResult)
        throw new Error(backendResult.error || 'Failed to generate backend')
      }

      console.log('Backend Generation Success:', backendResult)
      
      // Complete backend stages
      updateStageStatus('backend', 'completed')
      updateStageStatus('endpoints', 'completed')

      // Start all analysis stages
      updateStageStatus('recommendations', 'loading')
      updateStageStatus('smart', 'loading')
      updateStageStatus('performance', 'loading')
      updateStageStatus('security', 'loading')
      
      // Call all focused analysis APIs in parallel but show progress
      const analysisRequests = [
        fetch('/api/database-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(),
            schemas: backendResult.schemas
          })
        }).then(async (res) => {
          const result = await res.json()
          updateStageStatus('recommendations', 'completed')
          return result
        }),
        fetch('/api/smart-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(),
            schemas: backendResult.schemas
          })
        }).then(async (res) => {
          const result = await res.json()
          updateStageStatus('smart', 'completed')
          return result
        }),
        fetch('/api/optimization-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(),
            schemas: backendResult.schemas
          })
        }).then(async (res) => {
          const result = await res.json()
          updateStageStatus('performance', 'completed')
          return result
        }),
        fetch('/api/security-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(),
            schemas: backendResult.schemas
          })
        }).then(async (res) => {
          const result = await res.json()
          updateStageStatus('security', 'completed')
          return result
        }),
        fetch('/api/scaling-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: description.trim(),
            schemas: backendResult.schemas
          })
        })
      ]

      const [dbRecs, smartRecs, optimizations, security, scalingRes] = await Promise.all(analysisRequests)
      const scaling = await scalingRes.json()

      console.log('Database Recommendations:', dbRecs)
      console.log('Smart Recommendations:', smartRecs)
      console.log('Optimizations:', optimizations)
      console.log('Security:', security)
      console.log('Scaling:', scaling)

      // Generate project name from description
      const generateProjectName = (description: string): string => {
        const patterns = [
          { regex: /social media|social network/i, name: 'Social Media App' },
          { regex: /e-?commerce|online store|shop/i, name: 'E-commerce Platform' },
          { regex: /blog|cms|content management/i, name: 'Blog CMS' },
          { regex: /task|todo|project management/i, name: 'Task Manager' },
          { regex: /chat|messaging/i, name: 'Chat App' },
          { regex: /food|restaurant|delivery/i, name: 'Food Delivery App' },
          { regex: /booking|reservation/i, name: 'Booking System' },
          { regex: /inventory|warehouse/i, name: 'Inventory System' },
          { regex: /learning|education|course/i, name: 'Learning Platform' },
          { regex: /fitness|health|workout/i, name: 'Fitness App' },
        ]
        
        for (const pattern of patterns) {
          if (pattern.regex.test(description)) {
            return pattern.name
          }
        }
        
        const words = description
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 3)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        
        return words.length > 0 ? words.join(' ') + (words.length === 1 ? ' App' : '') : 'My Project'
      }

      // Aggregate all results
      const completeResult = {
        ...backendResult,
        projectName: generateProjectName(description.trim()),
        analysis: {
          success: true,
          useCase: dbRecs.useCase,
          databaseRecommendations: dbRecs.recommendations || [],
          smartRecommendations: smartRecs.recommendations || [],
          optimizationSuggestions: optimizations.suggestions || [],
          securityRecommendations: security.recommendations || [],
          scalingInsights: scaling.insights || { expectedLoad: 'Medium', readWriteRatio: '70:30', cachingStrategy: 'Application-level', indexingPriority: [] },
          performanceMetrics: scaling.metrics || []
        }
      }

      console.log('Complete Result:', completeResult)

      // Pass the complete AI-generated data to the next step
      onComplete(completeResult)
    } catch (error) {
      console.error('Backend generation error:', error)
      
      // Reset all stages to pending on error
      setGenerationStages(prev => prev.map(stage => ({ ...stage, status: 'pending' as const })))
      
      let errorMessage = 'Backend generation failed. '
      
      // Check if it's a specific AI validation error
      if (error instanceof Error) {
        if (error.message.includes('6-20 tables') || error.message.includes('tables generated')) {
          errorMessage = error.message + ' Try being more specific about your requirements.'
        } else if (error.message.includes('JSON')) {
          errorMessage = 'AI generated invalid response format. Please try again.'
        } else if (error.message.includes('No database schemas')) {
          errorMessage = 'AI could not generate database schemas. Please provide a more detailed description of your backend requirements.'
        } else {
          errorMessage += error.message
        }
      } else {
        errorMessage += 'Unknown error occurred.'
      }
      
      console.error('Full error details:', {
        error,
        description: description.trim(),
        timestamp: new Date().toISOString()
      })
      
      // Show user-friendly error message
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const examples = [
    "A social media platform with users, posts, comments, and likes",
    "An e-commerce store with products, orders, customers, and inventory",
    "A task management app with projects, tasks, teams, and deadlines",
    "A blog platform with authors, articles, categories, and comments",
  ]

  const completedStages = generationStages.filter(stage => stage.status === 'completed').length
  const totalStages = generationStages.length
  const progressPercentage = (completedStages / totalStages) * 100

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground text-balance" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Describe Your Backend in Plain English</h1>
        <p className="text-base text-muted-foreground text-balance leading-6">
          Complete database schema and API endpoints generated for you.
        </p>
      </div>

      <Card className="w-full max-w-2xl p-6 shadow-lg border-2 border-border/50">
        <div className="space-y-4">
          <Textarea
            placeholder="Example: I want to build a social media app where users can create posts, follow each other, and like content..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] text-base resize-none border-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/60"
            disabled={isGenerating}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!description.trim() || isGenerating}
              className="px-8 py-3 text-base"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Zap className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Backend
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Progressive Loading Indicator */}
      {isGenerating && (
        <Card className="w-full max-w-2xl p-6 shadow-lg border border-border/50">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Generating Your Backend</h3>
              <p className="text-sm text-muted-foreground">
                {completedStages} of {totalStages} components completed
              </p>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="space-y-3">
              {generationStages.map((stage) => {
                const Icon = stage.icon
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-500 ${
                      stage.status === 'completed'
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                        : stage.status === 'loading'
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30'
                          : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {stage.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : stage.status === 'loading' ? (
                        <Icon className="h-5 w-5 text-blue-600 animate-pulse" />
                      ) : (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          stage.status === 'completed'
                            ? 'text-green-700 dark:text-green-300'
                            : stage.status === 'loading'
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-muted-foreground'
                        }`}>
                          {stage.title}
                        </h4>
                        {stage.status === 'loading' && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        stage.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : stage.status === 'loading'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-muted-foreground/70'
                      }`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      <div className="w-full max-w-2xl space-y-4">
        <p className="text-sm text-muted-foreground text-center font-medium">Or try one of these examples:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setDescription(example)}
              disabled={isGenerating}
              className="p-4 text-left text-sm bg-card hover:bg-accent/50 border border-border rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
