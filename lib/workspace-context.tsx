"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Workspace {
  id: string
  name: string
  slug: string
  icon?: string
  color?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
  members: number
}

export interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  switchWorkspace: (workspaceId: string) => void
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => void
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// Mock initial workspaces
const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Personal',
    slug: 'personal',
    icon: '👤',
    color: '#3b82f6',
    plan: 'free',
    createdAt: new Date('2024-01-01'),
    members: 1,
  },
  {
    id: 'ws-2',
    name: 'Acme Corp',
    slug: 'acme-corp',
    icon: '🏢',
    color: '#8b5cf6',
    plan: 'enterprise',
    createdAt: new Date('2024-02-15'),
    members: 24,
  },
  {
    id: 'ws-3',
    name: 'Startup Labs',
    slug: 'startup-labs',
    icon: '🚀',
    color: '#10b981',
    plan: 'pro',
    createdAt: new Date('2024-03-20'),
    members: 8,
  },
]

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(mockWorkspaces[0])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const switchWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find((ws) => ws.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }, [workspaces])

  const createWorkspace = useCallback((workspace: Omit<Workspace, 'id' | 'createdAt'>) => {
    const newWorkspace: Workspace = {
      ...workspace,
      id: `ws-${Date.now()}`,
      createdAt: new Date(),
    }
    setWorkspaces((prev) => [...prev, newWorkspace])
    setCurrentWorkspace(newWorkspace)
  }, [])

  const updateWorkspace = useCallback((workspaceId: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === workspaceId ? { ...ws, ...updates } : ws))
    )
    setCurrentWorkspace((prev) => 
      prev?.id === workspaceId ? { ...prev, ...updates } : prev
    )
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
