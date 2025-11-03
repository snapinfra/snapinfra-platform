"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface GenerationProgressProps {
  progress: number
  message: string
}

export function GenerationProgress({ progress, message }: GenerationProgressProps) {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with animated icon */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Generating Backend + Infrastructure Code
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {message || "Processing your request..."}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Footer hint */}
          <p className="text-xs text-gray-500 text-center">
            This may take 1-2 minutes. Please don't close this page.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
