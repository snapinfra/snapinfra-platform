"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import { useAppContext } from '@/lib/app-context'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Code2,
  GitBranch,
  Activity,
  Settings,
  Users,
  User,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Rocket,
  Shield,
  Zap,
  BookOpen,
  ChevronDown,
  Building2,
  Boxes,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & metrics' },
  { title: 'Projects', href: '/projects', icon: Boxes, badge: 'New', description: 'Manage all projects' },
  { title: 'Schema', href: '/schema', icon: Database, description: 'Database design' },
  { title: 'Architecture', href: '/architecture', icon: Layers, description: 'System architecture' },
  { title: 'Code Gen', href: '/code-generation', icon: Code2, description: 'Generate code' },
  { title: 'Deployments', href: '/deployments', icon: Rocket, description: 'Deploy & monitor' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Project insights' },
  { title: 'AI Assistant', href: '/ai-chat', icon: Sparkles, badge: 3, description: 'AI-powered help' },
]

const secondaryItems: NavItem[] = [
  { title: 'Activity', href: '/activity', icon: Activity, description: 'Recent changes' },
  { title: 'Documentation', href: '/docs', icon: BookOpen, description: 'Guides & API docs' },
  { title: 'Team', href: '/team', icon: Users, description: 'Workspace members' },
  { title: 'Settings', href: '/settings', icon: Settings, description: 'Preferences' },
]

export function WorkspaceSidebar() {
  const { currentWorkspace, workspaces, switchWorkspace, sidebarCollapsed, toggleSidebar } = useWorkspace()
  const { state } = useAppContext()
  const pathname = usePathname()
  const { user } = useUser()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      pro: 'bg-blue-100 text-blue-700',
      enterprise: 'bg-purple-100 text-purple-700',
    }
    return colors[plan as keyof typeof colors] || colors.free
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        <div className="flex h-full flex-col min-h-0">
          {/* Header with Logo, Workspace Switcher & Collapse */}
          <div className="px-5 py-4 space-y-4">
            {!sidebarCollapsed ? (
              <>
              {/* Top Row: Logo & Collapse Button */}
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/snapinfra-logo.svg" 
                    alt="Snapinfra" 
                    width={110} 
                    height={24} 
                    className="h-6 w-auto"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={toggleSidebar}
                >
                  <div className="border border-gray-300 rounded p-0.5">
                    <ChevronLeft className="h-3 w-3" />
                  </div>
                </Button>
              </div>
              
              {/* Workspace Switcher */}
              <DropdownMenu open={workspaceMenuOpen} onOpenChange={setWorkspaceMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-auto w-full justify-start px-3 py-2.5 hover:bg-gray-50 rounded-lg group border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate flex-1 text-left">
                      {currentWorkspace?.name || 'Personal'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 group-hover:text-gray-700 transition-colors ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px] p-0 shadow-lg border-gray-200">
                  {/* Current Workspace */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900">
                        {currentWorkspace?.name || 'Personal'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className="text-[10px] h-5 px-2 capitalize font-medium bg-gray-100 text-gray-700 border-gray-200"
                        >
                          {currentWorkspace?.plan || 'FREE'}
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Other Workspaces */}
                  {workspaces.filter(w => w.id !== currentWorkspace?.id).length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Switch Workspace</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {workspaces
                          .filter(w => w.id !== currentWorkspace?.id)
                          .map((workspace) => (
                          <DropdownMenuItem
                            key={workspace.id}
                            onClick={() => switchWorkspace(workspace.id)}
                            className="cursor-pointer px-4 py-2.5 mx-2 my-0.5 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{workspace.plan} plan</div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                      <DropdownMenuSeparator className="my-0" />
                    </>
                  )}
                  
                  {/* Actions */}
                  <div className="p-2">
                    <DropdownMenuItem className="cursor-pointer px-4 py-2 rounded-md font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                      Create workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer px-4 py-2 rounded-md font-normal text-gray-700 hover:bg-gray-50 transition-colors">
                      Workspace settings
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Link href="/" className="flex items-center justify-center">
                  <Image 
                    src="/snap-icon.svg" 
                    alt="Snapinfra" 
                    width={32} 
                    height={32} 
                    className="h-8 w-8"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={toggleSidebar}
                >
                  <div className="border border-gray-300 rounded p-0.5">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </Button>
              </div>
            )}
          </div>
          
          {/* Home Link */}
          {!sidebarCollapsed && (
            <div className="px-5 py-2">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <LayoutDashboard className="h-5 w-5 text-gray-500" />
                <span>Home</span>
              </Link>
            </div>
          )}
          
          {/* Navigation Items - Scrollable */}
          <div className={cn(
            "flex-1 overflow-y-auto py-0 transition-all",
            sidebarCollapsed ? "px-2" : "px-5"
          )}>
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="mb-2 mt-4 px-2 text-xs font-normal text-gray-500">
                  Build
                </div>
              )}
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={sidebarCollapsed}
                />
              ))}

              {!sidebarCollapsed && (
                <div className="mb-2 mt-4 px-2 text-xs font-normal text-gray-500">
                  Evaluate
                </div>
              )}
              {secondaryItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>

            {/* Integrations Section */}
            {!sidebarCollapsed && (
              <div className="mb-2 mt-4 px-2 text-xs font-normal text-gray-500">
                Integrations
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            {!sidebarCollapsed ? (
              <div className="space-y-3">
                {/* Upgrade Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium h-9 rounded-lg"
                >
                  <Zap className="h-4 w-4 mr-2 fill-gray-700" />
                  Upgrade
                </Button>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-2 h-auto hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full">
                        <img
                          src={user?.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=MJ"}
                          alt="Profile"
                          className="h-9 w-9 rounded-full flex-shrink-0 bg-gray-800"
                        />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900 truncate w-full text-left">
                            {user?.fullName || user?.firstName || "User"}
                          </span>
                          <span className="text-xs text-gray-500 truncate w-full text-left">
                            My Workspace
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Workspace Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={toggleSidebar}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem
  isActive: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-normal transition-colors',
        isActive 
          ? 'bg-gray-100 text-gray-900' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
        collapsed && 'justify-center'
      )}
    >
      <Icon className={cn(
        'h-5 w-5 flex-shrink-0', 
        isActive ? 'text-gray-900' : 'text-gray-600'
      )} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <Badge 
              variant="secondary" 
              className={cn(
                'h-5 px-2 text-[10px] font-medium rounded-md',
                typeof item.badge === 'number' 
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700'
              )}
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">
          <div>
            <p className="font-semibold">{item.title}</p>
            {item.description && (
              <p className="text-xs text-gray-500">{item.description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}
