"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowRight, Zap, Database, Code, Shield, Rocket, CheckCircle, Brain, Gauge, Sparkles, ArrowUp } from "lucide-react"
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
    "Multi-tenant B2B SaaS with org hierarchies, RBAC, and usage billing",
    "Enterprise API gateway with rate limiting, webhooks, and monitoring",
    "Customer data platform with event streaming and GDPR compliance",
    "Internal admin portal with workflow automation and audit trails",
  ]

  const completedStages = generationStages.filter(stage => stage.status === 'completed').length
  const totalStages = generationStages.length
  const progressPercentage = (completedStages / totalStages) * 100

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Step Title - Smaller and Cleaner */}
      <div className="text-center space-y-3 max-w-[800px]">
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Describe your backend requirements
        </h1>
      </div>

      {/* Enhanced Prompt Box with Better UX */}
      <div className="w-full max-w-[800px]">
        <div className="relative">
          {/* Solid primary border */}
          <div className="absolute inset-0 rounded-2xl p-[2px] bg-[#107a4d]">
            <div className="w-full h-full rounded-2xl"></div>
          </div>
          
          {/* Background glow effect */}
          <div className="absolute -inset-2 bg-[#107a4d]/30 rounded-2xl blur-xl opacity-40"></div>
          
          {/* Main input container */}
          <div className="relative rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden" style={{ margin: '2px' }}>
            {/* Semi-transparent dark background */}
            <div className="absolute inset-0 bg-[#1d1d1f]/90 backdrop-blur-sm z-0"></div>
            
            {/* Input Area */}
            <div className="flex items-start gap-3 p-5 relative z-10">
              {/* Textarea */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isGenerating}
                placeholder="multi-tenant SaaS with usage-based billing. need RBAC, audit logs, and analytics dashboards."
                className="flex-1 bg-transparent text-white placeholder-[rgba(255,255,255,0.4)] text-base resize-none outline-none min-h-[24px] overflow-hidden font-sans"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '24px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = target.scrollHeight + 'px'
                }}
              />
              
              {/* Submit Button */}
              <button
                onClick={handleGenerate}
                disabled={!description.trim() || isGenerating}
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  description.trim()
                    ? 'bg-[#107a4d] hover:bg-[#0d6340] shadow-[0_2px_8px_rgba(16,122,77,0.4)] cursor-pointer hover:shadow-[0_4px_12px_rgba(16,122,77,0.5)] hover:scale-105'
                    : 'bg-white/10 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <ArrowUp className={`w-5 h-5 ${
                    description.trim() ? 'text-white' : 'text-white/30'
                  }`} />
                )}
              </button>
            </div>
            
            {/* Bottom Hints with Character Count */}
            <div className="px-5 pb-3 flex items-center justify-between text-xs text-[rgba(255,255,255,0.5)] relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border border-[rgba(255,255,255,0.3)] flex items-center justify-center">
                    <span className="text-[8px]">⏎</span>
                  </div>
                  <span>to send</span>
                </div>
                <span className="text-[rgba(255,255,255,0.3)]">•</span>
                <span>Shift + ⏎ for new line</span>
              </div>
              <div className="flex items-center gap-2">
                {description.length > 0 && (
                  <span className={`transition-colors ${
                    description.length < 50 
                      ? 'text-[rgba(255,255,255,0.3)]' 
                      : 'text-[rgba(255,255,255,0.5)]'
                  }`}>
                    {description.length} chars
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator - Clean and Simple */}
      {isGenerating && (
        <div className="w-full max-w-[800px] mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-[rgba(55,50,47,0.08)] p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#107a4d]/20 rounded-full animate-ping"></div>
                    <div className="relative w-2 h-2 bg-[#107a4d] rounded-full"></div>
                  </div>
                  <span className="text-[#1d1d1f] text-base font-medium">Generating your enterprise backend...</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2 bg-muted" />
                <p className="text-xs text-[#605A57] text-center">
                  {completedStages} of {totalStages} components completed
                </p>
              </div>
              
              {/* Status List - Simple */}
              <div className="space-y-2">
                {generationStages.map((stage) => {
                  const Icon = stage.icon
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                        stage.status === 'completed'
                          ? 'bg-[#107a4d]/5 text-[#107a4d]'
                          : stage.status === 'loading'
                            ? 'bg-[#107a4d]/10 text-[#107a4d]'
                            : 'bg-transparent text-[#605A57] opacity-40'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {stage.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : stage.status === 'loading' ? (
                          <Icon className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{stage.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Examples - Clean Grid */}
      {!isGenerating && (
        <div className="w-full max-w-[800px] mt-6">
          <p className="text-[#605A57] text-sm text-center mb-4">or try an example:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setDescription(example)}
                disabled={isGenerating}
                className="p-4 text-left text-sm bg-white hover:bg-[#107a4d]/5 border border-[rgba(55,50,47,0.08)] hover:border-[#107a4d]/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#37322F]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
