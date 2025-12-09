"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut, Zap, Plus, Bell, Search, GitBranch, Star, Eye, MessageSquare, Database } from "lucide-react"
import { useAppContext } from "@/lib/appContext/app-context"
import { DeploymentModal } from "./deployment-modal"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function Header() {
  const { state } = useAppContext()
  const { currentProject, projects } = state
  const pathname = usePathname()

  // Ensure client-only state doesnâ€™t affect the initial render (SSR vs first client render)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  
  // Check if we're in onboarding mode
  const isOnboarding = pathname?.includes('/onboarding')

  return (
    <nav className="w-full h-14 fixed top-0 left-0 right-0 bg-white border-b border-[rgba(55,50,47,0.08)] z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/snapinfra-logo.svg" alt="Snapinfra" width={100} height={24} className="h-6 w-auto" />
          </Link>
        </div>
        
        {/* Right side - Nav Links and Auth Buttons */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            {!isOnboarding && isClient && currentProject && (
              <>
                <span className="text-[#37322F] text-sm font-medium font-sans">
                  {currentProject.name}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    currentProject.status === 'deployed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    currentProject.status === 'building' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    currentProject.status === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {currentProject.status}
                </Badge>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/onboarding?new=true">
              <button className="px-4 py-2 bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-sm font-medium font-sans transition-colors">
                New Project
              </button>
            </Link>
            {isClient && currentProject && (
              <DeploymentModal>
                <button className="px-5 py-2 bg-[#005BE3] hover:bg-[#004BC9] text-white text-sm font-medium font-sans shadow-sm transition-all duration-200">
                  Deploy
                </button>
              </DeploymentModal>
            )}
            {isClient && !currentProject && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-full hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-sm">MM</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">Manoj Maheshwar</p>
                    <p className="text-xs text-gray-500">manoj@Snapinfra.com</p>
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
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
