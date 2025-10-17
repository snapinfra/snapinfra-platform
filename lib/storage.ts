// Local storage utilities for persisting application state
import type { Project, AppState } from './app-context'

const STORAGE_KEYS = {
  PROJECTS: 'snapinfra_projects',
  CURRENT_PROJECT: 'snapinfra_current_project',
  CHAT_HISTORY: 'snapinfra_chat_history',
  USER_PREFERENCES: 'snapinfra_user_preferences',
  HAS_ONBOARDED: 'snapinfra_has_onboarded',
} as const

// Project storage
export function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
  } catch (error) {
    console.warn('Failed to save projects to localStorage:', error)
  }
}

export function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    if (!stored) return []
    
    const projects = JSON.parse(stored)
    // Convert date strings back to Date objects
    return projects.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }))
  } catch (error) {
    console.warn('Failed to load projects from localStorage:', error)
    return []
  }
}

export function saveCurrentProject(project: Project | null) {
  try {
    if (project) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(project))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
    }
  } catch (error) {
    console.warn('Failed to save current project to localStorage:', error)
  }
}

export function loadCurrentProject(): Project | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)
    if (!stored) return null
    
    const project = JSON.parse(stored)
    // Convert date strings back to Date objects
    return {
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }
  } catch (error) {
    console.warn('Failed to load current project from localStorage:', error)
    return null
  }
}

// Chat history storage
export function saveChatHistory(projectId: string, messages: any[]) {
  try {
    const chatHistories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '{}')
    chatHistories[projectId] = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(), // Convert to string for storage
    }))
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatHistories))
  } catch (error) {
    console.warn('Failed to save chat history to localStorage:', error)
  }
}

export function loadChatHistory(projectId: string): any[] {
  try {
    const chatHistories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '{}')
    const messages = chatHistories[projectId] || []
    
    // Convert timestamp strings back to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  } catch (error) {
    console.warn('Failed to load chat history from localStorage:', error)
    return []
  }
}

// User preferences storage
export function saveUserPreferences(preferences: {
  sidebarCollapsed?: boolean
  activeTab?: string
  theme?: string
}) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES) || '{}')
    const updated = { ...existing, ...preferences }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated))
  } catch (error) {
    console.warn('Failed to save user preferences to localStorage:', error)
  }
}

export function loadUserPreferences(): {
  sidebarCollapsed?: boolean
  activeTab?: string
  theme?: string
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to load user preferences from localStorage:', error)
    return {}
  }
}

// Onboarding completion tracking
export function markOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true')
  } catch (error) {
    console.warn('Failed to mark onboarding complete:', error)
  }
}

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true'
  } catch (error) {
    console.warn('Failed to check onboarding status:', error)
    return false
  }
}

// Clear all storage
export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to clear localStorage:', error)
  }
}

// Clean up demo projects utility
export function cleanupDemoProjects(): void {
  try {
    const projects = loadProjects()
    const cleanedProjects = projects.filter(project => {
      // Remove projects with generic demo names and empty schemas
      const isDemoProject = project.name === 'Demo Project' || 
                           project.name.startsWith('Demo Project') ||
                           (project.description === 'A sample project to showcase snapinfra capabilities' && project.schema.length === 0)
      return !isDemoProject
    })
    
    if (cleanedProjects.length !== projects.length) {
      saveProjects(cleanedProjects)
      console.log(`Cleaned up ${projects.length - cleanedProjects.length} demo projects`)
    }
  } catch (error) {
    console.warn('Failed to cleanup demo projects:', error)
  }
}

// Export/Import functionality
export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function importProject(jsonString: string): Project {
  const project = JSON.parse(jsonString)
  return {
    ...project,
    id: `imported-${Date.now()}`, // Generate new ID for imported project
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(),
  }
}
