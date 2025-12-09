"use client"

import { useState, useEffect } from "react"
import { StepOne } from "@/components/onboarding/step-one"
import { StepTwo } from "@/components/onboarding/step-two"
import { StepThree } from "@/components/onboarding/step-three"
import { StepFour } from "@/components/onboarding/step-four"
import { StepFive } from "@/components/onboarding/step-five"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, Database, Rocket, Network, Settings, FileCode } from "lucide-react"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern"
import { useAppContext, useOnboardingData } from "@/lib/appContext/app-context"
import type { Project, TableSchema, ChatMessage } from "@/lib/appContext/app-context"
import { createProject as createProjectAPI, isBackendAvailable } from "@/lib/api-client"
import { markOnboardingComplete } from "@/lib/storage"
import { ProjectNameDialog } from "@/components/project-name-dialog"
import Image from "next/image"
import Link from "next/link"
import { LLDStep } from "./lld-step"

export function OnboardingFlow() {
  const [isLoading, setIsLoading] = useState(true)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()
  const { data: generatedData, step: currentStep, setData, setStep, updateData, clearData } = useOnboardingData()
  const totalSteps = 6

  console.log('OnboardingFlow render:', { currentStep, hasData: !!generatedData, isInitialized })

  // Initialize state from AppContext and URL - WAIT for data to load
  useEffect(() => {
    // Prevent double initialization
    if (isInitialized) return

    // Wait a tick to ensure AppProvider has loaded data from storage
    const initTimer = setTimeout(async () => {
      const stepFromUrl = searchParams.get('step')
      const stepNumber = stepFromUrl ? parseInt(stepFromUrl, 10) : null

      console.log('Initializing onboarding:', {
        stepFromUrl: stepNumber,
        contextStep: currentStep,
        hasData: !!generatedData
      })

      // Determine the correct step
      let validStep: number

      if (stepNumber && stepNumber >= 1 && stepNumber <= totalSteps) {
        // URL has explicit step - validate against data
        if (stepNumber > 1 && !generatedData) {
          console.log('URL step > 1 but no data, resetting to step 1')
          validStep = 1
        } else {
          validStep = stepNumber
        }
      } else {
        // No URL step, use context step
        if (currentStep > 1 && !generatedData) {
          console.log('Context step > 1 but no data, resetting to step 1')
          validStep = 1
        } else {
          validStep = currentStep
        }
      }

      console.log('Final validated step:', validStep)

      // Update step in context if needed
      if (validStep !== currentStep) {
        setStep(validStep)
      }

      // Update URL to match
      const url = new URL(window.location.href)
      url.searchParams.set('step', validStep.toString())
      router.replace(url.pathname + url.search, { scroll: false })

      setIsInitialized(true)
      setIsLoading(false)
    }, 100) // Small delay to let AppProvider finish loading

    return () => clearTimeout(initTimer)
  }, []) // Run ONCE on mount

  // Sync URL when step changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return

    const url = new URL(window.location.href)
    const currentUrlStep = url.searchParams.get('step')

    if (currentUrlStep !== currentStep.toString()) {
      url.searchParams.set('step', currentStep.toString())
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [currentStep, isInitialized, router])

  // Function to update step in context
  const updateStep = (step: number) => {
    console.log('Updating step to:', step)
    setStep(step)
  }

  const handleStepComplete = async (data?: any) => {
    console.log('Step complete:', { currentStep, hasData: !!data })

    // Filter out React synthetic events
    const isValidData = data &&
      typeof data === 'object' &&
      !data.nativeEvent &&
      !data._reactName &&
      Object.keys(data).length > 0

    if (currentStep === 1 && isValidData) {
      // Save generated data from AI - force immediate sync
      console.log('Saving step 1 data:', data)
      setData(data)

      // Force localStorage save immediately
      try {
        localStorage.setItem("onboardingData", JSON.stringify(data))
        localStorage.setItem("onboardingStep", "2")
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    } else if (currentStep === 6 && isValidData) {
      console.log('Saving final decisions:', data.decisions)
      await updateData({
        decisions: data.decisions,
        selectedTools: data.selectedTools
      })

      // Force save before showing dialog
      try {
        const currentData = JSON.parse(localStorage.getItem("onboardingData") || "{}")
        const updated = {
          ...currentData,
          decisions: data.decisions,
          selectedTools: data.selectedTools
        }
        localStorage.setItem("onboardingData", JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save decisions:', error)
      }

      setShowNameDialog(true)
      return
    } else if (isValidData) {
      console.log('Updating data for step:', currentStep)
      await updateData(data)
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

  // Function to create project and initiate chat conversation
  const createProjectAndChat = async () => {
    console.log('this is generated data before', generatedData)
    if (!generatedData) {
      console.error('No data available to create project')
      router.push('/dashboard')
      return
    }

    try {
      console.log('🚀 Creating project with backend integration...')

      // Convert generated schemas to TableSchema format
      const tables: TableSchema[] = generatedData.schemas?.map((schema: any, index: number) => ({
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

      // Flatten grouped endpoints
      const flattenedEndpoints = Array.isArray(generatedData.endpoints)
        ? generatedData.endpoints.flatMap((group: any) =>
          Array.isArray(group.endpoints)
            ? group.endpoints.map((endpoint: any) => ({
              ...endpoint,
              group: group.group || 'General',
            }))
            : []
        )
        : []

      // Generate smart project name
      const generateProjectName = (description: string): string => {
        if (!description) return 'My Project'

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

        if (words.length > 0) {
          return words.join(' ') + (words.length === 1 ? ' App' : '')
        }

        return 'My Project'
      }

      const makeUniqueProjectName = (baseName: string): string => {
        const existingNames = state.projects.map(p => p.name)
        if (!existingNames.includes(baseName)) {
          return baseName
        }

        let counter = 2
        let candidateName = `${baseName} ${counter}`
        while (existingNames.includes(candidateName)) {
          counter++
          candidateName = `${baseName} ${counter}`
        }
        return candidateName
      }

      const baseName = generatedData.customProjectName || generateProjectName(generatedData.description || '')
      const projectName = makeUniqueProjectName(baseName)

      const backendAvailable = await isBackendAvailable()
      console.log('Backend availability:', backendAvailable)

      let project: Project

      if (backendAvailable) {
        try {
          console.log('📡 Calling backend API to create project...')
          const backendProject = await createProjectAPI({
            name: projectName,
            specialParam: "uday",
            diagrams: generatedData.diagrams,
            description: generatedData.description || 'Generated from onboarding',
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
              type: generatedData.database?.toLowerCase() || 'postgresql',
              reasoning: `Recommended for this use case`,
              confidence: 0.9,
              features: ['ACID compliance', 'Complex queries', 'Scalability']
            },
            architecture: generatedData.architecture,
            decisions: generatedData.decisions,
            selectedTools: generatedData.selectedTools,
            analysis: generatedData.analysis
          })

          project = {
            ...backendProject,
            schema: tables,
            endpoints: flattenedEndpoints,
            database: {
              type: generatedData.database?.toLowerCase() || 'postgresql',
              reasoning: `Recommended for this use case`,
              confidence: 0.9,
              features: ['ACID compliance', 'Complex queries', 'Scalability']
            },
            architecture: generatedData.architecture,
            decisions: generatedData.decisions,
            selectedTools: generatedData.selectedTools,
            analysis: generatedData.analysis
          }

          console.log('✅ Project created in backend:', project.id)
        } catch (error) {
          console.error('❌ Backend failed, falling back to local:', error)
          project = {
            id: `project_${Date.now()}`,
            name: projectName,
            description: generatedData.description || 'Generated from onboarding',
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            schema: tables,
            endpoints: flattenedEndpoints,
            database: {
              type: generatedData.database?.toLowerCase() || 'postgresql',
              reasoning: `Recommended for this use case`,
              confidence: 0.9,
              features: ['ACID compliance', 'Complex queries', 'Scalability']
            },
            diagrams: generatedData.diagrams,
            architecture: generatedData.architecture,
            decisions: generatedData.decisions,
            selectedTools: generatedData.selectedTools,
            analysis: generatedData.analysis
          }
        }
      } else {
        console.log('⚠️ Backend not available, creating locally')
        project = {
          id: `project_${Date.now()}`,
          name: projectName,
          specialParam: "uday",
          description: generatedData.description || 'Generated from onboarding',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
          schema: tables,
          endpoints: flattenedEndpoints,
          database: {
            type: generatedData.database?.toLowerCase() || 'postgresql',
            reasoning: `Recommended for this use case`,
            confidence: 0.9,
            features: ['ACID compliance', 'Complex queries', 'Scalability']
          },
          diagrams: generatedData.diagrams,
          architecture: generatedData.architecture,
          decisions: generatedData.decisions,
          selectedTools: generatedData.selectedTools,
          analysis: generatedData.analysis
        }
      }

      // Add project to state
      dispatch({ type: 'ADD_PROJECT', payload: project })

      // Create chat messages
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: generatedData.description || 'Create my backend project',
        timestamp: new Date(),
      }

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `Perfect! I've created your backend: **${project.name}**

**Database:** ${project.database.type.toUpperCase()}
**Tables:** ${tables.length}

${tables.length > 0 ? `**Generated Tables:**\n${tables.map(t => `• ${t.name} (${t.fields.length} fields)`).join('\n')}` : ''}

Your backend is ready! You can view the schema, generate code, or continue chatting.`,
        timestamp: new Date(),
        metadata: {
          tablesGenerated: tables.length,
          endpointsCreated: flattenedEndpoints.length,
          action: 'schema_update'
        }
      }

      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage })
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMessage })

      // Mark onboarding complete and clear data
      markOnboardingComplete()
      // clearData()
      // localStorage.removeItem('onboarding-decisions')

      router.push(`/projects/${project.id}`)

    } catch (error) {
      console.error('Failed to create project:', error)
      markOnboardingComplete()
      clearData()
      // localStorage.removeItem('onboarding-decisions')
      router.push('/dashboard')
    }
  }


  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-primary/20"></div>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <GridPattern
        width={60}
        height={60}
        strokeDasharray="4 4"
        className="opacity-30"
      />

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[rgba(55,50,47,0.08)]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
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

          {/* Progress Dots */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`transition-all duration-300 rounded-full ${step < currentStep
                  ? 'w-2 h-2 bg-[#005BE3]'
                  : step === currentStep
                    ? 'w-8 h-2 bg-[#005BE3]'
                    : 'w-2 h-2 bg-[rgba(55,50,47,0.2)]'
                  }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Progress saved! Resume later from where you left off.')
                router.push('/dashboard')
              }}
              className="text-xs text-[#005BE3] hover:text-[#004CC2] transition-colors px-3 py-1.5 rounded-lg border border-[#005BE3]/20 hover:border-[#005BE3] hover:bg-[#005BE3]/5 font-medium"
            >
              Save & Resume Later
            </button>
            <button
              onClick={() => {
                if (confirm('Start over? This will delete all progress.')) {
                  clearData()
                  updateStep(1)
                }
              }}
              className="text-xs text-[#605A57] hover:text-destructive transition-colors px-3 py-1.5 rounded-lg border border-[rgba(55,50,47,0.08)] hover:border-destructive"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-20 relative z-10">
        <div className="w-full">
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
                  <StepFour data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
                )}
                {currentStep === 3 && generatedData && (
                  <StepTwo data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
                )}
                {currentStep === 4 && generatedData && (
                  <StepThree data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
                )}
                {currentStep === 5 && generatedData && (
                  <LLDStep data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
                )}
                {currentStep === 6 && generatedData && (
                  <StepFive data={generatedData} onComplete={handleStepComplete} onBack={handleBack} />
                )}
                {(currentStep >= 2 && currentStep <= 6) && !generatedData && (
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

      <ProjectNameDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
        onConfirm={(name) => {
          updateData({ customProjectName: name })
          createProjectAndChat()
        }}
        currentName={generatedData?.customProjectName || ''}
        existingNames={state.projects.map(p => p.name)}
        mode="create"
      />
    </div>
  )
}