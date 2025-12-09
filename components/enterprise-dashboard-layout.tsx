"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import { useAppContext } from '@/lib/appContext/app-context'
import { WorkspaceSidebar } from '@/components/workspace-sidebar'
import { ProjectContextBar } from '@/components/project-context-bar'
import { ProjectTabsNav } from '@/components/project-tabs-nav'
import { CommandPalette } from '@/components/command-palette'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserButton } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, HelpCircle, Settings, Search, ChevronRight, CheckCircle2, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EnterpriseDashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function EnterpriseDashboardLayout({ 
  children, 
  title, 
  description, 
  actions,
  breadcrumbs
}: EnterpriseDashboardLayoutProps) {
  const { sidebarCollapsed } = useWorkspace()
  const { state } = useAppContext()
  const pathname = usePathname()
  
  // Pages where project context should NOT be shown (list/browse views)
  const hideProjectContext = [
    '/projects',
    '/analytics', 
    '/ai-chat',
    '/activity',
    '/docs',
    '/team',
    '/settings'
  ].includes(pathname)
  
  // Show project context only if: project is selected AND not on a list page
  const showProjectContext = state.currentProject && !hideProjectContext

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkspaceSidebar />
      <CommandPalette />
      
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'ml-16' : 'ml-[260px]'
        )}
      >
        {/* Top Navigation Bar - Clean and Professional */}
        <header className="sticky top-0 z-30 bg-white">
          {/* Primary Nav - Project Switcher + Global Actions */}
          <div className="flex h-14 items-center justify-between px-6 border-b border-gray-200">
            {/* Left Side - Project Context + Breadcrumbs */}
            <div className="flex items-center gap-4">
              {/* Project Context Bar - Shows current project on project-specific pages */}
              {showProjectContext && <ProjectContextBar />}
              
              {/* Breadcrumbs - Only show if no project context */}
              {breadcrumbs && breadcrumbs.length > 0 && !showProjectContext && (
                <nav className="flex items-center space-x-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 mx-0.5" />
                      )}
                      {crumb.href ? (
                        <a
                          href={crumb.href}
                          className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-1 py-0.5 rounded hover:bg-gray-50"
                        >
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="text-gray-900 font-semibold px-1">
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="h-8 w-64 pl-9 pr-12 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500">
                  ⌘K
                </kbd>
              </div>

              {/* New Project Button */}
              <Link href="/onboarding?new=true">
                <button className="h-8 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  New Project
                </button>
              </Link>

              {/* User Menu */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          
          {/* Secondary Tab Bar - Only shown when project is selected on project pages */}
          {showProjectContext && (
            <div className="border-b border-gray-200 bg-white">
              <div className="h-12 px-6 flex items-center">
                <ProjectTabsNav />
              </div>
            </div>
          )}
        </header>

        {/* Page Header - Professional and Clean */}
        {title && (
          <div className="border-b border-gray-100 bg-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-600 mt-1.5">{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 py-4 px-6 mt-12">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">© 2025 Snapinfra. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-5">
              <a href="/docs" className="hover:text-gray-900 font-medium transition-colors">Documentation</a>
              <a href="/support" className="hover:text-gray-900 font-medium transition-colors">Support</a>
              <a href="/privacy" className="hover:text-gray-900 font-medium transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-900 font-medium transition-colors">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
