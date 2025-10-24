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
import { createProject as createProjectAPI, isBackendAvailable } from "@/lib/api-client"
import { markOnboardingComplete } from "@/lib/storage"
import Image from "next/image"
import Link from "next/link"

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
      localStorage.removeItem('onboarding-decisions')
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
      console.log('🚀 Creating project with backend integration...')
      
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

      // Flatten grouped endpoints into a single array with group info
      const flattenedEndpoints = Array.isArray(data.endpoints)
        ? data.endpoints.flatMap((group: any) => 
            Array.isArray(group.endpoints)
              ? group.endpoints.map((endpoint: any) => ({
                  ...endpoint,
                  group: group.group || 'General',
                }))
              : []
          )
        : []

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

      // Generate project name
      const projectName = makeUniqueProjectName(generateProjectName(data.description || ''))
      
      // Check if backend is available
      const backendAvailable = await isBackendAvailable()
      console.log('Backend availability:', backendAvailable)
      
      let project: Project
      
      if (backendAvailable) {
        // Create project in backend (AWS DynamoDB)
        try {
          console.log('📡 Calling backend API to create project with full onboarding data...')
          const backendProject = await createProjectAPI({
            name: projectName,
            description: data.description || 'Generated from onboarding',
            schema: {
              name: projectName,
              tables: tables.map(t => ({
                id: t.id,
                name: t.name,
                fields: t.fields,
                indexes: t.indexes
              }))
            },
            endpoints: flattenedEndpoints,
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
          })
          
          // Use the project from backend with server-generated ID
          project = {
            ...backendProject,
            schema: tables,
            endpoints: flattenedEndpoints,
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
          
          console.log('✅ Project created in backend:', project.id)
        } catch (error) {
          console.error('❌ Backend project creation failed, falling back to local:', error)
          // Fallback to local creation if backend fails
          project = {
            id: `project_${Date.now()}`,
            name: projectName,
            description: data.description || 'Generated from onboarding',
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            schema: tables,
            endpoints: flattenedEndpoints,
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
        }
      } else {
        // Backend not available - create project locally only
        console.log('⚠️ Backend not available, creating project locally only')
        project = {
        id: `project_${Date.now()}`,
        name: projectName,
        description: data.description || 'Generated from onboarding',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        schema: tables,
        endpoints: flattenedEndpoints,
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
      }

      // Add project to state (this will also save to localStorage via app-context)
      dispatch({ type: 'ADD_PROJECT', payload: project })

      // Note: Code and IaC generation is now user-triggered from the dashboard
      // This prevents automatic generation errors and gives users control
      
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
      
      // Mark onboarding as complete and clear data
      markOnboardingComplete()
      localStorage.removeItem('onboarding-data')
      localStorage.removeItem('onboarding-decisions')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Failed to create project and chat:', error)
      // Navigate to dashboard anyway and mark onboarding complete
      markOnboardingComplete()
      localStorage.removeItem('onboarding-data')
      localStorage.removeItem('onboarding-decisions')
      router.push('/dashboard')
    }
  }

  const stepDetails = [
    {
      number: 1,
      title: "Requirements",
      description: "Define backend requirements",
      icon: Sparkles,
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "active" : "upcoming",
    },
    {
      number: 2,
      title: "Database Schema",
      description: "Review generated schema",
      icon: Database,
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "active" : "upcoming",
    },
    {
      number: 3,
      title: "API Endpoints",
      description: "Explore API endpoints",
      icon: Rocket,
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "active" : "upcoming",
    },
    {
      number: 4,
      title: "Architecture",
      description: "System architecture",
      icon: Network,
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "active" : "upcoming",
    },
    {
      number: 5,
      title: "Configuration",
      description: "Finalize configuration",
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
      // Create project and initiate chat conversation when completing step 5 using the latest updated data
      createProjectAndChat(updatedData)
      return
    }

    if (currentStep < totalSteps) {
      updateStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
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
      
      {/* Top Bar with Logo, Project Indicator and Progress */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[rgba(55,50,47,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: Logo and New Project Indicator */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image src="/snapinfra-logo.svg" alt="Snapinfra" width={100} height={24} className="h-6 w-auto" />
            </Link>
            <div className="h-4 w-px bg-[rgba(55,50,47,0.2)]"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#005BE3] animate-pulse"></div>
              <span className="text-sm text-[#37322F] font-medium">New Project</span>
            </div>
          </div>
          
          {/* Center: Progress Dots */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`transition-all duration-300 rounded-full ${
                  step < currentStep
                    ? 'w-2 h-2 bg-[#005BE3]'
                    : step === currentStep
                      ? 'w-8 h-2 bg-[#005BE3]'
                      : 'w-2 h-2 bg-[rgba(55,50,47,0.2)]'
                }`}
              />
            ))}
          </div>
          
          {/* Right: Start Over Button - Always visible */}
          <button
            onClick={() => {
              localStorage.removeItem('onboarding-data')
              setGeneratedData(null)
              updateStep(1)
            }}
            className="text-xs text-[#605A57] hover:text-destructive transition-colors px-3 py-1.5 rounded-lg border border-[rgba(55,50,47,0.08)] hover:border-destructive"
          >
            Start Over
          </button>
        </div>
      </div>
      
      {/* Main Content - Full Screen Magic */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-20 relative z-10">
        <div className="w-full">
          {/* Magical transition wrapper */}
          <div 
            key={currentStep}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-primary/20"></div>
                </div>
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
                    <p className="text-muted-foreground mb-4 text-sm">Let's start building your backend.</p>
                    <button 
                      onClick={() => updateStep(1)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-105 text-sm font-medium shadow-lg shadow-primary/25"
                    >
                      Begin
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
