"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut, Zap, Plus, Bell, Search, GitBranch, Star, Eye, MessageSquare, Database, Rocket } from "lucide-react"
import { useAppContext } from "@/lib/app-context"
import { DeploymentModal } from "./deployment-modal"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function Header() {
  const { state } = useAppContext()
  const { currentProject, projects } = state
  const pathname = usePathname()

  // Ensure client-only state doesn’t affect the initial render (SSR vs first client render)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  
  // Check if we're in onboarding mode
  const isOnboarding = pathname?.includes('/onboarding')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Logo, Sidebar trigger, Project info */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Removed SidebarTrigger for simplified layout */}
          <div className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 ${
            isOnboarding ? 'ml-10 sm:ml-0' : ''
          }`}>
            <div className="h-5 sm:h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 px-2">
              <Image 
                src="/rhinom-logo.svg" 
                alt="Rhinoback Logo" 
                width={70} 
                height={15} 
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Only show project name in dashboard, not in onboarding */}
              {!isOnboarding && (
                <>
                  {currentProject ? (
                    <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>{currentProject.name}</h1>
                  ) : (
                    <h1 className="text-base sm:text-lg text-gray-500" style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.025em' }}>New Project</h1>
                  )}
                </>
              )}
            </div>
          </div>
          

          {/* Project status and stats - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            {isClient && currentProject && (
              <>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    currentProject.status === 'deployed' ? 'bg-green-100 text-green-700 border-green-200' :
                    currentProject.status === 'building' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    currentProject.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {currentProject.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <GitBranch className="w-3 h-3" />
                  <span>{currentProject.schema?.length || 0} tables</span>
                </div>
              </>
            )}
            <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
              Beta
            </Badge>
          </div>
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Notifications - hidden on mobile */}
          <Button variant="ghost" size="sm" className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-600 hover:bg-gray-100">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/onboarding?new=true">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-2 sm:px-3"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </Link>
            
            {isClient && currentProject && (
              <DeploymentModal>
                <Button
                  size="sm"
                  className="h-8 sm:h-9 bg-gray-900 hover:bg-gray-800 text-white px-2 sm:px-3"
                >
                  <Rocket className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Deploy</span>
                </Button>
              </DeploymentModal>
            )}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-gray-100"
              >
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs sm:text-sm">MM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">Manoj Maheshwar</p>
                <p className="text-xs text-gray-500">manoj@rhinoback.com</p>
              </div>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Your profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                <span>Your projects</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
