"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '@/lib/workspace-context'
import { useAppContext } from '@/lib/app-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Code2,
  GitBranch,
  Activity,
  Settings,
  BarChart3,
  Sparkles,
  X,
  Menu,
  Rocket,
  Users,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { slideInRight, fadeIn, staggerContainer, staggerItem } from '@/lib/animations'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Projects', href: '/projects', icon: FolderKanban, badge: 'New' },
  { title: 'Schema', href: '/schema', icon: Database },
  { title: 'Architecture', href: '/architecture-demo', icon: GitBranch },
  { title: 'Code Gen', href: '/code-generation', icon: Code2 },
  { title: 'Deployments', href: '/deployments', icon: Rocket },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'AI Assistant', href: '/ai-chat', icon: Sparkles, badge: 3 },
  { title: 'Activity', href: '/activity', icon: Activity },
  { title: 'Documentation', href: '/docs', icon: BookOpen },
  { title: 'Team', href: '/team', icon: Users },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspace()
  const { state } = useAppContext()

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Menu Overlay & Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Sliding Panel */}
            <motion.div
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed right-0 top-0 bottom-0 z-50 w-[85vw] max-w-sm bg-white shadow-2xl md:hidden"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: currentWorkspace?.color + '20' }}
                    >
                      {currentWorkspace?.icon || '🏢'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {currentWorkspace?.name || 'Workspace'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {currentWorkspace?.plan || 'free'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Current Project Info */}
                {state.currentProject && (
                  <div className="border-b border-gray-200 p-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">CURRENT PROJECT</div>
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {state.currentProject.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {state.currentProject.schema?.length || 0} tables
                        </div>
                        <div className="flex items-center gap-1">
                          <Code2 className="h-3 w-3" />
                          {state.currentProject.endpoints?.length || 0} APIs
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <ScrollArea className="flex-1">
                  <motion.nav
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="p-4 space-y-1"
                  >
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <motion.div key={item.href} variants={staggerItem}>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                              isActive
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'h-5 px-2 text-xs',
                                  isActive && 'bg-white/20 text-white'
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isActive && (
                              <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            )}
                          </Link>
                        </motion.div>
                      )
                    })}
                  </motion.nav>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="border-t border-gray-200 p-4 space-y-2">
                  <Button className="w-full" size="lg">
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Project
                  </Button>
                  <div className="text-center">
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
