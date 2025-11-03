"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useAppContext } from '@/lib/app-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Plus, Check, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectNameDialog } from '@/components/project-name-dialog'

export function ProjectContextBar() {
  const { state, dispatch } = useAppContext()
  const { currentProject, projects } = state
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; projectId: string; currentName: string }>({
    open: false,
    projectId: '',
    currentName: ''
  })

  if (!currentProject) {
    return null
  }

  const handleRename = (projectId: string, currentName: string) => {
    setRenameDialog({ open: true, projectId, currentName })
  }

  const handleRenameConfirm = (newName: string) => {
    dispatch({ type: 'RENAME_PROJECT', payload: { id: renameDialog.projectId, name: newName } })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'building':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Project Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-9 px-3 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 max-w-[200px]">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {currentProject.name}
                </span>
              </div>
              {currentProject.status && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] h-4 px-1.5 capitalize",
                    getStatusColor(currentProject.status)
                  )}
                >
                  {currentProject.status}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 ml-1" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[320px]">
          <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
            Switch Project
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[300px] overflow-y-auto">
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => {
                  dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {currentProject.id === project.id && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm truncate",
                      currentProject.id === project.id ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                    )}>
                      {project.name}
                    </span>
                  </div>
                  {project.status && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] h-4 px-1.5 capitalize flex-shrink-0",
                        getStatusColor(project.status)
                      )}
                    >
                      {project.status}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleRename(currentProject.id, currentProject.name)}
            className="cursor-pointer"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            <span className="font-medium">Rename Current Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/onboarding?new=true" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-medium">Create New Project</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/projects" className="cursor-pointer">
              <span className="text-gray-700">View All Projects</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ProjectNameDialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}
        onConfirm={handleRenameConfirm}
        currentName={renameDialog.currentName}
        existingNames={projects.map(p => p.name)}
        mode="rename"
      />
    </div>
  )
}
