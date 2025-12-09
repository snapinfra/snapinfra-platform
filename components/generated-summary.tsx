"use client"

import { useAppContext } from "@/lib/appContext/app-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layers, Database, Network, Settings, ListChecks } from "lucide-react"

export function GeneratedSummary({ compact = false }: { compact?: boolean }) {
  const { state } = useAppContext()
  const { currentProject } = state

  if (!currentProject) {
    return (
      <div className="w-full bg-white flex flex-col items-center justify-center min-h-[300px] border border-border rounded-lg">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Layers className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900">No Project Selected</h3>
          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
            Select or create a project to view generated outputs and infrastructure code.
          </p>
        </div>
      </div>
    )
  }

  const totalFields = currentProject.schema.reduce((acc, t) => acc + t.fields.length, 0)
  const endpointsApprox = currentProject.endpoints?.length || currentProject.schema.length * 4

  if (compact) {
    // Compact summary for dashboard: only show Architecture card to avoid duplication
    return (
      <div className="w-full space-y-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Network className="w-4 h-4" /> System Architecture
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {currentProject.architecture ? (
                <span>{currentProject.architecture.nodes.length} components, {currentProject.architecture.edges.length} connections</span>
              ) : (
                <span>No architecture graph saved yet.</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-gray-700">
              Architecture guides IaC and deployment topology. Edit it from onboarding or a future editor.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-indigo-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Generated Outputs</h1>
          <p className="text-sm text-gray-600">Code, Infrastructure, and your onboarding results</p>
        </div>
      </div>

      {/* Schema Overview */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Database className="w-4 h-4" /> Schema Overview
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">{currentProject.schema.length} tables, {totalFields} fields</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-2">
            {currentProject.schema.slice(0, 8).map((table) => (
              <div key={table.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm text-gray-900 truncate mr-2">{table.name}</h4>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{table.fields.length} fields</Badge>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{table.description}</p>
              </div>
            ))}
            {currentProject.schema.length > 8 && (
              <div className="text-xs text-gray-500">+{currentProject.schema.length - 8} more tables</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ListChecks className="w-4 h-4" /> API Endpoints
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">Approximately {endpointsApprox} endpoints</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {currentProject.endpoints && currentProject.endpoints.length > 0 ? (
            <ScrollArea className="h-[260px] w-full border rounded-md">
              <div className="p-3 space-y-2">
                {currentProject.endpoints.map((ep, idx) => (
                  <div key={idx} className="border rounded p-2 flex items-center justify-between text-xs">
                    <div className="font-mono">
                      <span className="font-semibold mr-2">{ep.method}</span>
                      <span>{ep.path}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{ep.group}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-xs text-gray-600">Endpoints are inferred from your schema and will be generated with code.</div>
          )}
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Network className="w-4 h-4" /> System Architecture
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {currentProject.architecture ? (
              <span>{currentProject.architecture.nodes.length} components, {currentProject.architecture.edges.length} connections</span>
            ) : (
              <span>No architecture graph saved yet.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-gray-700">
            Architecture guides IaC and deployment topology. Edit it from onboarding or a future editor.
          </p>
        </CardContent>
      </Card>

      {/* Tool Decisions */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Settings className="w-4 h-4" /> Tool Decisions
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {currentProject.decisions ? (
              <span>{currentProject.decisions.decisions.length} decisions captured</span>
            ) : (
              <span>No decisions captured yet.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {currentProject.decisions ? (
            <ScrollArea className="h-[260px] w-full border rounded-md">
              <div className="p-3 space-y-2">
                {currentProject.decisions.decisions.slice(0, 20).map((d) => (
                  <div key={d.id} className="border rounded p-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-medium">{d.title}</div>
                      <Badge variant="outline">{d.category}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{d.description}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-xs text-gray-600">Tool choices from Step 5 will appear here.</div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
