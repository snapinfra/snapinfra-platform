"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface PageContentLayoutProps {
  title: string
  subtitle?: string
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'outline'
  }
  tabs?: Array<{
    value: string
    label: string
    badge?: string
  }>
  children: React.ReactNode
  defaultTab?: string
}

export function PageContentLayout({
  title,
  subtitle,
  badge,
  tabs,
  children,
  defaultTab
}: PageContentLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {badge && (
            <Badge
              variant={badge.variant || 'secondary'}
              className="text-xs font-medium px-2.5 py-0.5 bg-blue-100 text-blue-700 border-blue-200"
            >
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 font-normal">{subtitle}</p>
        )}
      </div>

      {/* Tabs Navigation */}
      {tabs && tabs.length > 0 && (
        <Tabs defaultValue={defaultTab || tabs[0].value} className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0 w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-600",
                  "data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent",
                  "hover:text-gray-900 transition-colors"
                )}
              >
                {tab.label}
                {tab.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-[10px] font-semibold px-1.5 py-0 h-5 bg-gray-900 text-white"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {children}
        </Tabs>
      )}

      {/* Content without tabs */}
      {!tabs && children}
    </div>
  )
}

// Section component for organized content
interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 font-normal">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Field component for form-like layouts
interface FieldProps {
  label: string
  description?: string
  children: React.ReactNode
  required?: boolean
}

export function Field({ label, description, children, required }: FieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-900">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-500 font-normal">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
