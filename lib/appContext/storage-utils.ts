import { DynamoDBSyncManager } from './dynamodb-sync-manager'
import type { GeneratedData } from './app-context'
import type { SystemDecisionsSummary } from './types/system-decisions'

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================

export const SYNC_CONFIG = {
    // Items that stay in localStorage only (never sync to DynamoDB)
    LOCAL_ONLY: ['searchQuery', 'sidebarCollapsed', 'activeTab', 'isAiTyping'],

    // Items that sync immediately (high priority)
    IMMEDIATE_SYNC: ['currentProject', 'onboardingData'],

    // Items that can be debounced (normal priority)
    DEBOUNCED_SYNC: ['chatMessages', 'projects'],

    // Items that sync on interval (low priority)
    LAZY_SYNC: ['preferences'],
}

// ============================================================================
// HYBRID STORAGE CLASS
// ============================================================================

class HybridStorage {
    private syncManager: DynamoDBSyncManager | null = null
    private userId: string | null = null

    initialize(userId: string) {
        if (!userId) return

        this.userId = userId
        this.syncManager = new DynamoDBSyncManager(userId)
    }

    // Save to localStorage immediately, queue for DynamoDB/S3 sync
    async save(key: string, data: any, syncPriority: 'high' | 'normal' | 'low' = 'normal') {
        // Always save to localStorage first (fast, synchronous)
        try {
            localStorage.setItem(key, JSON.stringify(data))
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage:`, error)
        }

        // Queue for DynamoDB/S3 sync if not local-only
        if (!SYNC_CONFIG.LOCAL_ONLY.includes(key) && this.syncManager) {
            this.syncManager.queueSync(key, data, syncPriority)
        }
    }

    // Load from localStorage first, fall back to DynamoDB/S3
    async load<T>(key: string): Promise<T | null> {
        // Try localStorage first (fast)
        console.log("entered load function", key)
        try {
            const localData = localStorage.getItem(key)
            console.log(localData, "local data")
            if (localData) {
                console.log("Loaded from localStorage:", JSON.parse(localData))
                return JSON.parse(localData)
            }
        } catch (error) {
            console.error(`Failed to load ${key} from localStorage:`, error)
        }



        // Fall back to DynamoDB/S3 if available
        if (this.syncManager && !SYNC_CONFIG.LOCAL_ONLY.includes(key)) {
            try {
                console.log("entered in try", key)
                const data = await this.syncManager.load<T>(key)
                console.log(data, "data from ")

                // Cache in localStorage for faster future access
                if (data) {
                    localStorage.setItem(key, JSON.stringify(data))
                }

                return data
            } catch (error) {
                console.error(`Failed to load ${key} from DynamoDB/S3:`, error)
            }
        }

        return null
    }

    // Batch load multiple projects
    async loadProjects(): Promise<any[]> {
        // Try localStorage first
        try {
            const localData = localStorage.getItem('projects')
            if (localData) {
                return JSON.parse(localData)
            }
        } catch (error) {
            console.error('Failed to load projects from localStorage:', error)
        }

        // Load from DynamoDB/S3
        if (this.syncManager) {
            try {
                const projects = await this.syncManager.loadAllProjects()

                // Cache in localStorage
                if (projects.length > 0) {
                    localStorage.setItem('projects', JSON.stringify(projects))
                }

                return projects
            } catch (error) {
                console.error('Failed to load projects from DynamoDB/S3:', error)
            }
        }

        return []
    }

    // Load chat messages with pagination
    async loadChatMessages(projectId: string, limit = 50): Promise<any[]> {
        const cacheKey = `chat_${projectId}`

        // Try localStorage first
        try {
            const localData = localStorage.getItem(cacheKey)
            if (localData) {
                return JSON.parse(localData)
            }
        } catch (error) {
            console.error('Failed to load chat from localStorage:', error)
        }

        // Load from DynamoDB
        if (this.syncManager) {
            try {
                const messages = await this.syncManager.loadChatMessages(projectId, limit)

                // Cache in localStorage
                if (messages.length > 0) {
                    localStorage.setItem(cacheKey, JSON.stringify(messages))
                }

                return messages
            } catch (error) {
                console.error('Failed to load chat from DynamoDB:', error)
            }
        }

        return []
    }

    // Delete item (with S3 cleanup)
    async delete(key: string): Promise<{ success: boolean }> {
        // Remove from localStorage
        try {
            localStorage.removeItem(key)
        } catch (error) {
            console.error(`Failed to delete ${key} from localStorage:`, error)
        }

        // Delete from DynamoDB/S3
        if (this.syncManager) {
            return await this.syncManager.delete(key)
        }

        return { success: true }
    }

    // NEW: Cleanup onboarding data from DynamoDB/S3
    async cleanupOnboarding(projectId?: string): Promise<{
        success: boolean;
        deletedItems: string[];
        errors: string[];
        chatDeleted: boolean;
        chatCount: number;
    }> {
        if (!this.syncManager) {
            return {
                success: false,
                deletedItems: [],
                errors: ['Sync manager not initialized'],
                chatDeleted: false,
                chatCount: 0
            };
        }

        // Clean up onboarding data
        const result = await this.syncManager.cleanupOnboardingData();

        // Clean up chat messages if project ID provided
        let chatDeleted = false;
        let chatCount = 0;

        if (projectId) {
            const chatResult = await this.syncManager.deleteChatMessages(projectId);
            chatDeleted = chatResult.success;
            chatCount = chatResult.deletedCount;

            if (chatResult.success) {
                result.deletedItems.push(`chat messages (${chatCount})`);
            } else {
                result.errors.push('Failed to delete chat messages');
            }
        }

        return {
            ...result,
            chatDeleted,
            chatCount
        };
    }

    // Force sync all pending changes
    async syncNow() {
        if (this.syncManager) {
            await this.syncManager.syncNow()
        }
    }

    // Cleanup
    destroy() {
        if (this.syncManager) {
            this.syncManager.destroy()
        }
    }
}

// Create singleton instance
export const hybridStorage = new HybridStorage()

// ============================================================================
// USER PREFERENCES
// ============================================================================

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

// ============================================================================
// PROJECTS
// ============================================================================

export function saveProjects(projects: any[]) {
    localStorage.setItem("projects", JSON.stringify(projects))
}

export function loadProjects(): any[] {
    const data = localStorage.getItem("projects")
    return data ? JSON.parse(data) : []
}

export async function saveProject(project: any) {
    const projects = loadProjects()
    const index = projects.findIndex((p: any) => p.id === project.id)

    if (index !== -1) projects[index] = project
    else projects.push(project)

    saveProjects(projects)
}

export function loadProject(id: string) {
    const projects = loadProjects()
    return projects.find((p: any) => p.id === id) || null
}

export async function deleteProject(id: string) {
    const projects = loadProjects().filter((p: any) => p.id !== id)
    saveProjects(projects)
    return { success: true }
}

export async function renameProject(id: string, newName: string) {
    const projects = loadProjects()
    const proj = projects.find((p: any) => p.id === id)
    if (proj) proj.name = newName
    saveProjects(projects)
    return { success: true }
}

// ============================================================================
// ONBOARDING
// ============================================================================

export async function updateOnboardingDataFields(updates: Partial<GeneratedData>) {
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

export function updateOnboardingStep(step: number) {
    try {
        localStorage.setItem("onboardingStep", step.toString())
        return true
    } catch (error) {
        console.error("Failed to update onboarding step:", error)
        return false
    }
}

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

// ============================================================================
// CHAT MESSAGES
// ============================================================================

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

// ============================================================================
// DECISIONS
// ============================================================================

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

    try {
        const parsed = JSON.parse(data)
        return parsed
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

// ============================================================================
// GENERATED CODE
// ============================================================================

export async function saveGeneratedCode(
    projectId: string,
    generatedCode: any,
    generatedIaC: any
) {
    try {
        const projects = await hybridStorage.loadProjects()
        const projectIndex = projects.findIndex(p => p.id === projectId)

        if (projectIndex === -1) {
            console.error('Project not found:', projectId)
            return { success: false, error: 'Project not found' }
        }

        const updatedProject = {
            ...projects[projectIndex],
            generatedCode,
            generatedIaC,
            updatedAt: new Date()
        }

        projects[projectIndex] = updatedProject

        // Save to localStorage immediately
        try {
            localStorage.setItem('projects', JSON.stringify(projects))
            localStorage.setItem(`project:${projectId}`, JSON.stringify(updatedProject))
            console.log('✅ Saved to localStorage')
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error)
        }

        // Queue for DynamoDB/S3 sync
        await hybridStorage.save(`project:${projectId}`, updatedProject, 'high')
        await hybridStorage.save('projects', projects, 'high')

        const totalSize = new Blob([JSON.stringify(updatedProject)]).size
        console.log(`✅ Generated code saved:`)
        console.log(`   - localStorage: ✓`)
        console.log(`   - DynamoDB/S3 (queued): ✓`)
        console.log(`   - Total size: ${(totalSize / 1024).toFixed(2)} KB`)

        if (totalSize > 350 * 1024) {
            console.log(`   - Storage: S3 (data too large for DynamoDB)`)
        } else {
            console.log(`   - Storage: DynamoDB (data fits)`)
        }

        return { success: true }
    } catch (error) {
        console.error('❌ Failed to save generated code:', error)
        return { success: false, error }
    }
}

// ============================================================================
// ONBOARDING CLEANUP - ADD THIS SECTION
// ============================================================================

/**
 * Clean up all onboarding-related data after onboarding is complete
 * This removes data from both localStorage and DynamoDB/S3
 */
export async function cleanupAfterOnboarding(projectId?: string): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        console.log('🧹 Starting onboarding cleanup...')

        // 1. Clear from localStorage
        localStorage.removeItem('onboardingData')
        localStorage.removeItem('onboardingStep')
        // localStorage.removeItem('onboarding-decisions')

        // Clear chat messages if projectId provided
        if (projectId) {
            localStorage.removeItem(`chat_${projectId}`)
        }

        console.log('✅ Cleared localStorage')

        // 2. Clear from DynamoDB/S3
        const dynamoResult = await hybridStorage.cleanupOnboarding(projectId)

        if (dynamoResult.success) {
            console.log('✅ Onboarding cleanup complete:', {
                localStorage: 'cleared',
                dynamoDB: dynamoResult.deletedItems,
                chatMessages: dynamoResult.chatDeleted ? `${dynamoResult.chatCount} deleted` : 'none'
            })

            return {
                success: true,
                message: `Cleaned up ${dynamoResult.deletedItems.length} items from storage`
            }
        } else {
            console.warn('⚠️ Partial cleanup (localStorage cleared, DynamoDB had errors):', dynamoResult.errors)
            return {
                success: false,
                message: `Partial cleanup: ${dynamoResult.errors.join(', ')}`
            }
        }
    } catch (error) {
        console.error('❌ Failed to cleanup onboarding data:', error)
        return {
            success: false,
            message: `Cleanup failed: ${error}`
        }
    }
}