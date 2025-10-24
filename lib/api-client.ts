/**
 * API Client for snapinfra Backend
 * Handles all communication with the Express backend (AWS DynamoDB)
 */

import type { Project, DatabaseSchema, User } from './app-context'

// Get backend URL from environment variable or default to localhost
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

// Store auth token getter globally (set by useAuth hook)
let getAuthToken: (() => Promise<string | null>) | null = null

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter
}

// Helper to get user ID for dev authentication
const getDevUserId = (): string => {
  // In development, use a consistent user ID
  // In production, this would come from Clerk or your auth provider
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('dev-user-id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('dev-user-id', userId)
    }
    return userId
  }
  return 'anonymous'
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add authentication headers based on auth mode
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'development'
  
  if (authMode === 'production') {
    // Production: Use Clerk JWT token
    if (getAuthToken) {
      const token = await getAuthToken()
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`
      } else {
        // No token available - user not signed in yet
        // Throw error to prevent unauthenticated requests
        throw new ApiError('Please sign in to continue', 401)
      }
    } else {
      // getAuthToken not initialized - user not signed in
      throw new ApiError('Please sign in to continue', 401)
    }
  } else {
    // Development: Use dev user ID
    defaultHeaders['x-dev-user-id'] = getDevUserId()
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }
      return {} as T
    }

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Request failed',
        response.status,
        data.details
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    if (error instanceof Error) {
      throw new ApiError(
        `Network error: ${error.message}`,
        0,
        { originalError: error.message }
      )
    }
    
    throw new ApiError('Unknown error occurred', 0)
  }
}

// ============================================================================
// PROJECT API METHODS
// ============================================================================

export interface CreateProjectPayload {
  name: string
  description?: string
  schema: {
    name: string
    tables: any[]
    relationships?: any[]
  }
  endpoints?: any[]
  database?: {
    type: string
    reasoning?: string
    confidence?: number
    features?: string[]
  }
  architecture?: any
  decisions?: any
  selectedTools?: Record<string, string>
  analysis?: any
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: 'draft' | 'building' | 'deployed' | 'error'
  schema?: any
  generatedCode?: {
    files: Array<{ path: string; content: string; description?: string }>
    instructions: string
    dependencies: string[]
    success: boolean
    error?: string
  }
  generatedIaC?: {
    files: Array<{ path: string; content: string; description?: string }>
    instructions: string
    dependencies: string[]
    success: boolean
    error?: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * Create a new project in the backend
 */
export async function createProject(
  payload: CreateProjectPayload
): Promise<Project> {
  const response = await apiRequest<ApiResponse<Project>>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.success || !response.data) {
    throw new ApiError('Failed to create project', 500, response)
  }

  // Convert date strings to Date objects
  return {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt),
  }
}

/**
 * Get all projects for the current user
 */
export async function getProjects(
  limit?: number,
  search?: string
): Promise<Project[]> {
  const params = new URLSearchParams()
  if (limit) params.append('limit', limit.toString())
  if (search) params.append('search', search)

  const queryString = params.toString()
  const endpoint = `/api/projects${queryString ? `?${queryString}` : ''}`

  const response = await apiRequest<ApiResponse<Project[]>>(endpoint, {
    method: 'GET',
  })

  if (!response.success || !response.data) {
    throw new ApiError('Failed to fetch projects', 500, response)
  }

  // Convert date strings to Date objects
  return response.data.map(project => ({
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  }))
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(projectId: string): Promise<Project> {
  const response = await apiRequest<ApiResponse<Project>>(
    `/api/projects/${projectId}`,
    {
      method: 'GET',
    }
  )

  if (!response.success || !response.data) {
    throw new ApiError('Failed to fetch project', 404, response)
  }

  // Convert date strings to Date objects
  return {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt),
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectPayload
): Promise<Project> {
  const response = await apiRequest<ApiResponse<Project>>(
    `/api/projects/${projectId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  )

  if (!response.success || !response.data) {
    throw new ApiError('Failed to update project', 500, response)
  }

  // Convert date strings to Date objects
  return {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt),
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await apiRequest<ApiResponse<void>>(
    `/api/projects/${projectId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.success) {
    throw new ApiError('Failed to delete project', 500, response)
  }
}

/**
 * Batch get multiple projects by IDs
 */
export async function batchGetProjects(
  projectIds: string[]
): Promise<Project[]> {
  const response = await apiRequest<ApiResponse<Project[]>>(
    '/api/projects/batch',
    {
      method: 'POST',
      body: JSON.stringify({ projectIds }),
    }
  )

  if (!response.success || !response.data) {
    throw new ApiError('Failed to fetch projects', 500, response)
  }

  // Convert date strings to Date objects
  return response.data.map(project => ({
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
  }))
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheckResponse {
  status: string
  timestamp: string
  uptime: number
  environment: string
  services: {
    dynamodb: { status: string; latency?: number }
    s3: { status: string; latency?: number }
  }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await apiRequest<HealthCheckResponse>('/api/health', {
      method: 'GET',
    })
    return response
  } catch (error) {
    throw new ApiError('Backend is not reachable', 0, error)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    await checkHealth()
    return true
  } catch {
    return false
  }
}

/**
 * Get the current backend URL
 */
export function getBackendUrl(): string {
  return BACKEND_URL
}

/**
 * Get the current dev user ID
 */
export function getCurrentUserId(): string {
  return getDevUserId()
}

// ============================================================================
// HELPER FUNCTIONS FOR FILE UPLOADS
// ============================================================================

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1]
      resolve(base64 || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================================================
// HOME & DASHBOARD API
// ============================================================================

export async function getHomeData() {
  return apiRequest('/api/home', { method: 'GET' })
}

export async function getDashboardOverview() {
  return apiRequest('/api/dashboard', { method: 'GET' })
}

export async function getDashboardMetrics() {
  return apiRequest('/api/dashboard/metrics', { method: 'GET' })
}

export async function getRecentActivity(limit?: number) {
  return apiRequest(`/api/dashboard/recent-activity${limit ? `?limit=${limit}` : ''}`, { method: 'GET' })
}

export async function getRecentDeployments(limit?: number) {
  return apiRequest(`/api/dashboard/recent-deployments${limit ? `?limit=${limit}` : ''}`, { method: 'GET' })
}

// ============================================================================
// SCHEMA API
// ============================================================================

export async function getAllSchemas() {
  return apiRequest('/api/schemas', { method: 'GET' })
}

export async function getSchemaById(id: string) {
  return apiRequest(`/api/schemas/${id}`, { method: 'GET' })
}

export async function getSchemasByProject(projectId: string) {
  return apiRequest(`/api/schemas/project/${projectId}`, { method: 'GET' })
}

export async function createSchema(data: any) {
  return apiRequest('/api/schemas', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateSchema(id: string, data: any) {
  return apiRequest(`/api/schemas/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteSchema(id: string) {
  return apiRequest(`/api/schemas/${id}`, { method: 'DELETE' })
}

// ============================================================================
// ARCHITECTURE API WITH S3
// ============================================================================

export async function getAllArchitectures() {
  return apiRequest('/api/architecture', { method: 'GET' })
}

export async function getArchitectureById(id: string, projectId: string) {
  return apiRequest(`/api/architecture/${id}?projectId=${projectId}`, { method: 'GET' })
}

export async function getArchitecturesByProject(projectId: string) {
  return apiRequest(`/api/architecture/project/${projectId}`, { method: 'GET' })
}

export async function createArchitecture(data: any) {
  return apiRequest('/api/architecture', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateArchitecture(id: string, data: any) {
  return apiRequest(`/api/architecture/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteArchitecture(id: string, projectId: string) {
  return apiRequest(`/api/architecture/${id}?projectId=${projectId}`, { method: 'DELETE' })
}

export async function uploadArchitectureDiagram(id: string, file: File, projectId: string) {
  const base64 = await fileToBase64(file)
  return apiRequest(`/api/architecture/${id}/diagram`, {
    method: 'POST',
    body: JSON.stringify({ projectId, diagramData: base64, contentType: file.type })
  })
}

export async function getArchitectureDiagramUrl(id: string, projectId: string) {
  return apiRequest(`/api/architecture/${id}/diagram-url?projectId=${projectId}`, { method: 'GET' })
}

// ============================================================================
// CODE GENERATION API WITH S3
// ============================================================================

export async function getAllCodeGenerations() {
  return apiRequest('/api/code-gen', { method: 'GET' })
}

export async function getCodeGenerationById(id: string) {
  return apiRequest(`/api/code-gen/${id}`, { method: 'GET' })
}

export async function getCodeGenerationsByProject(projectId: string) {
  return apiRequest(`/api/code-gen/project/${projectId}`, { method: 'GET' })
}

export async function generateCode(data: any) {
  return apiRequest('/api/code-gen/generate', { method: 'POST', body: JSON.stringify(data) })
}

export async function getCodeDownloadUrl(id: string) {
  return apiRequest(`/api/code-gen/${id}/download-url`, { method: 'GET' })
}

export async function deleteCodeGeneration(id: string) {
  return apiRequest(`/api/code-gen/${id}`, { method: 'DELETE' })
}

// ============================================================================
// DEPLOYMENTS API
// ============================================================================

export async function getAllDeployments() {
  return apiRequest('/api/deployments', { method: 'GET' })
}

export async function getDeploymentById(id: string) {
  return apiRequest(`/api/deployments/${id}`, { method: 'GET' })
}

export async function getDeploymentsByProject(projectId: string) {
  return apiRequest(`/api/deployments/project/${projectId}`, { method: 'GET' })
}

export async function createDeployment(data: any) {
  return apiRequest('/api/deployments', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateDeployment(id: string, data: any) {
  return apiRequest(`/api/deployments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function getDeploymentStatus(id: string) {
  return apiRequest(`/api/deployments/${id}/status`, { method: 'GET' })
}

export async function getDeploymentLogs(id: string) {
  return apiRequest(`/api/deployments/${id}/logs`, { method: 'GET' })
}

// ============================================================================
// ANALYTICS API WITH REAL-TIME DATA
// ============================================================================

export async function getAnalyticsDashboardMetrics() {
  return apiRequest('/api/analytics/dashboard', { method: 'GET' })
}

export async function getProjectAnalytics(projectId: string) {
  return apiRequest(`/api/analytics/project/${projectId}`, { method: 'GET' })
}

export async function trackAnalyticsEvent(data: any) {
  return apiRequest('/api/analytics/track', { method: 'POST', body: JSON.stringify(data) })
}

export async function getAnalyticsChartData(chartType: string, period: string = '7d') {
  return apiRequest(`/api/analytics/chart-data?chartType=${chartType}&period=${period}`, { method: 'GET' })
}

export async function getRealtimeAnalytics(projectId?: string) {
  return apiRequest(`/api/analytics/realtime${projectId ? `?projectId=${projectId}` : ''}`, { method: 'GET' })
}

export async function getAnalyticsTrends(period: string = '7d', metric?: string) {
  return apiRequest(`/api/analytics/trends?period=${period}${metric ? `&metric=${metric}` : ''}`, { method: 'GET' })
}

// ============================================================================
// ACTIVITY API WITH SNS
// ============================================================================

export async function getAllActivities(limit?: number) {
  return apiRequest(`/api/activity${limit ? `?limit=${limit}` : ''}`, { method: 'GET' })
}

export async function getProjectActivities(projectId: string, limit?: number) {
  return apiRequest(`/api/activity/project/${projectId}${limit ? `?limit=${limit}` : ''}`, { method: 'GET' })
}

export async function logActivity(data: any) {
  return apiRequest('/api/activity', { method: 'POST', body: JSON.stringify(data) })
}

// ============================================================================
// DOCUMENTATION API WITH S3 ATTACHMENTS
// ============================================================================

export async function getAllDocumentation() {
  return apiRequest('/api/documentation', { method: 'GET' })
}

export async function getDocumentationById(id: string) {
  return apiRequest(`/api/documentation/${id}`, { method: 'GET' })
}

export async function getDocumentationByProject(projectId: string) {
  return apiRequest(`/api/documentation/project/${projectId}`, { method: 'GET' })
}

export async function createDocumentation(data: any) {
  return apiRequest('/api/documentation', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateDocumentation(id: string, data: any) {
  return apiRequest(`/api/documentation/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteDocumentation(id: string) {
  return apiRequest(`/api/documentation/${id}`, { method: 'DELETE' })
}

export async function searchDocumentation(query: string, projectId?: string) {
  return apiRequest('/api/documentation/search', {
    method: 'POST',
    body: JSON.stringify({ query, projectId })
  })
}

export async function uploadDocumentAttachment(documentId: string, file: File) {
  const base64 = await fileToBase64(file)
  return apiRequest(`/api/documentation/${documentId}/attachments`, {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, fileData: base64, contentType: file.type })
  })
}

export async function getDocumentAttachmentUrl(documentId: string, attachmentId: string) {
  return apiRequest(`/api/documentation/${documentId}/attachments/${attachmentId}/url`, { method: 'GET' })
}

export async function deleteDocumentAttachment(documentId: string, attachmentId: string) {
  return apiRequest(`/api/documentation/${documentId}/attachments/${attachmentId}`, { method: 'DELETE' })
}

// ============================================================================
// TEAM API WITH SNS NOTIFICATIONS
// ============================================================================

export async function getProjectTeam(projectId: string) {
  return apiRequest(`/api/team/project/${projectId}`, { method: 'GET' })
}

export async function inviteTeamMember(projectId: string, data: any) {
  return apiRequest(`/api/team/${projectId}/invite`, { method: 'POST', body: JSON.stringify(data) })
}

export async function acceptTeamInvitation(invitationId: string) {
  return apiRequest(`/api/team/invitations/${invitationId}/accept`, { method: 'POST' })
}

export async function getUserInvitations() {
  return apiRequest('/api/team/invitations', { method: 'GET' })
}

export async function removeTeamMember(projectId: string, userId: string) {
  return apiRequest(`/api/team/${projectId}/members/${userId}`, { method: 'DELETE' })
}

export async function updateTeamMemberRole(projectId: string, userId: string, role: string) {
  return apiRequest(`/api/team/${projectId}/members/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  })
}

// ============================================================================
// SETTINGS API WITH S3 PROFILE PICTURES
// ============================================================================

export async function getSettings() {
  return apiRequest('/api/settings', { method: 'GET' })
}

export async function updateSettings(data: any) {
  return apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
}

export async function updateTheme(theme: string) {
  return apiRequest('/api/settings/theme', { method: 'PUT', body: JSON.stringify({ theme }) })
}

export async function updateNotificationSettings(data: any) {
  return apiRequest('/api/settings/notifications', { method: 'PUT', body: JSON.stringify(data) })
}

export async function uploadProfilePicture(file: File) {
  const base64 = await fileToBase64(file)
  return apiRequest('/api/settings/profile-picture', {
    method: 'POST',
    body: JSON.stringify({ imageData: base64, contentType: file.type })
  })
}

export async function getProfilePictureUrl() {
  return apiRequest('/api/settings/profile-picture/url', { method: 'GET' })
}

export async function deleteProfilePicture() {
  return apiRequest('/api/settings/profile-picture', { method: 'DELETE' })
}

// ============================================================================
// AI API
// ============================================================================

export async function chatWithAI(message: string, context?: any) {
  return apiRequest('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) })
}

export async function generateWithAI(prompt: string, type: string) {
  return apiRequest('/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt, type }) })
}

export async function analyzeCode(code: string, language: string) {
  return apiRequest('/api/ai/analyze', { method: 'POST', body: JSON.stringify({ code, language }) })
}
