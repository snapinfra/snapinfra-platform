"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  User,
  Calendar,
  Tag,
  Flag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Settings,
  Eye,
  Star,
  ArrowUpRight,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type Priority = 'critical' | 'high' | 'medium' | 'low'
type Status = 'todo' | 'in-progress' | 'done' | 'blocked'
type IssueType = 'story' | 'task' | 'bug' | 'epic'

interface Issue {
  id: string
  key: string
  title: string
  description?: string
  type: IssueType
  status: Status
  priority: Priority
  assignee?: {
    name: string
    avatar?: string
    initials: string
  }
  reporter?: {
    name: string
    avatar?: string
    initials: string
  }
  labels: string[]
  storyPoints?: number
  epicName?: string
  sprint?: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  comments?: number
  attachments?: number
  subtasks?: {
    total: number
    completed: number
  }
}

interface Column {
  id: Status
  title: string
  issues: Issue[]
  limit?: number
}

const SAMPLE_ISSUES: Issue[] = [
  {
    id: '1',
    key: 'PLAT-25636',
    title: 'Notifications upgrade for platform links',
    description: 'Implement new notification system with enhanced platform integration',
    type: 'story',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Alice Johnson', initials: 'AJ', avatar: undefined },
    reporter: { name: 'Bob Smith', initials: 'BS' },
    labels: ['NOTIFICATIONS', 'PLATFORM'],
    storyPoints: 3,
    epicName: 'Platform Enhancement',
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-20'),
    comments: 2,
    subtasks: { total: 4, completed: 1 },
  },
  {
    id: '2',
    key: 'PLAT-25638',
    title: 'Customer application auth update',
    description: 'Update authentication flow for customer applications',
    type: 'story',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Carol White', initials: 'CW' },
    reporter: { name: 'David Lee', initials: 'DL' },
    labels: ['CUSTOMERS', 'AUTH'],
    storyPoints: 5,
    epicName: 'Security Initiative',
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-21'),
    dueDate: new Date('2025-02-15'),
    comments: 5,
    attachments: 2,
    subtasks: { total: 6, completed: 2 },
  },
  {
    id: '3',
    key: 'PLAT-25639',
    title: 'Commerce app connector buildout',
    description: 'Build comprehensive connector for commerce applications',
    type: 'story',
    status: 'in-progress',
    priority: 'high',
    assignee: { name: 'Emma Davis', initials: 'ED' },
    reporter: { name: 'Frank Miller', initials: 'FM' },
    labels: ['COMMERCE', 'INTEGRATION'],
    storyPoints: 5,
    epicName: 'Commerce Platform',
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-22'),
    dueDate: new Date('2025-02-10'),
    comments: 12,
    attachments: 3,
    subtasks: { total: 8, completed: 5 },
  },
  {
    id: '4',
    key: 'PLAT-25637',
    title: 'Setup product feature improvement',
    description: 'Enhance product feature setup workflow',
    type: 'story',
    status: 'done',
    priority: 'medium',
    assignee: { name: 'Grace Kim', initials: 'GK' },
    reporter: { name: 'Henry Zhang', initials: 'HZ' },
    labels: ['PRODUCTS', 'UX'],
    storyPoints: 4,
    epicName: 'Product Enhancement',
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-23'),
    comments: 8,
    subtasks: { total: 5, completed: 5 },
  },
  {
    id: '5',
    key: 'PLAT-25640',
    title: 'Salesforce service connector patch',
    description: 'Critical patch for Salesforce integration issues',
    type: 'bug',
    status: 'done',
    priority: 'critical',
    assignee: { name: 'Ian Brown', initials: 'IB' },
    reporter: { name: 'Jane Wilson', initials: 'JW' },
    labels: ['SERVICE CONNECTOR', 'SALESFORCE'],
    storyPoints: 3,
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-23'),
    comments: 15,
    attachments: 1,
    subtasks: { total: 3, completed: 3 },
  },
  {
    id: '6',
    key: 'PLAT-25641',
    title: 'Marketing product service upgrade',
    description: 'Major upgrade to marketing product services',
    type: 'epic',
    status: 'done',
    priority: 'medium',
    assignee: { name: 'Kelly Adams', initials: 'KA' },
    reporter: { name: 'Liam Chen', initials: 'LC' },
    labels: ['MARKETING CAMPAIGN LAUNCH', 'SERVICES'],
    storyPoints: 2,
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-22'),
    comments: 20,
    attachments: 5,
  },
  {
    id: '7',
    key: 'PLAT-25642',
    title: 'AWS EC2 Service latest AMI update',
    description: 'Update to latest AMI versions for EC2 instances',
    type: 'task',
    status: 'done',
    priority: 'medium',
    assignee: { name: 'Mike Taylor', initials: 'MT' },
    reporter: { name: 'Nancy Lee', initials: 'NL' },
    labels: ['CLOUD', 'AWS'],
    storyPoints: 3,
    sprint: 'Sprint 24',
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-23'),
    comments: 6,
  },
]

// Priority configuration
const PRIORITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: TrendingUp,
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: TrendingUp,
  },
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: TrendingDown,
  },
}

// Issue type configuration
const ISSUE_TYPE_CONFIG = {
  story: { label: 'Story', icon: '📖', color: 'bg-green-500' },
  task: { label: 'Task', icon: '✓', color: 'bg-blue-500' },
  bug: { label: 'Bug', icon: '🐛', color: 'bg-red-500' },
  epic: { label: 'Epic', icon: '⚡', color: 'bg-purple-500' },
}

export function EnterpriseSprintBoard() {
  const [issues, setIssues] = useState<Issue[]>(SAMPLE_ISSUES)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority[]>([])
  const [filterAssignee, setFilterAssignee] = useState<string[]>([])
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority'>('status')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  // Filter and organize issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        !searchQuery ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority =
        filterPriority.length === 0 || filterPriority.includes(issue.priority)
      
      const matchesAssignee =
        filterAssignee.length === 0 ||
        (issue.assignee && filterAssignee.includes(issue.assignee.name))

      return matchesSearch && matchesPriority && matchesAssignee
    })
  }, [issues, searchQuery, filterPriority, filterAssignee])

  // Group issues by status
  const columns: Column[] = useMemo(() => {
    const todoIssues = filteredIssues.filter((i) => i.status === 'todo')
    const inProgressIssues = filteredIssues.filter((i) => i.status === 'in-progress')
    const doneIssues = filteredIssues.filter((i) => i.status === 'done')
    const blockedIssues = filteredIssues.filter((i) => i.status === 'blocked')

    return [
      { id: 'todo', title: 'TO DO', issues: todoIssues, limit: 10 },
      { id: 'in-progress', title: 'IN PROGRESS', issues: inProgressIssues, limit: 5 },
      { id: 'done', title: 'DONE', issues: doneIssues },
      { id: 'blocked', title: 'BLOCKED', issues: blockedIssues },
    ].filter((col) => col.id !== 'blocked' || col.issues.length > 0) as Column[]
  }, [filteredIssues])

  const totalStoryPoints = useMemo(() => {
    return filteredIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  }, [filteredIssues])

  const completedStoryPoints = useMemo(() => {
    return filteredIssues
      .filter((i) => i.status === 'done')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0)
  }, [filteredIssues])

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>()
    issues.forEach((issue) => {
      if (issue.assignee) assignees.add(issue.assignee.name)
    })
    return Array.from(assignees)
  }, [issues])

  return (
    <div className="space-y-4">
      {/* Top Control Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white border-b border-gray-200 pb-4">
        {/* Left: Title and Sprint Info */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">All Sprints</h2>
              <Badge variant="secondary" className="text-xs">
                Sprint 24
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {filteredIssues.length} issues · {completedStoryPoints}/{totalStoryPoints} points complete
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full lg:w-64 h-9 text-sm"
            />
          </div>

          {/* Group By */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-sm">
                Group by: {groupBy === 'status' ? 'Status' : groupBy === 'assignee' ? 'Assignee' : 'Priority'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
                Group By
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setGroupBy('status')}>
                Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('assignee')}>
                Assignee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('priority')}>
                Priority
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(filterPriority.length > 0 || filterAssignee.length > 0) && (
                  <Badge variant="default" className="ml-2 h-5 min-w-5 px-1 text-xs">
                    {filterPriority.length + filterAssignee.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
                Priority
              </DropdownMenuLabel>
              {(['critical', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filterPriority.includes(priority)}
                  onCheckedChange={(checked) => {
                    setFilterPriority(
                      checked
                        ? [...filterPriority, priority]
                        : filterPriority.filter((p) => p !== priority)
                    )
                  }}
                >
                  {PRIORITY_CONFIG[priority].label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
                Assignee
              </DropdownMenuLabel>
              {uniqueAssignees.slice(0, 5).map((assignee) => (
                <DropdownMenuCheckboxItem
                  key={assignee}
                  checked={filterAssignee.includes(assignee)}
                  onCheckedChange={(checked) => {
                    setFilterAssignee(
                      checked
                        ? [...filterAssignee, assignee]
                        : filterAssignee.filter((a) => a !== assignee)
                    )
                  }}
                >
                  {assignee}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase">
                View Settings
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Compact view
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                Starred only
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Board settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Complete Sprint */}
          <Button size="sm" className="hidden lg:flex">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Complete Sprint
          </Button>
        </div>
      </div>

      {/* Sprint Progress Bar */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Sprint Progress</span>
              <span className="text-gray-600">
                {completedStoryPoints} / {totalStoryPoints} points (
                {totalStoryPoints > 0
                  ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
                  : 0}
                %)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{
                  width: `${
                    totalStoryPoints > 0
                      ? (completedStoryPoints / totalStoryPoints) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{columns.find((c) => c.id === 'done')?.issues.length || 0} completed</span>
              <span>{columns.find((c) => c.id === 'in-progress')?.issues.length || 0} in progress</span>
              <span>{columns.find((c) => c.id === 'todo')?.issues.length || 0} to do</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <ColumnCard key={column.id} column={column} />
        ))}
      </div>
    </div>
  )
}

// Column Component
function ColumnCard({ column }: { column: Column }) {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="border border-gray-200 bg-gray-50">
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {column.title}
              </CardTitle>
              <Badge variant="secondary" className="h-5 min-w-5 px-2 text-xs font-semibold">
                {column.issues.length}
              </Badge>
              {column.limit && column.issues.length >= column.limit && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Column limit: {column.limit}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3 max-h-[calc(100vh-400px)] overflow-y-auto">
          {column.issues.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No issues in this column
            </div>
          ) : (
            column.issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Issue Card Component
function IssueCard({ issue }: { issue: Issue }) {
  const typeConfig = ISSUE_TYPE_CONFIG[issue.type]
  const priorityConfig = PRIORITY_CONFIG[issue.priority]
  const PriorityIcon = priorityConfig.icon

  const isOverdue = issue.dueDate && issue.dueDate < new Date() && issue.status !== 'done'
  const isDueSoon =
    issue.dueDate &&
    issue.dueDate > new Date() &&
    issue.dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <Card className="border border-gray-200 bg-white hover:shadow-md transition-all duration-200 cursor-pointer group">
      <CardContent className="p-3 space-y-2.5">
        {/* Header: Type Icon + Key + Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded text-xs text-white font-semibold flex-shrink-0',
                      typeConfig.color
                    )}
                  >
                    {typeConfig.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{typeConfig.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs font-mono text-gray-600">{issue.key}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Priority Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      priorityConfig.color
                    )}
                  >
                    <PriorityIcon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{priorityConfig.label} priority</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Open in new tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Assign to me
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Change priority
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
          {issue.title}
        </h4>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.slice(0, 2).map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wide"
              >
                {label}
              </Badge>
            ))}
            {issue.labels.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                +{issue.labels.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Epic Name */}
        {issue.epicName && (
          <div className="flex items-center gap-1.5 text-xs text-purple-700">
            <Zap className="h-3 w-3" />
            <span className="font-medium truncate">{issue.epicName}</span>
          </div>
        )}

        {/* Footer: Story Points + Subtasks + Assignee + Due Date */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Story Points */}
            {issue.storyPoints && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-xs font-semibold text-gray-700">
                      {issue.storyPoints}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Story points</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Subtasks */}
            {issue.subtasks && issue.subtasks.total > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle2
                        className={cn(
                          'h-3.5 w-3.5',
                          issue.subtasks.completed === issue.subtasks.total
                            ? 'text-green-600'
                            : 'text-gray-400'
                        )}
                      />
                      <span className="text-gray-600 font-medium">
                        {issue.subtasks.completed}/{issue.subtasks.total}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {issue.subtasks.completed} of {issue.subtasks.total} subtasks complete
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Comments */}
            {issue.comments && issue.comments > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <span className="font-medium">{issue.comments}</span>
              </div>
            )}

            {/* Due Date */}
            {issue.dueDate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        isOverdue
                          ? 'text-red-600'
                          : isDueSoon
                          ? 'text-amber-600'
                          : 'text-gray-600'
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {issue.dueDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : 'Due date'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Assignee Avatar */}
          {issue.assignee && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-white ring-1 ring-gray-200">
                    {issue.assignee.avatar ? (
                      <AvatarImage src={issue.assignee.avatar} alt={issue.assignee.name} />
                    ) : null}
                    <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {issue.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">{issue.assignee.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Priority Badge (visible on mobile) */}
        {issue.priority === 'critical' && (
          <div className="lg:hidden">
            <Badge
              variant="destructive"
              className="text-[10px] px-2 py-0.5 font-semibold uppercase"
            >
              Critical
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
