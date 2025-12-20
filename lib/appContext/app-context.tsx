"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useRef } from 'react'
import { useApiAuth } from '@/hooks/useApiAuth'
import { useUser as useClerkUser } from '@clerk/nextjs'
import {
  hybridStorage,
  saveOnboardingData,
  loadOnboardingData,
  clearOnboardingData,
  updateOnboardingDataFields,
  saveDecisions,
  loadDecisions,
  clearDecisions,
  updateDecisionsField,
  deleteProject as deleteProjectStorage,
  renameProject as renameProjectStorage,
  cleanupAfterOnboarding
} from './storage-utils'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export const ProjectStatus = {
  DRAFT: 'draft' as const,
  BUILDING: 'building' as const,
  DEPLOYED: 'deployed' as const,
  ERROR: 'error' as const
}

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus]

export const DeploymentStatus = {
  DEPLOYING: 'deploying' as const,
  DEPLOYED: 'deployed' as const,
  FAILED: 'failed' as const
}

export type DeploymentStatus = typeof DeploymentStatus[keyof typeof DeploymentStatus]

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  username?: string
  createdAt?: string
  updatedAt?: string
}

import type { SystemArchitecture } from './types/architecture'
import type { SystemDecisionsSummary } from './types/system-decisions'

export interface GeneratedData {
  projectName?: string
  customProjectName?: string
  description: string
  schemas: any[]
  analysis?: any
  database: string
  endpoints: any[]
  architecture?: any
  decisions?: any
  selectedTools?: Record<string, string>
  lld?: any
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
  userId?: string
  deployments?: any[]
  schema: TableSchema[]
  endpoints: ApiEndpoint[]
  database: DatabaseConfig
  deployment?: DeploymentInfo
  architecture?: SystemArchitecture
  decisions?: SystemDecisionsSummary
  selectedTools?: Record<string, string>
  analysis?: any
  generatedCode?: any
  generatedIaC?: any
}

export interface TableSchema {
  id: string
  name: string
  description: string
  fields: FieldSchema[]
  relationships: Relationship[]
  indexes: Index[]
  position?: { x: number; y: number }
  color?: string
  estimatedRows?: number
  updatedAt?: Date
}

export type FieldType =
  | 'Text' | 'Textarea' | 'Number' | 'Decimal' | 'Email'
  | 'Password' | 'Date' | 'DateTime' | 'Boolean'
  | 'JSON' | 'File' | 'UUID' | 'Enum'

export interface ValidationRule {
  type: 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'custom'
  value: string | number
  message?: string
}

export interface FieldSchema {
  id: string
  name: string
  type: FieldType
  isPrimary?: boolean
  isRequired?: boolean
  isUnique?: boolean
  isForeignKey?: boolean
  defaultValue?: any
  description?: string
  validation?: ValidationRule[]
  enumOptions?: string[]
  hasIndex?: boolean
  maxFileSize?: number
  acceptedFileTypes?: string[]
}

export interface Relationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  targetTable: string
  sourceField: string
  targetField: string
}

export interface Index {
  name: string
  fields: string[]
  isUnique: boolean
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  group: string
  auth: boolean
  parameters: string[]
  responses: Record<string, any>
}

export type DatabaseType =
  | 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
  | 'redis' | 'pinecone' | 'influxdb' | 'elasticsearch'

export interface DatabaseConfig {
  type: DatabaseType
  host?: string
  port?: number
  database?: string
  credentials?: {
    username: string
    password: string
  }
  reasoning?: string
  features?: string[]
  confidence?: number
}

export interface DeploymentInfo {
  url: string
  status: DeploymentStatus
  lastDeploy: Date
  environment: 'development' | 'staging' | 'production'
}

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tablesGenerated?: number
    endpointsCreated?: number
    action?: 'schema_update' | 'endpoint_create' | 'deployment'
  }
}

export interface AppState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  hasCompletedOnboarding: boolean
  currentProject: Project | null
  projects: Project[]
  chatMessages: ChatMessage[]
  isAiTyping: boolean
  sidebarCollapsed: boolean
  activeTab: 'schema' | 'api' | 'analytics'
  previewPanelCollapsed: boolean
  searchQuery: string
  selectedTables: string[]
  onboardingData: GeneratedData | null
  onboardingStep: number
}

// ============================================================================
// ACTIONS
// ============================================================================

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> & { id: string } }
  | { type: 'RENAME_PROJECT'; payload: { id: string; name: string } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'LOAD_PROJECT_CHAT'; payload: ChatMessage[] }
  | { type: 'SET_AI_TYPING'; payload: boolean }
  | { type: 'CLEAR_CHAT' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_TAB'; payload: 'schema' | 'api' | 'analytics' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_SCHEMA'; payload: TableSchema[] }
  | { type: 'UPDATE_ENDPOINTS'; payload: ApiEndpoint[] }
  | { type: 'UPDATE_DATABASE'; payload: DatabaseConfig }
  | { type: 'UPDATE_ARCHITECTURE'; payload: SystemArchitecture }
  | { type: 'UPDATE_DECISIONS'; payload: { decisions: SystemDecisionsSummary; selectedTools?: Record<string, string> } }
  | { type: 'SET_ONBOARDING_DATA'; payload: GeneratedData | null }
  | { type: 'SET_ONBOARDING_STEP'; payload: number }
  | { type: 'CLEAR_ONBOARDING_DATA' }
  | { type: 'UPDATE_ONBOARDING_DATA'; payload: Partial<GeneratedData> }
  | { type: 'LOAD_PROJECTS'; payload: Project[] }

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasCompletedOnboarding: false,
  currentProject: null,
  projects: [],
  chatMessages: [],
  isAiTyping: false,
  sidebarCollapsed: false,
  activeTab: 'schema',
  previewPanelCollapsed: false,
  searchQuery: '',
  selectedTables: [],
  onboardingData: null,
  onboardingStep: 1
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function safeSerialize<T>(obj: T): T {
  const seen = new WeakSet()
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined
      }
      seen.add(value)
    }
    return value
  }))
}

function deepEqual(obj1: any, obj2: any): boolean {
  try {
    return JSON.stringify(safeSerialize(obj1)) === JSON.stringify(safeSerialize(obj2))
  } catch {
    return false
  }
}

// ============================================================================
// REDUCER
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'SET_ONBOARDING_COMPLETE':
      return {
        ...state,
        hasCompletedOnboarding: action.payload
      }

    case 'SET_CURRENT_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        chatMessages: []
      }

    case 'ADD_PROJECT':
      const existingProject = state.projects.find(p => p.id === action.payload.id)
      if (existingProject) {
        return {
          ...state,
          currentProject: action.payload,
          chatMessages: []
        }
      }
      return {
        ...state,
        projects: [...state.projects, action.payload],
        currentProject: action.payload,
        chatMessages: []
      }

    case 'LOAD_PROJECTS':
      return {
        ...state,
        projects: action.payload
      }

    case 'UPDATE_PROJECT':
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id
          ? { ...project, ...action.payload, updatedAt: new Date() }
          : project
      )

      return {
        ...state,
        projects: updatedProjects,
        currentProject: state.currentProject?.id === action.payload.id
          ? { ...state.currentProject, ...action.payload, updatedAt: new Date() }
          : state.currentProject
      }

    case 'RENAME_PROJECT':
      const renamedProjects = state.projects.map(project =>
        project.id === action.payload.id
          ? { ...project, name: action.payload.name, updatedAt: new Date() }
          : project
      )

      return {
        ...state,
        projects: renamedProjects,
        currentProject: state.currentProject?.id === action.payload.id
          ? { ...state.currentProject, name: action.payload.name, updatedAt: new Date() }
          : state.currentProject
      }

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject
      }

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      }

    case 'LOAD_PROJECT_CHAT':
      return {
        ...state,
        chatMessages: action.payload
      }

    case 'SET_AI_TYPING':
      return {
        ...state,
        isAiTyping: action.payload
      }

    case 'CLEAR_CHAT':
      return {
        ...state,
        chatMessages: []
      }

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      }

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      }

    case 'UPDATE_SCHEMA':
      if (!state.currentProject) return state
      if (deepEqual(state.currentProject.schema, action.payload)) {
        return state
      }
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          schema: action.payload,
          updatedAt: new Date()
        }
      }

    case 'UPDATE_ENDPOINTS':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          endpoints: action.payload,
          updatedAt: new Date()
        }
      }

    case 'UPDATE_DATABASE':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          database: action.payload,
          updatedAt: new Date()
        }
      }

    case 'UPDATE_ARCHITECTURE':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          architecture: action.payload,
          updatedAt: new Date()
        }
      }

    case 'UPDATE_DECISIONS':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          decisions: action.payload.decisions,
          selectedTools: action.payload.selectedTools || state.currentProject.selectedTools,
          updatedAt: new Date()
        }
      }

    case 'SET_ONBOARDING_DATA':
      return {
        ...state,
        onboardingData: action.payload
      }

    case 'SET_ONBOARDING_STEP':
      return {
        ...state,
        onboardingStep: action.payload
      }

    case 'CLEAR_ONBOARDING_DATA':
      return {
        ...state,
        onboardingData: null,
        onboardingStep: 1
      }

    case 'UPDATE_ONBOARDING_DATA':
      return {
        ...state,
        onboardingData: state.onboardingData
          ? { ...state.onboardingData, ...action.payload }
          : null
      }

    default:
      return state
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const initializedRef = useRef(false)

  useApiAuth()
  const { user: clerkUser, isLoaded } = useClerkUser()

  // Initialize hybrid storage
  useEffect(() => {
    if (clerkUser?.id) {
      hybridStorage.initialize(clerkUser.id)
    }
  }, [clerkUser?.id])

  // Load initial data
  useEffect(() => {
    if (initializedRef.current || !clerkUser?.id || !isLoaded) return

    async function loadInitialData() {
      try {
        console.log('🔄 Loading initial data for user:', clerkUser.id)

        // Load preferences
        const preferences = await hybridStorage.load<any>('user_preferences')
        if (preferences) {
          if (preferences.sidebarCollapsed) {
            dispatch({ type: 'TOGGLE_SIDEBAR' })
          }
          if (preferences.activeTab) {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: preferences.activeTab })
          }
        }

        // Load onboarding data
        let onboardingData = null
        let onboardingStep = 1

        try {
          const localData = localStorage.getItem('onboardingData')
          const localStep = localStorage.getItem('onboardingStep')

          if (localData) {
            onboardingData = JSON.parse(localData)
            onboardingStep = localStep ? parseInt(localStep) : 1
            console.log('✅ Loaded onboarding from localStorage')
          }
        } catch (error) {
          console.error('Failed to load from localStorage:', error)
        }

        if (!onboardingData) {
          onboardingData = await hybridStorage.load<any>('onboardingData')
          onboardingStep = await hybridStorage.load<number>('onboardingStep') || 1

          if (onboardingData) {
            console.log('✅ Loaded onboarding from DynamoDB')
            localStorage.setItem('onboardingData', JSON.stringify(onboardingData))
            localStorage.setItem('onboardingStep', onboardingStep.toString())
          }
        }

        if (onboardingData) {
          dispatch({ type: 'SET_ONBOARDING_DATA', payload: onboardingData })
          dispatch({ type: 'SET_ONBOARDING_STEP', payload: onboardingStep })
        }

        // Load projects
        const projects = await hybridStorage.loadProjects()
        console.log('✅ Loaded projects:', projects.length)
        dispatch({ type: 'LOAD_PROJECTS', payload: projects })

        initializedRef.current = true
        console.log('✅ Initial data load complete')
      } catch (error) {
        console.error('❌ Failed to load initial data:', error)
        initializedRef.current = true
      }
    }

    loadInitialData()
  }, [clerkUser?.id, isLoaded])

  // Auto-save effects (debounced)
  const onboardingSaveTimeoutRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (!initializedRef.current) return

    if (state.onboardingData) {
      if (onboardingSaveTimeoutRef.current) {
        clearTimeout(onboardingSaveTimeoutRef.current)
      }

      onboardingSaveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Auto-saving onboarding data')
        try {
          localStorage.setItem('onboardingData', JSON.stringify(state.onboardingData))
          localStorage.setItem('onboardingStep', state.onboardingStep.toString())
        } catch (error) {
          console.error('Failed to save to localStorage:', error)
        }
        hybridStorage.save('onboardingData', state.onboardingData, 'high')
        hybridStorage.save('onboardingStep', state.onboardingStep, 'high')
      }, 500)
    }

    return () => {
      if (onboardingSaveTimeoutRef.current) {
        clearTimeout(onboardingSaveTimeoutRef.current)
      }
    }
  }, [state.onboardingData, state.onboardingStep])

  // Auto-save current project
  const projectSaveTimeoutRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (state.currentProject) {
      if (projectSaveTimeoutRef.current) {
        clearTimeout(projectSaveTimeoutRef.current)
      }

      projectSaveTimeoutRef.current = setTimeout(() => {
        console.log('💾 Auto-saving current project:', state.currentProject)
        const projectKey = `project:${state.currentProject!.id}`
        hybridStorage.save(projectKey, state.currentProject, 'high')
        hybridStorage.save('projects', state.projects, 'normal')
      }, 1000)
    }

    return () => {
      if (projectSaveTimeoutRef.current) {
        clearTimeout(projectSaveTimeoutRef.current)
      }
    }
  }, [state.currentProject, state.projects])

  // Load chat messages
  useEffect(() => {
    if (state.currentProject) {
      hybridStorage.loadChatMessages(state.currentProject.id).then(messages => {
        dispatch({ type: 'LOAD_PROJECT_CHAT', payload: messages })
      })
    }
  }, [state.currentProject?.id])

  // Auto-save chat messages
  const chatSaveTimeoutRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (state.currentProject && state.chatMessages.length > 0) {
      if (chatSaveTimeoutRef.current) {
        clearTimeout(chatSaveTimeoutRef.current)
      }

      chatSaveTimeoutRef.current = setTimeout(() => {
        const lastMessage = state.chatMessages[state.chatMessages.length - 1]
        const chatKey = `chat:${state.currentProject!.id}`
        hybridStorage.save(chatKey, lastMessage, 'normal')
      }, 300)
    }

    return () => {
      if (chatSaveTimeoutRef.current) {
        clearTimeout(chatSaveTimeoutRef.current)
      }
    }
  }, [state.chatMessages.length, state.currentProject?.id])

  // Save preferences
  const prefSaveTimeoutRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (prefSaveTimeoutRef.current) {
      clearTimeout(prefSaveTimeoutRef.current)
    }

    prefSaveTimeoutRef.current = setTimeout(() => {
      const preferences = {
        sidebarCollapsed: state.sidebarCollapsed,
        activeTab: state.activeTab
      }
      hybridStorage.save('user_preferences', preferences, 'low')
    }, 500)

    return () => {
      if (prefSaveTimeoutRef.current) {
        clearTimeout(prefSaveTimeoutRef.current)
      }
    }
  }, [state.sidebarCollapsed, state.activeTab])

  // Sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        hybridStorage.syncNow()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      hybridStorage.syncNow()
      hybridStorage.destroy()
    }
  }, [])

  const contextValue = useMemo(() => ({ state, dispatch }), [state])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export function useUser() {
  const { state } = useAppContext()
  return state.user
}

export function useCurrentProject() {
  const { state } = useAppContext()
  return state.currentProject
}

export function useChatMessages() {
  const { state } = useAppContext()
  return state.chatMessages
}

export function useOnboardingData() {
  const { state, dispatch } = useAppContext()

  return {
    data: state.onboardingData,
    step: state.onboardingStep,

    setData: (data: GeneratedData | null) =>
      dispatch({ type: 'SET_ONBOARDING_DATA', payload: data }),

    setStep: (step: number) =>
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: step }),

    updateData: async (updates: Partial<GeneratedData>) => {
      dispatch({ type: 'UPDATE_ONBOARDING_DATA', payload: updates })
      try {
        await updateOnboardingDataFields(updates)
      } catch (error) {
        console.error('Failed to update onboarding data fields:', error)
      }
    },

    updateDataSync: async (updates: Partial<GeneratedData>) => {
      const result = await updateOnboardingDataFields(updates)
      if (result.success) {
        dispatch({ type: 'UPDATE_ONBOARDING_DATA', payload: updates })
      }
      return result
    },

    clearData: async () => {
      await clearOnboardingData()
      dispatch({ type: 'CLEAR_ONBOARDING_DATA' })
    },

    reloadData: async () => {
      const result = await loadOnboardingData()
      if (result.success && result.data) {
        dispatch({ type: 'SET_ONBOARDING_DATA', payload: result.data })
        dispatch({ type: 'SET_ONBOARDING_STEP', payload: result.step })
      }
      return result
    }
  }
}

export function useProjectActions() {
  const { dispatch } = useAppContext()

  return {
    deleteProject: async (projectId: string) => {
      const result = await deleteProjectStorage(projectId)
      if (result.success) {
        dispatch({ type: 'DELETE_PROJECT', payload: projectId })
      }
      return result
    },
    renameProject: async (projectId: string, newName: string) => {
      const result = await renameProjectStorage(projectId, newName)
      if (result.success) {
        dispatch({ type: 'RENAME_PROJECT', payload: { id: projectId, name: newName } })
      }
      return result
    }
  }
}

export function useDecisions() {
  const { state, dispatch } = useAppContext()

  return {
    decisions: state.currentProject?.decisions || null,
    selectedTools: state.currentProject?.selectedTools || {},

    setDecisions: (decisions: SystemDecisionsSummary, selectedTools: Record<string, string>) => {
      saveDecisions(decisions, selectedTools)
      dispatch({
        type: 'UPDATE_DECISIONS',
        payload: { decisions, selectedTools }
      })
    },

    updateDecision: (updates: {
      decisions?: SystemDecisionsSummary,
      selectedTools?: Record<string, string>
    }) => {
      updateDecisionsField(updates)
      if (updates.decisions || updates.selectedTools) {
        dispatch({
          type: 'UPDATE_DECISIONS',
          payload: {
            decisions: updates.decisions || state.currentProject?.decisions!,
            selectedTools: updates.selectedTools || state.currentProject?.selectedTools
          }
        })
      }
    },

    clearDecisions: () => {
      clearDecisions()
    },

    loadDecisions: () => {
      return loadDecisions()
    }
  }
}

export function useSyncControl() {
  return {
    syncNow: () => hybridStorage.syncNow(),
  }
}


export function useOnboardingLifecycle() {
  const { state, dispatch } = useAppContext()

  return {
    // Check if user has completed onboarding
    hasCompletedOnboarding: state.hasCompletedOnboarding,

    // Current onboarding data
    onboardingData: state.onboardingData,
    onboardingStep: state.onboardingStep,

    /**
     * Complete onboarding and clean up all temporary data
     * @param projectId - Optional project ID to also clean up chat messages
     */
    completeOnboarding: async (projectId?: string) => {
      try {
        console.log('🎉 Completing onboarding...')

        // 1. Mark onboarding as complete in state
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true })

        // 2. Clear onboarding data from state
        dispatch({ type: 'CLEAR_ONBOARDING_DATA' })

        // 3. Clean up from storage (localStorage + DynamoDB/S3)
        const cleanupResult = await cleanupAfterOnboarding(projectId)

        if (cleanupResult.success) {
          console.log('✅ Onboarding completed and cleaned up successfully')
          return { success: true, message: cleanupResult.message }
        } else {
          console.warn('⚠️ Onboarding completed but cleanup had issues:', cleanupResult.message)
          return { success: false, message: cleanupResult.message }
        }
      } catch (error) {
        console.error('❌ Failed to complete onboarding:', error)
        return {
          success: false,
          message: `Failed to complete onboarding: ${error}`
        }
      }
    },

    /**
     * Abort onboarding and clean up data
     * Use this if user cancels during onboarding
     */
    abortOnboarding: async (projectId?: string) => {
      try {
        console.log('❌ Aborting onboarding...')

        // Clear from state
        dispatch({ type: 'CLEAR_ONBOARDING_DATA' })

        // Clean up storage
        await cleanupAfterOnboarding(projectId)

        return { success: true }
      } catch (error) {
        console.error('Failed to abort onboarding:', error)
        return { success: false, error }
      }
    },

    /**
     * Reset onboarding (restart from beginning)
     * This clears data but doesn't mark as complete
     */
    resetOnboarding: async () => {
      try {
        console.log('🔄 Resetting onboarding...')

        // Clear from state
        dispatch({ type: 'CLEAR_ONBOARDING_DATA' })

        // Clean up storage
        await cleanupAfterOnboarding()

        // Reset to step 1
        dispatch({ type: 'SET_ONBOARDING_STEP', payload: 1 })

        return { success: true }
      } catch (error) {
        console.error('Failed to reset onboarding:', error)
        return { success: false, error }
      }
    }
  }
}

/**
 * Hook specifically for cleanup operations
 */
export function useCleanup() {
  return {
    /**
     * Clean up all onboarding data
     */
    cleanupOnboarding: async (projectId?: string) => {
      return await cleanupAfterOnboarding(projectId)
    },

    /**
     * Clean up project-specific data
     */
    cleanupProject: async (projectId: string) => {
      try {
        // Delete from storage
        await hybridStorage.delete(`project:${projectId}`)

        // Clean up chat
        await hybridStorage.delete(`chat_${projectId}`)

        return { success: true }
      } catch (error) {
        console.error('Failed to cleanup project:', error)
        return { success: false, error }
      }
    }
  }
}