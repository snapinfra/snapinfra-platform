"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '@/lib/appContext/app-context'
import { Database, Layers, Code2, Rocket, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectTab {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function ProjectTabsNav() {
  const { state } = useAppContext()
  const { currentProject } = state
  const pathname = usePathname()

  if (!currentProject) {
    return null
  }

  const projectTabs: ProjectTab[] = [
    { label: 'Overview', href: `/projects/${currentProject.id}`, icon: LayoutDashboard },
    { label: 'Schema', href: `/projects/${currentProject.id}/schema`, icon: Database },
    { label: 'Architecture', href: `/projects/${currentProject.id}/architecture`, icon: Layers },
    { label: 'Code Gen', href: `/projects/${currentProject.id}/code-generation`, icon: Code2 },
    { label: 'Deploy', href: `/projects/${currentProject.id}/deployments`, icon: Rocket },
  ]

  return (
    <nav className="flex items-center gap-1 h-full">
      {projectTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href.split('?')[0]
        return (
          <Link 
            key={tab.label} 
            href={tab.href}
            className={cn(
              "h-full px-4 text-sm font-medium transition-colors flex items-center gap-2 relative border-b-2",
              isActive 
                ? "text-gray-900 border-gray-900" 
                : "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
