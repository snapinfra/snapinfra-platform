"use client"

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
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
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
}

import type { SystemArchitecture } from './types/architecture'
import type { SystemDecisionsSummary } from './types/system-decisions'

export interface Project {
  id: string
  name: string
  description: string
  status: 'draft' | 'building' | 'deployed' | 'error'
  createdAt: Date
  updatedAt: Date
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
  status: 'deploying' | 'deployed' | 'failed'
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
  
  // Initialize API authentication
  useApiAuth()
  
  // Load persisted data on mount - ONLY user preferences, NOT projects
  useEffect(() => {
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
  // Projects are only saved to AWS backend
  
  // Sync current project to backend when it changes (with debouncing)
  // DISABLED: Projects are now loaded directly from AWS, no need to auto-sync
  useEffect(() => {
    const syncProjectToBackend = async () => {
      // Skip auto-sync - projects are managed via explicit API calls
      return;
      if (!state.currentProject) {
        saveCurrentProject(null)
        return
      }
      
      // Don't sync if project has no schema yet (happens during initialization)
      if (!state.currentProject.schema || state.currentProject.schema.length === 0) {
        console.log('⏸️ Skipping sync - project has no schema yet')
        saveCurrentProject(state.currentProject)
        return
      }
      
      // Save to localStorage first (immediate)
      saveCurrentProject(state.currentProject)
      
      // Debounce backend sync to avoid excessive API calls
      // Clear any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      
      // Schedule a new sync after 1 second of inactivity
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const backendAvailable = await isBackendAvailable()
          if (!backendAvailable) {
            console.log('📦 Backend unavailable, project saved locally only')
            return
          }
          
        // Check if project has been synced to backend before
        const projectMeta = localStorage.getItem(`project-meta-${state.currentProject.id}`)
        const meta = projectMeta ? JSON.parse(projectMeta) : {}
        
        // Sync to DynamoDB via backend API
        console.log('🔄 Syncing project to backend:', state.currentProject.id)
        
        try {
          if (meta.backendId) {
            // Project exists in backend, update it
            // Handle schema - it might be an object or array
            const schemaArray = Array.isArray(state.currentProject.schema) 
              ? state.currentProject.schema 
              : state.currentProject.schema?.tables || []
            
            // Filter out tables without fields
            const validTables = schemaArray.filter((t: any) => 
              t.fields && t.fields.length > 0
            )
            
            if (validTables.length === 0) {
              console.log('⚠️ No valid tables to sync (all tables missing fields)')
              return
            }
            
            await updateProjectAPI(meta.backendId, {
              name: state.currentProject.name,
              description: state.currentProject.description,
              status: state.currentProject.status,
              schema: {
                name: state.currentProject.name,
              tables: validTables.map(t => ({
                  id: t.id,
                  name: t.name,
                  fields: t.fields.map(f => ({
                    id: f.id,
                    name: f.name,
                    type: f.type,
                    isPrimary: f.isPrimary || false,
                    isRequired: f.isRequired || false,
                    isUnique: f.isUnique || false,
                    isForeignKey: f.isForeignKey || false,
                    description: f.description || ''
                  })),
                  indexes: t.indexes || []
                  // Note: relationships not allowed at table level per backend validation
                })),
                relationships: []
              },
              endpoints: state.currentProject.endpoints || [],
              decisions: state.currentProject.decisions || { decisions: [] },
              architecture: state.currentProject.architecture || { nodes: [], edges: [] },
              database: state.currentProject.database || { type: 'PostgreSQL' }
            })
            console.log('✅ Project updated in backend successfully')
          } else {
            // Project doesn't exist in backend yet, create it
            console.log('📝 Creating project in backend for the first time...')
            
            // Prepare clean schema data for backend
            // Handle schema - it might be an object or array
            const schemaArray = Array.isArray(state.currentProject.schema) 
              ? state.currentProject.schema 
              : state.currentProject.schema?.tables || []
            
            // Filter out tables without fields (invalid)
            const validTables = schemaArray.filter((t: any) => 
              t.fields && t.fields.length > 0
            )
            
            if (validTables.length === 0) {
              console.log('⚠️ No valid tables to sync (all tables missing fields)')
              return
            }
            
            const schemaPayload = {
              name: state.currentProject.name,
              description: state.currentProject.description || 'Synced from local storage',
              schema: {
                name: state.currentProject.name,
                tables: validTables.map(t => ({
                  id: t.id,
                  name: t.name,
                  fields: t.fields.map(f => ({
                    id: f.id,
                    name: f.name,
                    type: f.type,
                    isPrimary: f.isPrimary || false,
                    isRequired: f.isRequired || false,
                    isUnique: f.isUnique || false,
                    isForeignKey: f.isForeignKey || false,
                    description: f.description || ''
                  })),
                  indexes: t.indexes || []
                  // Note: relationships not allowed at table level per backend validation
                })),
                relationships: []
              },
              endpoints: state.currentProject.endpoints || [],
              decisions: state.currentProject.decisions || { decisions: [] },
              architecture: state.currentProject.architecture || { nodes: [], edges: [] },
              database: state.currentProject.database || { type: 'PostgreSQL' }
            }
            
            console.log('Schema payload:', JSON.stringify(schemaPayload, null, 2))
            
            try {
              const newProject = await createProjectAPI(schemaPayload)
              
              // Store the backend-generated ID for future updates
              localStorage.setItem(`project-meta-${state.currentProject.id}`, JSON.stringify({
                backendId: newProject.id,
                syncedAt: new Date().toISOString()
              }))
              
              console.log('✅ Project created in backend successfully (ID:', newProject.id, ')')
            } catch (createError: any) {
              console.error('❌ Backend validation failed!')
              console.error('Error:', createError.message)
              console.error('Status:', createError.statusCode)
              console.error('Details:', createError.details)
              console.error('\nPayload that was sent:', JSON.stringify(schemaPayload, null, 2))
              throw createError
            }
          }
        } catch (syncError: any) {
          // If we get 404 on update, the backend ID is stale - recreate
          if (syncError.statusCode === 404 && meta.backendId) {
            console.log('⚠️ Backend project not found (404), clearing stale backend ID and recreating...')
            
            // Clear the stale backend ID
            localStorage.removeItem(`project-meta-${state.currentProject.id}`)
            
            try {
              // Handle schema - it might be an object or array
              const schemaArray = Array.isArray(state.currentProject.schema) 
                ? state.currentProject.schema 
                : state.currentProject.schema?.tables || []
              
              // Filter out tables without fields (invalid)
              const validTables = schemaArray.filter((t: any) => 
                t.fields && t.fields.length > 0
              )
              
              if (validTables.length === 0) {
                console.log('⚠️ No valid tables to sync (all tables missing fields)')
                return
              }
              
              const newProject = await createProjectAPI({
                name: state.currentProject.name,
                description: state.currentProject.description || 'Synced from local storage',
                schema: {
                  name: state.currentProject.name,
                  tables: validTables.map(t => ({
                    id: t.id,
                    name: t.name,
                  fields: t.fields.map(f => ({
                      id: f.id,
                      name: f.name,
                      type: f.type,
                      isPrimary: f.isPrimary || false,
                      isRequired: f.isRequired || false,
                      isUnique: f.isUnique || false,
                      isForeignKey: f.isForeignKey || false,
                      description: f.description || ''
                    })),
                    indexes: t.indexes || []
                    // Note: relationships not allowed at table level per backend validation
                  })),
                  relationships: []
                },
                endpoints: state.currentProject.endpoints || [],
                decisions: state.currentProject.decisions || { decisions: [] },
                architecture: state.currentProject.architecture || { nodes: [], edges: [] },
                database: state.currentProject.database || { type: 'PostgreSQL' }
              })
              
              // Update the stored backend ID
              localStorage.setItem(`project-meta-${state.currentProject.id}`, JSON.stringify({
                backendId: newProject.id,
                syncedAt: new Date().toISOString()
              }))
              
              console.log('✅ Project recreated in backend successfully')
            } catch (recreateError) {
              console.error('❌ Failed to recreate project:', recreateError)
              // Don't re-throw to prevent error loops - project is still saved locally
            }
          } else if (syncError.statusCode !== 404) {
            // Only throw non-404 errors (404 without backendId means project never existed)
            console.error('❌ Sync error (non-404):', syncError)
          } else {
            console.log('ℹ️ Project not found in backend, will be created on next valid sync')
          }
        }
        } catch (error: any) {
          // If auth error in production mode, user needs to sign in
          if (error?.statusCode === 401) {
            console.log('ℹ️ Skipping backend sync - user not authenticated')
            console.log('🔐 Please sign in to sync projects to backend')
          } else {
            console.error('❌ Failed to sync project to backend:', error)
          }
          // Don't throw - project is still saved locally
        }
      }, 1000) // 1 second debounce
    }
    
    syncProjectToBackend()
    
    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [state.currentProject])
  
  // Load chat messages when current project changes
  useEffect(() => {
    if (state.currentProject) {
      const chatMessages = loadChatHistory(state.currentProject.id)
      
      // Simply load the chat messages without adding welcome message here
      // Welcome message will be handled by the chat interface component
      dispatch({ type: 'LOAD_PROJECT_CHAT', payload: chatMessages })
    } else {
      // Clear chat messages when no current project
      dispatch({ type: 'LOAD_PROJECT_CHAT', payload: [] })
    }
  }, [state.currentProject?.id])

  // Save chat messages when they change (including empty state)
  useEffect(() => {
    if (state.currentProject) {
      saveChatHistory(state.currentProject.id, state.chatMessages)
    }
  }, [state.chatMessages, state.currentProject?.id])
  
  useEffect(() => {
    saveUserPreferences({
      sidebarCollapsed: state.sidebarCollapsed,
      activeTab: state.activeTab
    })
  }, [state.sidebarCollapsed, state.activeTab])
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
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