"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Code2,
  GitBranch,
  Rocket,
  BarChart3,
  Sparkles,
  Activity,
  BookOpen,
  Users,
  Settings,
  Search,
  Plus,
  FileText,
  Terminal,
  Zap,
} from 'lucide-react'

interface Command {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  keywords?: string[]
  section: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View project overview',
      icon: LayoutDashboard,
      section: 'Navigation',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      description: 'Manage all projects',
      icon: FolderKanban,
      section: 'Navigation',
      action: () => router.push('/projects'),
    },
    {
      id: 'nav-schema',
      title: 'Go to Schema',
      description: 'Database design',
      icon: Database,
      section: 'Navigation',
      action: () => router.push('/schema'),
    },
    {
      id: 'nav-architecture',
      title: 'Go to Architecture',
      description: 'System architecture',
      icon: GitBranch,
      section: 'Navigation',
      action: () => router.push('/architecture-demo'),
    },
    {
      id: 'nav-codegen',
      title: 'Go to Code Generation',
      description: 'Generate backend code',
      icon: Code2,
      section: 'Navigation',
      action: () => router.push('/code-generation'),
    },
    {
      id: 'nav-deployments',
      title: 'Go to Deployments',
      description: 'Deploy & monitor',
      icon: Rocket,
      section: 'Navigation',
      action: () => router.push('/deployments'),
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      description: 'Project insights',
      icon: BarChart3,
      section: 'Navigation',
      action: () => router.push('/analytics'),
    },
    {
      id: 'nav-ai',
      title: 'Go to AI Assistant',
      description: 'AI-powered help',
      icon: Sparkles,
      section: 'Navigation',
      action: () => router.push('/ai-chat'),
    },
    // Actions
    {
      id: 'action-new-project',
      title: 'Create New Project',
      description: 'Start a new backend project',
      icon: Plus,
      section: 'Actions',
      keywords: ['new', 'create', 'project'],
      action: () => router.push('/onboarding?new=true'),
    },
    {
      id: 'action-deploy',
      title: 'Deploy Current Project',
      description: 'Deploy to cloud',
      icon: Rocket,
      section: 'Actions',
      keywords: ['deploy', 'ship', 'production'],
      action: () => console.log('Open deploy modal'),
    },
    {
      id: 'action-generate-code',
      title: 'Generate Backend Code',
      description: 'AI-powered code generation',
      icon: Code2,
      section: 'Actions',
      keywords: ['generate', 'code', 'ai'],
      action: () => console.log('Open code generation modal'),
    },
    {
      id: 'action-generate-iac',
      title: 'Generate Infrastructure Code',
      description: 'Generate IaC templates',
      icon: Terminal,
      section: 'Actions',
      keywords: ['infrastructure', 'iac', 'terraform', 'docker'],
      action: () => console.log('Open IaC generation modal'),
    },
    // Settings
    {
      id: 'settings-workspace',
      title: 'Workspace Settings',
      description: 'Manage workspace',
      icon: Settings,
      section: 'Settings',
      action: () => router.push('/settings/workspace'),
    },
    {
      id: 'settings-team',
      title: 'Team Management',
      description: 'Invite & manage members',
      icon: Users,
      section: 'Settings',
      action: () => router.push('/team'),
    },
    {
      id: 'settings-activity',
      title: 'View Activity Log',
      description: 'Recent changes',
      icon: Activity,
      section: 'Settings',
      action: () => router.push('/activity'),
    },
    {
      id: 'settings-docs',
      title: 'View Documentation',
      description: 'Guides & API docs',
      icon: BookOpen,
      section: 'Settings',
      action: () => router.push('/docs'),
    },
  ]

  const runCommand = useCallback((command: Command) => {
    setOpen(false)
    command.action()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {['Navigation', 'Actions', 'Settings'].map((section) => {
          const sectionCommands = commands.filter((cmd) => cmd.section === section)
          if (sectionCommands.length === 0) return null

          return (
            <React.Fragment key={section}>
              <CommandGroup heading={section}>
                {sectionCommands.map((command) => {
                  const Icon = command.icon
                  return (
                    <CommandItem
                      key={command.id}
                      onSelect={() => runCommand(command)}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Icon className="h-4 w-4 text-gray-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{command.title}</span>
                        {command.description && (
                          <span className="text-xs text-gray-500">{command.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
