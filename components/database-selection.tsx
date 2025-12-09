"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Database, 
  ChevronDown, 
  Settings, 
  Zap,
  Leaf,
  Rocket,
  Search,
  BarChart,
  Brain,
  Server
} from "lucide-react"
import { DatabaseConfig, DatabaseType } from "@/lib/appContext/app-context"

interface DatabaseSelectionProps {
  databaseConfig: DatabaseConfig
  onDatabaseChange?: (dbType: DatabaseType) => void
}

const DATABASE_INFO: Record<DatabaseType, {
  name: string
  icon: React.ReactNode
  color: string
  description: string
  useCases: string[]
}> = {
  postgresql: {
    name: "PostgreSQL",
    icon: <Database className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-100 border-blue-200",
    description: "Powerful, open-source relational database",
    useCases: ["Complex queries", "ACID compliance", "Scalable applications"]
  },
  mysql: {
    name: "MySQL",
    icon: <Database className="w-5 h-5" />,
    color: "text-orange-600 bg-orange-100 border-orange-200", 
    description: "Popular relational database management system",
    useCases: ["Web applications", "E-commerce", "Content management"]
  },
  sqlite: {
    name: "SQLite",
    icon: <Database className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-100 border-gray-200",
    description: "Lightweight, serverless database",
    useCases: ["Embedded systems", "Mobile apps", "Development"]
  },
  mongodb: {
    name: "MongoDB", 
    icon: <Leaf className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-100 border-blue-200",
    description: "NoSQL document database",
    useCases: ["Flexible schemas", "JSON documents", "Content management"]
  },
  redis: {
    name: "Redis",
    icon: <Rocket className="w-5 h-5" />,
    color: "text-red-600 bg-red-100 border-red-200", 
    description: "In-memory data structure store",
    useCases: ["Caching", "Real-time apps", "Session storage"]
  },
  pinecone: {
    name: "Pinecone",
    icon: <Brain className="w-5 h-5" />,
    color: "text-purple-600 bg-purple-100 border-purple-200",
    description: "Vector database for AI applications", 
    useCases: ["AI/ML", "Vector search", "Recommendations"]
  },
  influxdb: {
    name: "InfluxDB",
    icon: <BarChart className="w-5 h-5" />,
    color: "text-cyan-600 bg-cyan-100 border-cyan-200",
    description: "Time series database",
    useCases: ["Metrics", "Time-series data", "Analytics"]
  },
  elasticsearch: {
    name: "Elasticsearch", 
    icon: <Search className="w-5 h-5" />,
    color: "text-yellow-600 bg-yellow-100 border-yellow-200",
    description: "Search and analytics engine",
    useCases: ["Full-text search", "Log analytics", "Real-time search"]
  }
}

export function DatabaseSelection({ databaseConfig, onDatabaseChange }: DatabaseSelectionProps) {
  const currentDb = DATABASE_INFO[databaseConfig.type]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Database Selection</h3>
              <p className="text-xs text-muted-foreground">AI-recommended database</p>
            </div>
          </div>
          {onDatabaseChange && (
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Database */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentDb.color}`}>
              {currentDb.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{currentDb.name}</span>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  <Zap className="w-3 h-3 mr-1" />
                  AI Selected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{currentDb.description}</p>
            </div>
          </div>

          {onDatabaseChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {Object.entries(DATABASE_INFO).map(([key, db]) => (
                  <DropdownMenuItem 
                    key={key}
                    onClick={() => onDatabaseChange(key as DatabaseType)}
                    className={key === databaseConfig.type ? 'bg-blue-50' : ''}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${db.color}`}>
                        {db.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{db.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{db.description}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* AI Reasoning */}
        {databaseConfig.reasoning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Why this database?</h4>
            <p className="text-xs text-blue-700">{databaseConfig.reasoning}</p>
          </div>
        )}

        {/* Features */}
        {databaseConfig.features && databaseConfig.features.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Features</h4>
            <div className="flex flex-wrap gap-1">
              {databaseConfig.features.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases */}
        <div>
          <h4 className="text-sm font-medium mb-2">Perfect for</h4>
          <div className="flex flex-wrap gap-1">
            {currentDb.useCases.map((useCase, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {useCase}
              </Badge>
            ))}
          </div>
        </div>

        {/* Connection Info */}
        {databaseConfig.port && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex justify-between">
              <span>Default Port:</span>
              <span className="font-mono">{databaseConfig.port}</span>
            </div>
            {databaseConfig.database && (
              <div className="flex justify-between mt-1">
                <span>Database:</span>
                <span className="font-mono">{databaseConfig.database}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}