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
  // Individual inline fields
  const [platformType, setPlatformType] = useState("")
  const [businessDomain, setBusinessDomain] = useState("")
  const [targetMetric, setTargetMetric] = useState("")
  const [keyFeatures, setKeyFeatures] = useState("")
  const [scalingGoal, setScalingGoal] = useState("")
  const [compliance, setCompliance] = useState("")
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
    // Build description from all inline inputs
    const architecturalInput = `Build a ${platformType} platform for ${businessDomain} serving ${targetMetric}. Key features: ${keyFeatures}. Scale to ${scalingGoal} and ensure ${compliance} compliance.`.trim()
    
    if (!platformType.trim() || !businessDomain.trim()) {
      alert('Please fill in at least the platform type and business domain to continue.')
      return
    }

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
          description: architecturalInput.trim(),
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
            description: architecturalInput.trim(),
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
            description: architecturalInput.trim(),
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
            description: architecturalInput.trim(),
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
            description: architecturalInput.trim(),
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
            description: architecturalInput.trim(),
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

      // Generate project name from input
      const generateProjectName = (input: string): string => {
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
          if (pattern.regex.test(input)) {
            return pattern.name
          }
        }
        
        const words = input
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
        projectName: generateProjectName(architecturalInput.trim()),
        description: architecturalInput.trim(),
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
        architecturalInput: architecturalInput.trim().substring(0, 200),
        timestamp: new Date().toISOString()
      })
      
      // Show user-friendly error message
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const architecturalExamples = [
    {
      platformType: "simple todo list application",
      businessDomain: "personal task management",
      targetMetric: "100+ active users",
      keyFeatures: "create tasks, mark complete, organize by categories, due dates, priority levels, search and filter",
      scalingGoal: "small team usage with real-time sync",
      compliance: "basic authentication and data privacy"
    },
    {
      platformType: "multi-tenant B2B SaaS",
      businessDomain: "supply chain visibility",
      targetMetric: "1M+ daily shipments",
      keyFeatures: "real-time tracking, predictive alerts, multi-carrier integration, org hierarchies, analytics dashboard",
      scalingGoal: "50 to 5K enterprise clients over 3 years across NA/EU/APAC regions",
      compliance: "SOC 2 Type II, ISO 27001, GDPR"
    },
    {
      platformType: "enterprise healthcare data exchange",
      businessDomain: "connecting hospitals and insurance providers",
      targetMetric: "100K+ patient records daily",
      keyFeatures: "record aggregation, consent management, audit logs, clinical decision support, claim automation",
      scalingGoal: "200 to 2K facilities with regional data residency",
      compliance: "HIPAA, GDPR, HITRUST"
    },
    {
      platformType: "multi-region fintech payment infrastructure",
      businessDomain: "real-time payment processing",
      targetMetric: "10K+ TPS across 50+ countries",
      keyFeatures: "multi-currency support, fraud detection, instant settlement, dispute resolution, regulatory reporting",
      scalingGoal: "1K to 100K merchants with active-active deployment",
      compliance: "PCI-DSS Level 1, SOC 2 Type II"
    },
    {
      platformType: "enterprise IoT data platform",
      businessDomain: "industrial equipment monitoring",
      targetMetric: "10M+ device events per second",
      keyFeatures: "time-series data ingestion, predictive maintenance, anomaly detection, edge computing, fleet management",
      scalingGoal: "500K connected devices across 100+ manufacturing facilities globally",
      compliance: "ISO 27001, SOC 2, industry-specific certifications"
    },
    {
      platformType: "AI-powered customer data platform",
      businessDomain: "unified customer intelligence",
      targetMetric: "500M+ customer profiles with real-time updates",
      keyFeatures: "360-degree customer view, ML-based segmentation, journey orchestration, privacy vault, identity resolution",
      scalingGoal: "enterprise retailers processing 10B+ events daily across omnichannel touchpoints",
      compliance: "GDPR, CCPA, SOC 2 Type II"
    },
    {
      platformType: "distributed media streaming platform",
      businessDomain: "live and on-demand video delivery",
      targetMetric: "1M+ concurrent streams with sub-second latency",
      keyFeatures: "adaptive bitrate streaming, CDN integration, DRM protection, live transcoding, analytics",
      scalingGoal: "global deployment with 99.99% uptime serving 50M+ monthly active users",
      compliance: "SOC 2, content protection standards, regional broadcasting regulations"
    },
    {
      platformType: "multi-tenant EdTech learning management system",
      businessDomain: "personalized education at scale",
      targetMetric: "5M+ active learners across 10K+ institutions",
      keyFeatures: "adaptive learning paths, real-time collaboration, assessment engine, content library, progress analytics",
      scalingGoal: "100 pilot schools to global university network with multi-language support",
      compliance: "FERPA, COPPA, GDPR, accessibility standards (WCAG 2.1)"
    },
    {
      platformType: "autonomous logistics orchestration platform",
      businessDomain: "last-mile delivery optimization",
      targetMetric: "500K+ daily deliveries with dynamic routing",
      keyFeatures: "AI route optimization, fleet management, driver app, customer notifications, warehouse integration",
      scalingGoal: "regional rollout to 50 cities with mixed vehicle types (drones, bikes, vans)",
      compliance: "SOC 2, local transportation regulations, carbon reporting standards"
    },
    {
      platformType: "social media platform",
      businessDomain: "community engagement and content sharing",
      targetMetric: "10K+ daily active users",
      keyFeatures: "user profiles, posts with media, comments, likes, follows, real-time feed, notifications, hashtags",
      scalingGoal: "MVP to 100K users with global reach",
      compliance: "GDPR, content moderation policies, user data protection"
    },
    {
      platformType: "e-commerce marketplace",
      businessDomain: "online retail and vendor management",
      targetMetric: "50K+ monthly orders",
      keyFeatures: "product catalog, shopping cart, payment processing, order tracking, vendor dashboard, reviews and ratings",
      scalingGoal: "500 vendors to 5K vendors with multi-currency support",
      compliance: "PCI-DSS, consumer protection laws, tax compliance"
    },
    {
      platformType: "project management tool",
      businessDomain: "team collaboration and workflow automation",
      targetMetric: "5K+ teams managing 100K+ tasks",
      keyFeatures: "project boards, task assignments, time tracking, file attachments, team chat, gantt charts, reporting",
      scalingGoal: "small teams to enterprise with SSO and advanced permissions",
      compliance: "SOC 2, ISO 27001, enterprise security standards"
    }
  ]

  const completedStages = generationStages.filter(stage => stage.status === 'completed').length
  const totalStages = generationStages.length
  const progressPercentage = (completedStages / totalStages) * 100

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Step Title */}
      <div className="text-center space-y-3 max-w-[800px]">
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Describe your platform architecture
        </h1>
        <p className="text-[15px] text-[#86868b] max-w-[700px] mx-auto">
          Provide your vision, objectives, users, features, scaling needs, and compliance requirements
        </p>
      </div>

      {/* Enhanced Dark Input Box with Inline Fill-in-the-Blanks */}
      <div className="w-full max-w-[900px]">
        <div className="relative">
          {/* Solid primary border */}
          <div className="absolute inset-0 rounded-2xl p-[2px] bg-[#005BE3]">
            <div className="w-full h-full rounded-2xl"></div>
          </div>
          
          {/* Background glow effect */}
          <div className="absolute -inset-2 bg-[#005BE3]/30 rounded-2xl blur-xl opacity-40"></div>
          
          {/* Main input container */}
          <div className="relative rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden" style={{ margin: '2px' }}>
            {/* Semi-transparent dark background */}
            <div className="absolute inset-0 bg-[#1d1d1f]/90 backdrop-blur-sm z-0"></div>
            
            {/* Inline Fill-in-the-Blanks Sentence */}
            <div className="p-6 relative z-10">
              <div className="text-white text-[16px] leading-relaxed flex flex-wrap items-center gap-2">
                <span className="text-[rgba(255,255,255,0.7)]">Build a</span>
                <input
                  type="text"
                  value={platformType}
                  onChange={(e) => setPlatformType(e.target.value)}
                  placeholder="multi-tenant B2B SaaS"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">platform for</span>
                <input
                  type="text"
                  value={businessDomain}
                  onChange={(e) => setBusinessDomain(e.target.value)}
                  placeholder="supply chain visibility"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">serving</span>
                <input
                  type="text"
                  value={targetMetric}
                  onChange={(e) => setTargetMetric(e.target.value)}
                  placeholder="1M+ daily shipments"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[160px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]" className="w-full"></span>
                <span className="text-[rgba(255,255,255,0.7)]">Key features:</span>
                <input
                  type="text"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  placeholder="real-time tracking, predictive alerts, API integration"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] flex-1 min-w-[300px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]" className="w-full mt-2"></span>
                <span className="text-[rgba(255,255,255,0.7)]">Scale to</span>
                <input
                  type="text"
                  value={scalingGoal}
                  onChange={(e) => setScalingGoal(e.target.value)}
                  placeholder="5K clients across 3 regions"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[200px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">and ensure</span>
                <input
                  type="text"
                  value={compliance}
                  onChange={(e) => setCompliance(e.target.value)}
                  placeholder="SOC 2, ISO 27001, GDPR"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">compliance.</span>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[platformType, businessDomain, targetMetric, keyFeatures, scalingGoal, compliance].map((field, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          field.trim() ? 'bg-[#005BE3] scale-100' : 'bg-[rgba(255,255,255,0.2)] scale-75'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-[rgba(255,255,255,0.5)]">
                    {[platformType, businessDomain, targetMetric, keyFeatures, scalingGoal, compliance].filter(f => f.trim()).length}/6 fields completed
                  </span>
                </div>
                
                {/* Submit Button */}
                <div>
                <button
                  onClick={handleGenerate}
                  disabled={!platformType.trim() || !businessDomain.trim() || isGenerating}
                  className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    platformType.trim() && businessDomain.trim()
                      ? 'bg-[#005BE3] hover:bg-[#004BC9] shadow-[0_2px_8px_rgba(0,91,227,0.4)] cursor-pointer hover:shadow-[0_4px_12px_rgba(0,91,227,0.5)] hover:scale-105'
                      : 'bg-white/10 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="text-white">Generating...</span>
                    </>
                  ) : (
                    <span className="text-white font-medium">Generate Backend Architecture</span>
                  )}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Buttons */}
      {!isGenerating && (
        <div className="w-full max-w-[900px] mt-6">
          <p className="text-[#605A57] text-sm text-center mb-4">Try an example:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {architecturalExamples.map((example, index) => {
              const titles = [
                'Todo App',
                'Supply Chain',
                'Healthcare Platform',
                'Payment System',
                'IoT Monitoring',
                'Customer Analytics',
                'Media Streaming',
                'Learning Platform',
                'Logistics Network',
                'Social Media',
                'E-commerce Store',
                'Project Management'
              ];
              const title = titles[index] || `Example ${index + 1}`;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setPlatformType(example.platformType)
                    setBusinessDomain(example.businessDomain)
                    setTargetMetric(example.targetMetric)
                    setKeyFeatures(example.keyFeatures)
                    setScalingGoal(example.scalingGoal)
                    setCompliance(example.compliance)
                  }}
                  disabled={isGenerating}
                  className="p-4 text-center text-sm bg-white hover:bg-[#005BE3]/5 border border-[rgba(55,50,47,0.08)] hover:border-[#005BE3]/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#37322F] font-medium"
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading Indicator - Clean and Simple */}
      {isGenerating && (
        <div className="w-full max-w-[900px] mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-[rgba(55,50,47,0.08)] p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#005BE3]/20 rounded-full animate-ping"></div>
                    <div className="relative w-2 h-2 bg-[#005BE3] rounded-full"></div>
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
                          ? 'bg-[#005BE3]/5 text-[#005BE3]'
                          : stage.status === 'loading'
                            ? 'bg-[#005BE3]/10 text-[#005BE3]'
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
    </div>
  )
}
