"use client"

import type * as React from "react"
import { useEffect } from "react"
import { Folder, Zap, Rocket } from "lucide-react"
import Image from "next/image"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { useAppContext } from "@/lib/app-context"

// Custom component for rhinom logo
const RhinomLogo = ({ className }: { className?: string }) => (
  <Image 
    src="/rhinom-logo.svg" 
    alt="Rhinoback Logo" 
    width={32} 
    height={7} 
    className={`${className} object-contain`}
  />
)

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, dispatch } = useAppContext()
  const { projects, currentProject } = state

  // Static data for teams and user (can be made dynamic later)
  const staticData = {
    user: {
      name: "Manoj Maheshwar",
      email: "manoj@rhinoback.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    teams: [
      {
        name: "Rhinoback",
        logo: RhinomLogo,
        plan: "Pro",
      },
      {
        name: "Personal",
        logo: Zap,
        plan: "Free",
      },
    ],
  }

  // Auto-select first project if none is selected and projects exist
  useEffect(() => {
    if (!currentProject && projects.length > 0) {
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: projects[0] })
    }
  }, [currentProject, projects, dispatch])

  // Convert app context projects to nav projects format
  const navProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    url: "#", // Currently staying on same page, could be made dynamic
    icon: Folder,
    status: project.status,
    tables: project.schema?.length || 0,
    endpoints: project.endpoints?.length || 0,
    isActive: currentProject?.id === project.id,
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={staticData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects 
          projects={navProjects} 
          currentProject={currentProject}
          onProjectSelect={(projectId) => {
            const project = projects.find(p => p.id === projectId)
            if (project) {
              dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })
            }
          }}
          onProjectDelete={(projectId) => {
            dispatch({ type: 'DELETE_PROJECT', payload: projectId })
          }}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
