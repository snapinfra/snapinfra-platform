"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react'
import { 
  saveProjects, 
  loadProjects, 
  saveCurrentProject, 
  loadCurrentProject,
  saveChatHistory,
  loadChatHistory,
  saveUserPreferences,
  loadUserPreferences,
  cleanupDemoProjects
} from './storage'
import { updateProject as updateProjectAPI, createProject as createProjectAPI, deleteProject as deleteProjectAPI, isBackendAvailable } from './api-client'
import { useApiAuth } from '@/hooks/useApiAuth'

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
  // Added: Outputs from onboarding Steps 4 and 5
  architecture?: SystemArchitecture
  decisions?: SystemDecisionsSummary
  selectedTools?: Record<string, string>
  // Added: Analysis from Step 1/2 (db recs, scaling, optimizations, security, smart)
  analysis?: any
  // Added: Generated artifacts
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
  position?: { x: number; y: number } // for visualization
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
  maxFileSize?: number // for File type
  acceptedFileTypes?: string[] // for File type
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
  reasoning?: string // AI explanation for database choice
  features?: string[] // What features this DB enables
  confidence?: number // AI confidence score (0-1)
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
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // App state
  isLoading: boolean
  hasCompletedOnboarding: boolean
  
  // Current project state
  currentProject: Project | null
  projects: Project[]
  
  // Chat state
  chatMessages: ChatMessage[]
  isAiTyping: boolean
  
  // UI state
  sidebarCollapsed: boolean
  activeTab: 'schema' | 'api' | 'analytics'
  previewPanelCollapsed: boolean
  
  // Filters and search
  searchQuery: string
  selectedTables: string[]
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
  selectedTables: []
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
      // Note: Chat messages will be loaded separately via useEffect in provider
      return {
        ...state,
        currentProject: action.payload,
        // Clear chat messages when switching projects - they'll be loaded from storage if they exist
        chatMessages: []
      }
    
    case 'ADD_PROJECT':
      // Avoid adding duplicate projects
      const existingProject = state.projects.find(p => p.id === action.payload.id)
      if (existingProject) {
        return {
          ...state,
          currentProject: action.payload,
          // Clear chat messages when switching to existing project
          chatMessages: []
        }
      }
      return {
        ...state,
        projects: [...state.projects, action.payload],
        currentProject: action.payload,
        // Clear chat messages for new project
        chatMessages: []
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
      // Note: Backend sync should be handled by the component calling this action
      // Frontend state is immediately updated for better UX
      const projectToDelete = state.projects.find(p => p.id === action.payload)
      
      // Clean up localStorage metadata for this project
      if (projectToDelete) {
        localStorage.removeItem(`project-meta-${action.payload}`)
        localStorage.removeItem(`chat-${action.payload}`)
      }
      
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
      // Simply clear all chat messages - no welcome message needed in conversation
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
      
      // Check if schema actually changed to prevent infinite loops
      const currentSchema = state.currentProject.schema
      const newSchema = action.payload
      
      // Deep equality check - compare table IDs and field counts
      const schemasEqual = 
        currentSchema.length === newSchema.length &&
        currentSchema.every((table, idx) => {
          const newTable = newSchema[idx]
          return newTable && 
            table.id === newTable.id &&
            table.name === newTable.name &&
            table.fields.length === newTable.fields.length &&
            JSON.stringify(table.position) === JSON.stringify(newTable.position)
        })
      
      if (schemasEqual) return state
      
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
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const initializedRef = React.useRef(false)
  
  // Initialize API authentication
  useApiAuth()
  
  // Load persisted data on mount - ONLY user preferences, NOT projects
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    
    // Clean up any old demo projects and localStorage
    cleanupDemoProjects()
    
    // Only load user preferences (UI state)
    const preferences = loadUserPreferences()
    
    // Apply user preferences
    if (preferences.sidebarCollapsed !== undefined) {
      dispatch({ type: 'TOGGLE_SIDEBAR' })
    }
    if (preferences.activeTab) {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: preferences.activeTab as 'schema' | 'api' | 'analytics' })
    }
  }, [])
  
  // DO NOT auto-save projects to localStorage - AWS is source of truth
  // Projects are only saved to AWS backend via explicit API calls
  // Auto-sync is completely disabled to prevent infinite loops
  
  /*
  // Load chat messages when current project changes
  const lastProjectIdRef = React.useRef<string | null>(null)
  useEffect(() => {
    const currentId = state.currentProject?.id || null
    
    // Only run if project ID actually changed
    if (lastProjectIdRef.current === currentId) return
    lastProjectIdRef.current = currentId
    
    if (state.currentProject) {
      const chatMessages = loadChatHistory(state.currentProject.id)
      dispatch({ type: 'LOAD_PROJECT_CHAT', payload: chatMessages })
    } else {
      dispatch({ type: 'LOAD_PROJECT_CHAT', payload: [] })
    }
  }, [state.currentProject?.id])
  */

  // Save chat messages when they change (including empty state)
  // TEMPORARILY DISABLED FOR DEBUGGING
  /*
  useEffect(() => {
    if (state.currentProject) {
      saveChatHistory(state.currentProject.id, state.chatMessages)
    }
  }, [state.chatMessages, state.currentProject?.id])
  */
  
  useEffect(() => {
    saveUserPreferences({
      sidebarCollapsed: state.sidebarCollapsed,
      activeTab: state.activeTab
    })
  }, [state.sidebarCollapsed, state.activeTab])
  
  // Memoize context value to prevent unnecessary re-renders
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