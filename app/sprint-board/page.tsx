"use client"

import { EnterpriseDashboardLayout } from '@/components/enterprise-dashboard-layout'
import { EnterpriseSprintBoard } from '@/components/enterprise-sprint-board'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Share2, Settings } from 'lucide-react'

export default function SprintBoardPage() {
  return (
    <EnterpriseDashboardLayout
      title="Sprint Board"
      description="Manage your sprints and track progress with enterprise-grade tools"
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'Platform Development', href: '/projects/platform' },
        { label: 'Sprint Board' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Sprint Calendar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <EnterpriseSprintBoard />
    </EnterpriseDashboardLayout>
  )
}
