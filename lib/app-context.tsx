"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react'

import { useApiAuth } from '@/hooks/useApiAuth'

// Helper function to serialize data safely (removes circular refs and converts Dates)
function safeSerialize<T>(obj: T): T {
  const seen = new WeakSet()

  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString()
    }

    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined // Remove circular reference
      }
      seen.add(value)
    }

    return value
  }))
}

// Helper to compare objects deeply (ignoring functions and circular refs)
function deepEqual(obj1: any, obj2: any): boolean {
  try {
    return JSON.stringify(safeSerialize(obj1)) === JSON.stringify(safeSerialize(obj2))
  } catch {
    return false
  }
}

// Types
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

export interface DatabaseSchema {
  id: string
  name: string
  tables: TableSchema[]
  relationships?: Relationship[]
  version?: string
}

export interface Deployment {
  id: string
  projectId: string
  status: DeploymentStatus
  environment: 'development' | 'staging' | 'production'
  createdAt: string
  updatedAt: string
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

// Actions
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
  | { type: 'CLEAR_CHAT'; payload: void }
  | { type: 'TOGGLE_SIDEBAR'; payload: void }
  | { type: 'SET_ACTIVE_TAB'; payload: 'schema' | 'api' | 'analytics' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_SCHEMA'; payload: TableSchema[] }
  | { type: 'UPDATE_ENDPOINTS'; payload: ApiEndpoint[] }
  | { type: 'UPDATE_DATABASE'; payload: DatabaseConfig }
  | { type: 'UPDATE_ARCHITECTURE'; payload: SystemArchitecture }
  | { type: 'UPDATE_DECISIONS'; payload: { decisions: SystemDecisionsSummary; selectedTools?: Record<string, string> } }
  | { type: 'SET_ONBOARDING_DATA'; payload: GeneratedData | null }
  | { type: 'SET_ONBOARDING_STEP'; payload: number }
  | { type: 'CLEAR_ONBOARDING_DATA'; payload: void }
  | { type: 'UPDATE_ONBOARDING_DATA'; payload: Partial<GeneratedData> }
  | { type: 'LOAD_PROJECTS'; payload: Project[] }

// Initial state
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

async function updateOnboardingDataFields(updates: Partial<GeneratedData>) {
  try {
    const existing = JSON.parse(localStorage.getItem("onboardingData") || "{}")

    const updated = {
      ...existing,
      ...updates
    }

    localStorage.setItem("onboardingData", JSON.stringify(updated))

    return { success: true, data: updated }
  } catch (error) {
    console.error("Failed to update onboarding fields:", error)
    return { success: false }
  }
}

export function loadUserPreferences() {
  try {
    const raw = localStorage.getItem("user_preferences")
    if (!raw) {
      return { sidebarCollapsed: false, activeTab: "schema" }
    }
    const parsed = JSON.parse(raw)
    return {
      sidebarCollapsed: parsed.sidebarCollapsed ?? false,
      activeTab: parsed.activeTab ?? "schema"
    }
  } catch (err) {
    console.error("Failed to load user preferences:", err)
    return { sidebarCollapsed: false, activeTab: "schema" }
  }
}

export function saveUserPreferences(preferences: {
  sidebarCollapsed: boolean
  activeTab: string
}) {
  try {
    localStorage.setItem("user_preferences", JSON.stringify(preferences))
    return true
  } catch (err) {
    console.error("Failed to save user preferences:", err)
    return false
  }
}



export function updateOnboardingStep(step: number) {
  try {
    localStorage.setItem("onboardingStep", step.toString())
    return true
  } catch (error) {
    console.error("Failed to update onboarding step:", error)
    return false
  }
}




// Reducer
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

      // Use deep equality check instead of shallow comparison
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

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const initializedRef = React.useRef(false)

  useApiAuth()

  // Load initial data from Supabase on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true



    async function loadInitialData() {
      try {
        // Load user preferences

        const preferences = await loadUserPreferences()
        if (preferences.sidebarCollapsed) {
          dispatch({ type: 'TOGGLE_SIDEBAR' })
        }
        if (preferences.activeTab) {
          dispatch({ type: 'SET_ACTIVE_TAB', payload: preferences.activeTab })
        }

        console.log('use effect runned')


        // Load onboarding data
        const onboardingResult = loadOnboardingData()
        if (onboardingResult.success && onboardingResult.data) {
          dispatch({ type: 'SET_ONBOARDING_DATA', payload: onboardingResult.data })
          dispatch({ type: 'SET_ONBOARDING_STEP', payload: onboardingResult.step })
        }

        // Load all projects
        const projects = await loadProjects()
        dispatch({ type: 'LOAD_PROJECTS', payload: projects })
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()
  }, [])

  // Save onboarding data to Supabase when it changes (with debouncing)
  const previousOnboardingDataRef = React.useRef<string | null>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (state.onboardingData) {
      try {
        // Serialize safely to avoid circular references
        const serialized = safeSerialize(state.onboardingData)
        const currentDataString = JSON.stringify(serialized)

        // Only save if data actually changed
        if (previousOnboardingDataRef.current !== currentDataString) {
          previousOnboardingDataRef.current = currentDataString

          // Debounce saves to avoid too many writes
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }

          saveTimeoutRef.current = setTimeout(() => {
            saveOnboardingData(serialized, state.onboardingStep).catch(error => {
              console.error('Failed to save onboarding data:', error)
            })
          }, 500)
        }
      } catch (error) {
        console.error('Failed to serialize onboarding data:', error)
      }
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state.onboardingData, state.onboardingStep])

  // Save step changes separately
  const previousStepRef = React.useRef<number>(1)
  useEffect(() => {
    if (state.onboardingStep !== previousStepRef.current && state.onboardingData) {
      previousStepRef.current = state.onboardingStep
      updateOnboardingStep(state.onboardingStep).catch(error => {
        console.error('Failed to update onboarding step:', error)
      })
    }
  }, [state.onboardingStep])

  async function updateOnboardingStep(step: number) {
    step++;
    return true;
  }


  async function loadUserPreferences() {
    try {
      const raw = localStorage.getItem('user_preferences')

      if (!raw) {
        return {
          sidebarCollapsed: false,
          activeTab: 'home'
        }
      }

      const parsed = JSON.parse(raw)

      return {
        sidebarCollapsed: parsed.sidebarCollapsed ?? false,
        activeTab: parsed.activeTab ?? 'home'
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err)

      return {
        sidebarCollapsed: false,
        activeTab: 'home'
      }
    }
  }

  async function saveUserPreferences(preferences: {
    sidebarCollapsed: boolean
    activeTab: string
  }) {
    try {
      localStorage.setItem('user_preferences', JSON.stringify(preferences))
      return true
    } catch (err) {
      console.error('Failed to save user preferences:', err)
      return false
    }
  }


  // Auto-save current project to Supabase (with debouncing)
  const projectSaveTimeoutRef = React.useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (state.currentProject) {
      if (projectSaveTimeoutRef.current) {
        clearTimeout(projectSaveTimeoutRef.current)
      }

      projectSaveTimeoutRef.current = setTimeout(() => {
        try {
          const serialized = safeSerialize(state.currentProject)
          saveProject(serialized).catch(error => {
            console.error('Failed to save project:', error)
          })
        } catch (error) {
          console.error('Failed to serialize project:', error)
        }
      }, 1000)
    }

    return () => {
      if (projectSaveTimeoutRef.current) {
        clearTimeout(projectSaveTimeoutRef.current)
      }
    }
  }, [state.currentProject])

  // Load chat messages when current project changes
  useEffect(() => {
    if (state.currentProject) {
      loadChatMessages(state.currentProject.id).then(messages => {
        dispatch({ type: 'LOAD_PROJECT_CHAT', payload: messages })
      }).catch(error => {
        console.error('Failed to load chat messages:', error)
      })
    }
  }, [state.currentProject?.id])

  // Save chat messages (debounced)
  const chatSaveTimeoutRef = React.useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (state.currentProject && state.chatMessages.length > 0) {
      const lastMessage = state.chatMessages[state.chatMessages.length - 1]

      if (chatSaveTimeoutRef.current) {
        clearTimeout(chatSaveTimeoutRef.current)
      }

      chatSaveTimeoutRef.current = setTimeout(() => {
        saveChatMessage(state.currentProject!.id, lastMessage).catch(error => {
          console.error('Failed to save chat message:', error)
        })
      }, 300)
    }

    return () => {
      if (chatSaveTimeoutRef.current) {
        clearTimeout(chatSaveTimeoutRef.current)
      }
    }
  }, [state.chatMessages.length])

  // Save user preferences (debounced)
  const prefSaveTimeoutRef = React.useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (prefSaveTimeoutRef.current) {
      clearTimeout(prefSaveTimeoutRef.current)
    }

    prefSaveTimeoutRef.current = setTimeout(() => {
      saveUserPreferences({
        sidebarCollapsed: state.sidebarCollapsed,
        activeTab: state.activeTab
      }).catch(error => {
        console.error('Failed to save user preferences:', error)
      })
    }, 500)

    return () => {
      if (prefSaveTimeoutRef.current) {
        clearTimeout(prefSaveTimeoutRef.current)
      }
    }
  }, [state.sidebarCollapsed, state.activeTab])

  const contextValue = useMemo(() => ({ state, dispatch }), [state])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Convenience hooks
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

  console.log(state.onboardingData, 'onboarding data in useOnboardingData hook')

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
      const result = await deleteProject(projectId)
      if (result.success) {
        dispatch({ type: 'DELETE_PROJECT', payload: projectId })
      }
      return result
    },
    renameProject: async (projectId: string, newName: string) => {
      const result = await renameProject(projectId, newName)
      if (result.success) {
        dispatch({ type: 'RENAME_PROJECT', payload: { id: projectId, name: newName } })
      }
      return result
    }
  }
}

// Save all projects
export function saveProjects(projects: any[]) {
  localStorage.setItem("projects", JSON.stringify(projects))
}

// Load all projects
export function loadProjects(): any[] {
  const data = localStorage.getItem("projects")
  return data ? JSON.parse(data) : []
}

// Save single project (overwrite if exists)
export async function saveProject(project: any) {
  const projects = loadProjects()
  const index = projects.findIndex((p: any) => p.id === project.id)

  if (index !== -1) projects[index] = project
  else projects.push(project)

  saveProjects(projects)
}

// Load one project
export function loadProject(id: string) {
  const projects = loadProjects()
  return projects.find((p: any) => p.id === id) || null
}

// Delete project
export async function deleteProject(id: string) {
  const projects = loadProjects().filter((p: any) => p.id !== id)
  saveProjects(projects)
}

// Rename project
export async function renameProject(id: string, newName: string) {
  const projects = loadProjects()
  const proj = projects.find((p: any) => p.id === id)
  if (proj) proj.name = newName
  saveProjects(projects)
}

// ---------- ONBOARDING ----------
export async function saveOnboardingData(data: any, step: number) {
  try {
    localStorage.setItem("onboardingData", JSON.stringify(data))
    localStorage.setItem("onboardingStep", step.toString())
    return { success: true }
  } catch (error) {
    console.error('Failed to save onboarding data:', error)
    return { success: false }
  }
}

export function loadOnboardingData() {
  try {
    const dataStr = localStorage.getItem("onboardingData")
    const stepStr = localStorage.getItem("onboardingStep")
    
    console.log('Loading onboarding data:', dataStr)
    
    return {
      success: true,
      data: dataStr ? JSON.parse(dataStr) : null,
      step: stepStr ? Number(stepStr) : 1
    }
  } catch (error) {
    console.error('Failed to load onboarding data:', error)
    return {
      success: false,
      data: null,
      step: 1
    }
  }
}

export async function clearOnboardingData() {
  localStorage.removeItem("onboardingData")
  localStorage.removeItem("onboardingStep")
}

// ---------- CHAT MESSAGES ----------
export async function saveChatMessage(projectId: string, message: any) {
  const key = `chat_${projectId}`
  const list = JSON.parse(localStorage.getItem(key) || "[]")
  list.push(message)
  localStorage.setItem(key, JSON.stringify(list))
}

export async function loadChatMessages(projectId: string) {
  const key = `chat_${projectId}`
  return JSON.parse(localStorage.getItem(key) || "[]")
}

export function clearChatMessages(projectId: string) {
  localStorage.removeItem(`chat_${projectId}`)
}


// Add these functions to your context file (around line 790, after loadChatMessages)

// ---------- DECISIONS ----------
export function saveDecisions(decisions: SystemDecisionsSummary, selectedTools: Record<string, string>) {
  const data = {
    decisions,
    selectedTools
  }
  localStorage.setItem("onboarding-decisions", JSON.stringify(data))
}

export function loadDecisions() {
  let data = localStorage.getItem("onboarding-decisions")
  if (!data) return null

  data = JSON.parse(data);
  console.log(data,'this is data from context')
  
  try {
    return data.decisions;
  } catch (error) {
    console.error('Failed to parse decisions:', error)
    return null
  }
}


export function clearDecisions() {
  localStorage.removeItem("onboarding-decisions")
}

export function updateDecisionsField(updates: { 
  decisions?: SystemDecisionsSummary, 
  selectedTools?: Record<string, string> 
}) {
  const current = loadDecisions()
  if (!current) {
    // If no current data, save what we have
    if (updates.decisions && updates.selectedTools) {
      saveDecisions(updates.decisions, updates.selectedTools)
    }
    return
  }
  
  const updated = {
    decisions: updates.decisions || current.decisions,
    selectedTools: updates.selectedTools || current.selectedTools
  }
  
  localStorage.setItem("onboarding-decisions", JSON.stringify(updated))
}

// Add this hook to your hooks section (around line 720, after useOnboardingData)
export function useDecisions() {
  const { state, dispatch } = useAppContext()

  return {
    decisions: state.currentProject?.decisions || null,
    selectedTools: state.currentProject?.selectedTools || {},

    setDecisions: (decisions: SystemDecisionsSummary, selectedTools: Record<string, string>) => {
      // Save to localStorage
      saveDecisions(decisions, selectedTools)
      
      // Update context state
      dispatch({
        type: 'UPDATE_DECISIONS',
        payload: { decisions, selectedTools }
      })
    },

    updateDecision: (updates: {
      decisions?: SystemDecisionsSummary,
      selectedTools?: Record<string, string>
    }) => {
      // Update localStorage
      updateDecisionsField(updates)
      
      // Update context state
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