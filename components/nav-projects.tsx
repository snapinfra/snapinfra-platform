"use client"

import { useState } from "react"
import { Database, Forward, MoreHorizontal, Trash2, Folder, Plus, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProjectNameDialog } from "@/components/project-name-dialog"
import { useAppContext } from "@/lib/app-context"

export function NavProjects({
  projects,
  currentProject,
  onProjectSelect,
  onProjectDelete,
}: {
  projects: {
    id: string
    name: string
    url: string
    status?: string
    tables?: number
    endpoints?: number
    isActive?: boolean
    lastActive?: string
  }[]
  currentProject?: any
  onProjectSelect?: (projectId: string) => void
  onProjectDelete?: (projectId: string) => void
}) {
  const { open } = useSidebar()
  const { state, dispatch } = useAppContext()
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; projectId: string; currentName: string }>({
    open: false,
    projectId: '',
    currentName: ''
  })

  const handleRename = (projectId: string, currentName: string) => {
    setRenameDialog({ open: true, projectId, currentName })
  }

  const handleRenameConfirm = (newName: string) => {
    dispatch({ type: 'RENAME_PROJECT', payload: { id: renameDialog.projectId, name: newName } })
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.length === 0 ? (
          // Empty state
          <SidebarMenuItem>
            <div className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">
                No projects yet
              </div>
              <a 
                href="/onboarding?new=true" 
                className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <Plus className="w-3 h-3" />
                Create your first project
              </a>
            </div>
          </SidebarMenuItem>
        ) : (
          projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              tooltip={!open ? item.name : undefined}
              className={`${item.isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'} h-auto min-h-[2.5rem] py-2 transition-colors`}
              onClick={() => onProjectSelect?.(item.id)}
              isActive={item.isActive}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2 w-full group">
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{item.name}</span>
                  {item.status && open && (
                    <Badge
                      variant="secondary"
                      className={`text-xs px-1.5 py-0.5 shrink-0 ${
                        item.status === 'deployed' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'building' ? 'bg-orange-100 text-orange-700' :
                        item.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  )}
                  {open && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRename(item.id, item.name)
                        }}
                        className="p-1 hover:bg-blue-100 hover:text-blue-600 rounded-sm"
                        title="Rename project"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                            onProjectDelete?.(item.id)
                          }
                        }}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded-sm"
                        title="Delete project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {open && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-6 mt-1">
                    {typeof item.tables === "number" && (
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>{item.tables} tables</span>
                      </div>
                    )}
                    {typeof item.endpoints === "number" && (
                      <div className="flex items-center gap-1">
                        <span>â€¢</span>
                        <span>{item.endpoints} endpoints</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          ))
        )}
        
        {/* New Project button */}
        {projects.length > 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={!open ? "New Project" : undefined}
            >
              <a href="/onboarding?new=true" className="text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
                {open && <span>New Project</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
      
      <ProjectNameDialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}
        onConfirm={handleRenameConfirm}
        currentName={renameDialog.currentName}
        existingNames={state.projects.map(p => p.name)}
        mode="rename"
      />
    </SidebarGroup>
  )
}
