import { SystemArchitecture } from './types/architecture'

// Local storage keys
const ARCHITECTURES_KEY = 'rhino_architectures'
const CURRENT_ARCHITECTURE_KEY = 'rhino_current_architecture'

/**
 * Save architectures to local storage
 */
export function saveArchitectures(architectures: SystemArchitecture[]): void {
  try {
    localStorage.setItem(ARCHITECTURES_KEY, JSON.stringify(architectures))
  } catch (error) {
    console.error('Error saving architectures to local storage:', error)
  }
}

/**
 * Load architectures from local storage
 */
export function loadArchitectures(): SystemArchitecture[] {
  try {
    const architecturesJson = localStorage.getItem(ARCHITECTURES_KEY)
    if (!architecturesJson) return []
    
    const architectures = JSON.parse(architecturesJson) as SystemArchitecture[]
    
    // Convert string dates to Date objects
    return architectures.map(arch => ({
      ...arch,
      metadata: arch.metadata ? {
        ...arch.metadata,
        createdAt: arch.metadata.createdAt ? new Date(arch.metadata.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: arch.metadata.updatedAt ? new Date(arch.metadata.updatedAt).toISOString() : new Date().toISOString()
      } : {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }))
  } catch (error) {
    console.error('Error loading architectures from local storage:', error)
    return []
  }
}

/**
 * Save current architecture to local storage
 */
export function saveCurrentArchitecture(architecture: SystemArchitecture): void {
  try {
    localStorage.setItem(CURRENT_ARCHITECTURE_KEY, JSON.stringify(architecture))
  } catch (error) {
    console.error('Error saving current architecture to local storage:', error)
  }
}

/**
 * Load current architecture from local storage
 */
export function loadCurrentArchitecture(): SystemArchitecture | null {
  try {
    const architectureJson = localStorage.getItem(CURRENT_ARCHITECTURE_KEY)
    if (!architectureJson) return null
    
    const architecture = JSON.parse(architectureJson) as SystemArchitecture
    
    // Convert string dates to Date objects
    return {
      ...architecture,
      metadata: architecture.metadata ? {
        ...architecture.metadata,
        createdAt: architecture.metadata.createdAt ? new Date(architecture.metadata.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: architecture.metadata.updatedAt ? new Date(architecture.metadata.updatedAt).toISOString() : new Date().toISOString()
      } : {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  } catch (error) {
    console.error('Error loading current architecture from local storage:', error)
    return null
  }
}

/**
 * Delete an architecture from local storage
 */
export function deleteArchitecture(architectureId: string): void {
  try {
    const architectures = loadArchitectures()
    const updatedArchitectures = architectures.filter(arch => arch.id !== architectureId)
    saveArchitectures(updatedArchitectures)
    
    // Also clear current architecture if it's the one being deleted
    const currentArch = loadCurrentArchitecture()
    if (currentArch && currentArch.id === architectureId) {
      localStorage.removeItem(CURRENT_ARCHITECTURE_KEY)
    }
  } catch (error) {
    console.error('Error deleting architecture from local storage:', error)
  }
}

/**
 * Associate an architecture with a project
 */
export function associateArchitectureWithProject(architectureId: string, projectId: string): void {
  try {
    const architectures = loadArchitectures()
    const updatedArchitectures = architectures.map(arch => {
      if (arch.id === architectureId) {
        return {
          ...arch,
          metadata: {
            ...arch.metadata,
            projectId,
            updatedAt: new Date().toISOString()
          }
        }
      }
      return arch
    })
    saveArchitectures(updatedArchitectures)
  } catch (error) {
    console.error('Error associating architecture with project:', error)
  }
}

/**
 * Get all architectures for a project
 */
export function getArchitecturesForProject(projectId: string): SystemArchitecture[] {
  try {
    const architectures = loadArchitectures()
    return architectures.filter(arch => arch.metadata?.projectId === projectId)
  } catch (error) {
    console.error('Error getting architectures for project:', error)
    return []
  }
}

/**
 * Clean up orphaned architectures (no associated project)
 */
export function cleanupOrphanedArchitectures(validProjectIds: string[]): void {
  try {
    const architectures = loadArchitectures()
    const validArchitectures = architectures.filter(arch => 
      !arch.metadata?.projectId || validProjectIds.includes(arch.metadata.projectId)
    )
    
    if (validArchitectures.length !== architectures.length) {
      saveArchitectures(validArchitectures)
    }
  } catch (error) {
    console.error('Error cleaning up orphaned architectures:', error)
  }
}