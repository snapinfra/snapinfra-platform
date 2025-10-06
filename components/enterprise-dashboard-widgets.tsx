"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Enterprise Metric Card - Information Dense, Professional
interface EnterpriseMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    period: string
    isPositive?: boolean
  }
  icon?: React.ReactNode
  status?: 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export function EnterpriseMetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  status,
  className,
}: EnterpriseMetricCardProps) {
  const statusColors = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="text-gray-600">{icon}</div>
              )}
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            
            <div className="space-y-1">
              <div className="text-3xl font-semibold text-gray-900">{value}</div>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>

            {change && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded',
                    change.isPositive === undefined
                      ? 'bg-gray-100 text-gray-600'
                      : change.isPositive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  )}
                >
                  {change.isPositive === true && <ArrowUp className="h-3 w-3" />}
                  {change.isPositive === false && <ArrowDown className="h-3 w-3" />}
                  {change.isPositive === undefined && <Minus className="h-3 w-3" />}
                  <span>{Math.abs(change.value)}%</span>
                </div>
                <span className="text-xs text-gray-500">{change.period}</span>
              </div>
            )}
          </div>

          {status && (
            <Badge variant="secondary" className={cn('text-xs', statusColors[status])}>
              {status === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
              {status === 'info' && <Info className="h-3 w-3 mr-1" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Stats Grid - Professional, Data Dense
interface StatItem {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
}

interface StatsGridProps {
  title?: string
  description?: string
  stats: StatItem[]
  columns?: number
}

export function StatsGrid({ title, description, stats, columns = 4 }: StatsGridProps) {
  return (
    <Card className="border border-gray-200">
      {(title || description) && (
        <CardHeader className="border-b border-gray-200 pb-4">
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn('p-0')}>
        <div
          className={cn(
            'grid divide-x divide-y divide-gray-200',
            columns === 2 && 'grid-cols-2',
            columns === 3 && 'grid-cols-3',
            columns === 4 && 'grid-cols-4',
            columns === 5 && 'grid-cols-5',
            columns === 6 && 'grid-cols-6'
          )}
        >
          {stats.map((stat, index) => (
            <div key={index} className="p-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.change !== undefined && (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        stat.change > 0 ? 'text-green-600' : stat.change < 0 ? 'text-red-600' : 'text-gray-500'
                      )}
                    >
                      {stat.change > 0 && '+'}
                      {stat.change}%
                    </span>
                  )}
                </div>
                {stat.changeLabel && (
                  <p className="text-xs text-gray-500">{stat.changeLabel}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Timeline - Enterprise Style
interface TimelineItem {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description?: string
  timestamp: string
  user?: string
  metadata?: Record<string, any>
}

interface ActivityTimelineProps {
  items: TimelineItem[]
  className?: string
}

export function ActivityTimeline({ items, className }: ActivityTimelineProps) {
  const getTypeConfig = (type: TimelineItem['type']) => {
    const configs = {
      success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    }
    return configs[type]
  }

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Activity Timeline
          </CardTitle>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No recent activity
            </div>
          ) : (
            items.map((item) => {
              const config = getTypeConfig(item.type)
              const Icon = config.icon
              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full border', config.bg, config.border)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                      )}
                      {item.user && (
                        <p className="text-xs text-gray-500">by {item.user}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Data Summary Card - AWS/Jira Style
interface DataSummaryCardProps {
  title: string
  description?: string
  data: Array<{
    label: string
    value: string | number
    subtitle?: string
    badge?: { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
  }>
  actions?: React.ReactNode
}

export function DataSummaryCard({ title, description, data, actions }: DataSummaryCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    {item.badge && (
                      <Badge variant={item.badge.variant || 'secondary'} className="text-xs">
                        {item.badge.label}
                      </Badge>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-900 ml-4">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Status Overview Card
interface StatusOverviewProps {
  title: string
  items: Array<{
    label: string
    status: 'operational' | 'degraded' | 'down' | 'maintenance'
    description?: string
    lastChecked?: string
  }>
}

export function StatusOverview({ title, items }: StatusOverviewProps) {
  const statusConfig = {
    operational: { color: 'bg-green-500', label: 'Operational', textColor: 'text-green-700' },
    degraded: { color: 'bg-yellow-500', label: 'Degraded', textColor: 'text-yellow-700' },
    down: { color: 'bg-red-500', label: 'Down', textColor: 'text-red-700' },
    maintenance: { color: 'bg-blue-500', label: 'Maintenance', textColor: 'text-blue-700' },
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {items.map((item, index) => {
            const config = statusConfig[item.status]
            return (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn('h-2 w-2 rounded-full mt-2', config.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      {item.lastChecked && (
                        <p className="text-xs text-gray-500 mt-2">Last checked: {item.lastChecked}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn('text-xs', config.textColor, 'bg-transparent border')}>
                    {config.label}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Tracker Card
interface ProgressItem {
  label: string
  current: number
  total: number
  percentage: number
}

interface ProgressTrackerProps {
  title: string
  items: ProgressItem[]
}

export function ProgressTracker({ title, items }: ProgressTrackerProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{item.label}</span>
              <span className="text-gray-600">
                {item.current} / {item.total}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={item.percentage} className="h-2 flex-1" />
              <span className="text-sm font-medium text-gray-600 w-12 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
