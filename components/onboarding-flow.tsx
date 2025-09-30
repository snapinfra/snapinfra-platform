"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { StepOne } from "@/components/onboarding/step-one"
import { StepTwo } from "@/components/onboarding/step-two"
import { StepThree } from "@/components/onboarding/step-three"
import { StepFour } from "@/components/onboarding/step-four"
import { StepFive } from "@/components/onboarding/step-five"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, Database, Rocket, Network, Settings, Menu, X } from "lucide-react"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern"
import { useAppContext } from "@/lib/app-context"
import type { Project, TableSchema, ChatMessage } from "@/lib/app-context"

interface GeneratedData {
  projectName?: string
  description: string
  schemas: any[]
  analysis?: any
  database: string
  endpoints: any[]
  architecture?: any
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewProject, setIsNewProject] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Collapsed by default on mobile
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  // Initialize state from URL and localStorage on component mount
  useEffect(() => {
    const stepFromUrl = searchParams.get('step')
    const stepNumber = stepFromUrl ? parseInt(stepFromUrl, 10) : 1
    const isNewProjectFlag = searchParams.get('new') === 'true'
    
    // If this is a new project, clear any existing data immediately
    if (isNewProjectFlag) {
      console.log('New project detected, clearing all data')
      console.log('Current project before clear:', state.currentProject)
      
      // Clear ALL data immediately
      localStorage.removeItem('onboarding-data')
      localStorage.removeItem('current-project')
      localStorage.removeItem('chat-history')
      
      // Reset local state
      setGeneratedData(null)
      setCurrentStep(1)
      setIsNewProject(true)
      
      // Clear current project from app state to ensure fresh start
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: null })
      
      console.log('Data cleared for new project')
      
      // Remove the 'new' parameter from URL after a short delay
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('new')
        
        // Force a hard reload to ensure all state is cleared
        window.location.href = url.pathname + url.search
      }, 100)
      
      setIsLoading(false)
      return
    }
    
    // Validate step number
    const validStep = stepNumber >= 1 && stepNumber <= totalSteps ? stepNumber : 1
    setCurrentStep(validStep)
    
    // Only load data from localStorage if this is NOT a new project
    if (!isNewProject) {
      const savedData = localStorage.getItem('onboarding-data')
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          setGeneratedData(parsedData)
        } catch (error) {
          console.warn('Failed to parse saved onboarding data:', error)
          localStorage.removeItem('onboarding-data')
        }
      }
      
      // If we're on step 2 or 3 but don't have data, redirect to step 1
      if (validStep > 1 && !savedData) {
        updateStep(1)
      }
    }
    
    setIsLoading(false)
  }, [searchParams, router, isNewProject])
  
  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close sidebar with Escape key on mobile
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  // Function to update step in both state and URL
  const updateStep = (step: number) => {
    setCurrentStep(step)
    const url = new URL(window.location.href)
    url.searchParams.set('step', step.toString())
    router.push(url.pathname + url.search, { scroll: false })
  }

  // Function to save data to localStorage
  const saveData = (data: GeneratedData) => {
    setGeneratedData(data)
    localStorage.setItem('onboarding-data', JSON.stringify(data))
  }

  // Function to create project and initiate chat conversation
  const createProjectAndChat = async (data: GeneratedData | null) => {
    if (!data) {
      console.error('No data available to create project')
      router.push('/dashboard')
      return
    }

    try {
      // Convert generated schemas to TableSchema format
      const tables: TableSchema[] = data.schemas?.map((schema: any, index: number) => ({
        id: `table_${Date.now()}_${index}`,
        name: schema.name || `table_${index + 1}`,
        description: schema.description || '',
        fields: schema.fields?.map((field: any, fieldIndex: number) => ({
          id: `field_${Date.now()}_${fieldIndex}`,
          name: field.name || `field_${fieldIndex + 1}`,
          type: field.type || 'Text',
          isPrimary: field.isPrimary || false,
          isRequired: field.isRequired || false,
          isUnique: field.isUnique || false,
          isForeignKey: field.isForeignKey || false,
          description: field.description || '',
          hasIndex: field.hasIndex || false,
        })) || [],
        relationships: schema.relationships || [],
        indexes: schema.indexes || [],
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        estimatedRows: 0,
      })) || []

      // Generate a smart project name from description
      const generateProjectName = (description: string): string => {
        if (!description) return 'My Project'
        
        // Common project type patterns
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
          { regex: /finance|banking|payment/i, name: 'Finance App' },
          { regex: /property|real estate/i, name: 'Property Platform' },
          { regex: /event|calendar/i, name: 'Event Manager' },
          { regex: /news|article/i, name: 'News Platform' },
          { regex: /music|streaming/i, name: 'Music Platform' },
        ]
        
        // Check for pattern matches
        for (const pattern of patterns) {
          if (pattern.regex.test(description)) {
            return pattern.name
          }
        }
        
        // Extract first meaningful words as fallback
        const words = description
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2)
          .slice(0, 3)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        
        if (words.length > 0) {
          return words.join(' ') + (words.length === 1 ? ' App' : '')
        }
        
        return 'My Project'
      }

      // Generate unique project name (avoid duplicates)
      const makeUniqueProjectName = (baseName: string): string => {
        const existingNames = state.projects.map(p => p.name)
        
        // If the base name doesn't exist, use it
        if (!existingNames.includes(baseName)) {
          return baseName
        }
        
        // Find the next available number
        let counter = 2
        let candidateName = `${baseName} ${counter}`
        while (existingNames.includes(candidateName)) {
          counter++
          candidateName = `${baseName} ${counter}`
        }
        return candidateName
      }

      // Create the project
      const project: Project = {
        id: `project_${Date.now()}`,
        name: makeUniqueProjectName(generateProjectName(data.description || '')),
        description: data.description || 'Generated from onboarding',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        schema: tables,
        endpoints: Array.isArray(data.endpoints) ? data.endpoints : [],
        database: {
          type: data.database?.toLowerCase() || 'postgresql',
          reasoning: `Recommended for this ${data.description ? 'use case' : 'project'} based on AI analysis`,
          confidence: 0.9,
          features: ['ACID compliance', 'Complex queries', 'Scalability']
        },
        architecture: (data as any)?.architecture,
        decisions: (data as any)?.decisions,
        selectedTools: (data as any)?.selectedTools,
        analysis: (data as any)?.analysis
      }

      // Add project to state
      dispatch({ type: 'ADD_PROJECT', payload: project })

      // Fire-and-forget: generate backend code and IaC by default; update project when ready
      ;(async () => {
        try {
          // Backend code (defaults)
          const codeResp = await fetch('/api/generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project,
              framework: 'express',
              language: 'typescript',
              includeAuth: false,
              includeTests: false,
            }),
          })
          const codeData = await codeResp.json()
          if (codeData?.success) {
            dispatch({ type: 'UPDATE_PROJECT', payload: { id: project.id, generatedCode: codeData.data } as any })
          } else {
            dispatch({ type: 'UPDATE_PROJECT', payload: { id: project.id, generatedCode: { files: [], instructions: '', dependencies: [], success: false, error: codeData?.error || 'Code generation failed' } } as any })
          }
        } catch (e) {
          console.warn('Auto code generation failed:', e)
        }

        try {
          // IaC (defaults)
          const iacResp = await fetch('/api/generate-iac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project,
              options: {
                targets: ['terraform', 'aws-cdk', 'docker-compose'],
                cloud: 'aws',
                environment: 'development',
              },
            }),
          })
          const iacData = await iacResp.json()
          if (iacData?.success) {
            dispatch({ type: 'UPDATE_PROJECT', payload: { id: project.id, generatedIaC: iacData.data } as any })
          } else {
            dispatch({ type: 'UPDATE_PROJECT', payload: { id: project.id, generatedIaC: { files: [], instructions: '', dependencies: [], success: false, error: iacData?.error || 'IaC generation failed' } } as any })
          }
        } catch (e) {
          console.warn('Auto IaC generation failed:', e)
        }
      })()
      
      // Create initial chat message from user description
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: data.description || 'Create my backend project',
        timestamp: new Date(),
      }
      
      // Create AI response message
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `Perfect! I've analyzed your requirements and created a comprehensive backend for you.

**Project Created:** ${project.name}
**Database Choice:** ${project.database.type.toUpperCase()}
**Tables Generated:** ${tables.length}

${tables.length > 0 ? `**Generated Tables:**\n${tables.map(t => `• ${t.name} (${t.fields.length} fields)`).join('\n')}` : ''}

Your backend structure is now ready! You can:
• View the interactive schema diagram
• Generate production-ready code
• Deploy to cloud platforms
• Continue chatting to refine your backend

What would you like to explore next?`,
        timestamp: new Date(),
        metadata: {
          tablesGenerated: tables.length,
          endpointsCreated: tables.length * 4,
          action: 'schema_update'
        }
      }
      
      // Add chat messages
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage })
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMessage })
      
      // Clear onboarding data and navigate to dashboard
      localStorage.removeItem('onboarding-data')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Failed to create project and chat:', error)
      // Navigate to dashboard anyway
      localStorage.removeItem('onboarding-data')
      router.push('/dashboard')
    }
  }

  const stepDetails = [
    {
      number: 1,
      title: "Describe Your Vision",
      description: "Tell us about your backend requirements in plain English",
      icon: Sparkles,
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "active" : "upcoming",
    },
    {
      number: 2,
      title: "Review Database Schema",
      description: "Fine-tune your generated database schema and analysis",
      icon: Database,
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "active" : "upcoming",
    },
    {
      number: 3,
      title: "Test API Endpoints",
      description: "Explore and test your auto-generated API endpoints",
      icon: Rocket,
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "active" : "upcoming",
    },
    {
      number: 4,
      title: "System Architecture",
      description: "Visualize and customize your system architecture",
      icon: Network,
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "active" : "upcoming",
    },
    {
      number: 5,
      title: "Tool Selection",
      description: "Choose tools and finalize system decisions",
      icon: Settings,
      status: currentStep === 5 ? "active" : "upcoming",
    },
  ]

  const handleStepComplete = (data?: any) => {
    if (currentStep === 1 && data) {
      // AI generation happens here - save data to localStorage
      saveData(data)
    } else if (currentStep === 4 && data) {
      // Save architecture data from Step 4
      const updatedData = { ...generatedData, architecture: data }
      saveData(updatedData)
    } else if (currentStep === 5 && data) {
      // Save tool decisions from Step 5 before project creation
      const updatedData = { ...generatedData, decisions: data.decisions, selectedTools: data.selectedTools }
      saveData(updatedData)
      // Close sidebar on mobile when step is completed
      setIsSidebarOpen(false)
      // Create project and initiate chat conversation when completing step 5 using the latest updated data
      createProjectAndChat(updatedData)
      return
    }

    // Close sidebar on mobile when step is completed
    setIsSidebarOpen(false)

    if (currentStep < totalSteps) {
      updateStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      // Close sidebar on mobile when going back
      setIsSidebarOpen(false)
      updateStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Dashed Grid Pattern Background */}
      <GridPattern 
        width={60} 
        height={60} 
        strokeDasharray="4 4" 
        className="opacity-30"
      />
      
      {/* Mobile Menu Button - matches header SidebarTrigger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-2 left-3 z-50 h-8 w-8 p-0 sm:hidden text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md"
      >
        {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Desktop Sidebar - Original positioning */}
      <div className="hidden sm:block fixed left-0 top-12 bottom-0 w-80 lg:w-80 md:w-72 bg-background border-r border-border z-20">
        <div className="p-3 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground mb-1 truncate" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Build Your Backend</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Create a powerful backend in minutes with AI assistance</p>
            </div>
            {generatedData && (
              <button
                onClick={() => {
                  localStorage.removeItem('onboarding-data')
                  setGeneratedData(null)
                  updateStep(1)
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded border border-border hover:border-destructive flex-shrink-0 ml-2"
                title="Clear progress and start over"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-xs text-muted-foreground">{Math.round(progress)}% Complete</div>
          </div>
          <Progress value={progress} className="h-2 sm:h-3 bg-muted" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {stepDetails.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.number}
                    className={`flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                      step.status === "active"
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : step.status === "completed"
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30"
                          : "bg-muted/30 border-border/50"
                    }`}
                    onClick={() => {
                      // Allow navigation to completed steps or step 1
                      if (step.status === "completed" || step.number === 1) {
                        updateStep(step.number)
                      }
                    }}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                        step.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : step.status === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "completed" ? "✓" : <Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-xs sm:text-sm ${
                          step.status === "active"
                            ? "text-foreground"
                            : step.status === "completed"
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-xs mt-1 leading-tight hidden sm:block ${
                          step.status === "active"
                            ? "text-muted-foreground"
                            : step.status === "completed"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground/70"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar - Collapsible */}
      <div className={`sm:hidden fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-3 border-b border-border flex-shrink-0 pt-14">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground mb-1 truncate" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>Build Your Backend</h1>
              <p className="text-muted-foreground text-xs">Create a powerful backend in minutes with AI assistance</p>
            </div>
            {generatedData && (
              <button
                onClick={() => {
                  localStorage.removeItem('onboarding-data')
                  setGeneratedData(null)
                  updateStep(1)
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded border border-border hover:border-destructive flex-shrink-0 ml-2"
                title="Clear progress and start over"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="p-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-xs text-muted-foreground">{Math.round(progress)}% Complete</div>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-3">
            <div className="space-y-3">
              {stepDetails.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.number}
                    className={`flex items-start space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                      step.status === "active"
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : step.status === "completed"
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30"
                          : "bg-muted/30 border-border/50"
                    }`}
                    onClick={() => {
                      // Allow navigation to completed steps or step 1
                      if (step.status === "completed" || step.number === 1) {
                        // Close sidebar on mobile when navigating
                        setIsSidebarOpen(false)
                        updateStep(step.number)
                      }
                    }}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium flex-shrink-0 ${
                        step.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : step.status === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.status === "completed" ? "✓" : <Icon className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-xs ${
                          step.status === "active"
                            ? "text-foreground"
                            : step.status === "completed"
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="sm:ml-80 md:ml-72 lg:ml-80 min-h-screen flex items-center justify-center p-3 sm:p-6 pt-16 sm:pt-16 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          {/* Mobile Step Indicator */}
          <div className="sm:hidden mb-4 p-3 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-foreground">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="text-xs text-muted-foreground">{Math.round(progress)}% Complete</div>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {currentStep === 1 && <StepOne onComplete={handleStepComplete} />}
              {currentStep === 2 && generatedData && (
                <StepTwo data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
              )}
              {currentStep === 3 && generatedData && (
                <StepThree data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
              )}
              {currentStep === 4 && generatedData && (
                <StepFour data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
              )}
              {currentStep === 5 && generatedData && (
                <StepFive data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
              )}
              {(currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) && !generatedData && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4 text-sm">No data found. Please start from step 1.</p>
                  <button 
                    onClick={() => updateStep(1)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    Go to Step 1
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
