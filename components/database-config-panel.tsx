"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  Server,
  Shield,
  Key,
  Globe,
  Clock,
  Gauge,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Lock,
  Cloud
} from "lucide-react"
import { DatabaseConfig, DatabaseType } from "@/lib/appContext/app-context"

interface DatabaseConfigPanelProps {
  databaseConfig: DatabaseConfig
  onDatabaseChange?: (dbConfig: DatabaseConfig) => void
}

const DATABASE_INFO: Record<DatabaseType, {
  name: string
  icon: React.ReactNode
  color: string
  description: string
  defaultPort: number
  useCases: string[]
  features: string[]
}> = {
  postgresql: {
    name: "PostgreSQL",
    icon: <Database className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Powerful, open-source relational database",
    defaultPort: 5432,
    useCases: ["Complex queries", "ACID compliance", "Scalable applications"],
    features: ["JSONB Support", "Full-text Search", "Extensions", "Advanced Indexing"]
  },
  mysql: {
    name: "MySQL",
    icon: <Database className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "Popular relational database management system",
    defaultPort: 3306,
    useCases: ["Web applications", "E-commerce", "Content management"],
    features: ["InnoDB Engine", "Replication", "Partitioning", "High Performance"]
  },
  sqlite: {
    name: "SQLite",
    icon: <Database className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "Lightweight, serverless database",
    defaultPort: 0,
    useCases: ["Embedded systems", "Mobile apps", "Development"],
    features: ["Zero Configuration", "Serverless", "Portable", "ACID Compliant"]
  },
  mongodb: {
    name: "MongoDB",
    icon: <Leaf className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "NoSQL document database",
    defaultPort: 27017,
    useCases: ["Flexible schemas", "JSON documents", "Content management"],
    features: ["Document Store", "Horizontal Scaling", "Aggregation", "GridFS"]
  },
  redis: {
    name: "Redis",
    icon: <Rocket className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "In-memory data structure store",
    defaultPort: 6379,
    useCases: ["Caching", "Real-time apps", "Session storage"],
    features: ["In-Memory", "Pub/Sub", "Lua Scripts", "Clustering"]
  },
  pinecone: {
    name: "Pinecone",
    icon: <Brain className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "Vector database for AI applications",
    defaultPort: 443,
    useCases: ["AI/ML", "Vector search", "Recommendations"],
    features: ["Vector Search", "Real-time Updates", "Metadata Filtering", "Auto-scaling"]
  },
  influxdb: {
    name: "InfluxDB",
    icon: <BarChart className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "Time series database",
    defaultPort: 8086,
    useCases: ["Metrics", "Time-series data", "Analytics"],
    features: ["Time Series", "High Compression", "InfluxQL", "Continuous Queries"]
  },
  elasticsearch: {
    name: "Elasticsearch",
    icon: <Search className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    description: "Search and analytics engine",
    defaultPort: 9200,
    useCases: ["Full-text search", "Log analytics", "Real-time search"],
    features: ["Full-text Search", "Analytics", "RESTful API", "Distributed"]
  }
}

export function DatabaseConfigPanel({ databaseConfig, onDatabaseChange }: DatabaseConfigPanelProps) {
  const [config, setConfig] = useState<DatabaseConfig>(databaseConfig)
  const [showPassword, setShowPassword] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development')

  const currentDb = DATABASE_INFO[config.type]

  const handleConfigChange = (updates: Partial<DatabaseConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    if (onDatabaseChange) {
      onDatabaseChange(newConfig)
    }
  }

  const handleDatabaseTypeChange = (newType: DatabaseType) => {
    const newConfig: DatabaseConfig = {
      ...config,
      type: newType,
      port: DATABASE_INFO[newType].defaultPort || config.port,
      host: newType === 'sqlite' ? undefined : (config.host || 'localhost'),
      database: newType === 'sqlite' ? 'database.db' : config.database
    }
    setConfig(newConfig)
    if (onDatabaseChange) {
      onDatabaseChange(newConfig)
    }
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000))
    setConnectionStatus(Math.random() > 0.3 ? 'success' : 'error')
    setIsTestingConnection(false)
  }

  const generateConnectionString = () => {
    const { type, host, port, database, credentials } = config
    
    switch (type) {
      case 'postgresql':
        return `postgresql://${credentials?.username || 'user'}:${credentials?.password || 'password'}@${host || 'localhost'}:${port || 5432}/${database || 'mydb'}`
      case 'mysql':
        return `mysql://${credentials?.username || 'user'}:${credentials?.password || 'password'}@${host || 'localhost'}:${port || 3306}/${database || 'mydb'}`
      case 'mongodb':
        return `mongodb://${credentials?.username || 'user'}:${credentials?.password || 'password'}@${host || 'localhost'}:${port || 27017}/${database || 'mydb'}`
      case 'redis':
        return `redis://${credentials?.password ? `:${credentials.password}@` : ''}${host || 'localhost'}:${port || 6379}`
      case 'sqlite':
        return `sqlite:///${database || 'database.db'}`
      default:
        return `${type}://${host || 'localhost'}:${port || 8080}`
    }
  }

  const copyConnectionString = () => {
    navigator.clipboard.writeText(generateConnectionString())
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 h-0">
        <div className="space-y-6 p-6">
          {/* Database Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4" />
                Database Selection
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  AI Selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Database Display */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentDb.color}`}>
                    {currentDb.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{currentDb.name}</div>
                    <div className="text-xs text-muted-foreground">{currentDb.description}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    {Object.entries(DATABASE_INFO).map(([key, db]) => (
                      <DropdownMenuItem 
                        key={key}
                        onClick={() => handleDatabaseTypeChange(key as DatabaseType)}
                        className={key === config.type ? 'bg-blue-50' : ''}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${db.color}`}>
                            {db.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{db.name}</div>
                            <div className="text-xs text-muted-foreground">{db.description}</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* AI Reasoning */}
              {config.reasoning && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-1">Why this database?</h4>
                  <p className="text-xs text-muted-foreground">{config.reasoning}</p>
                </div>
              )}

              {/* Features */}
              <div>
                <Label className="text-sm font-medium">Key Features</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentDb.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="connection" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="environment">Environment</TabsTrigger>
                </TabsList>

                {/* Connection Tab */}
                <TabsContent value="connection" className="space-y-4">
                  {config.type !== 'sqlite' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="host" className="text-sm flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Host
                          </Label>
                          <Input
                            id="host"
                            value={config.host || ''}
                            onChange={(e) => handleConfigChange({ host: e.target.value })}
                            placeholder="localhost"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="port" className="text-sm">Port</Label>
                          <Input
                            id="port"
                            type="number"
                            value={config.port || ''}
                            onChange={(e) => handleConfigChange({ port: parseInt(e.target.value) || undefined })}
                            placeholder={currentDb.defaultPort.toString()}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="database" className="text-sm">
                      {config.type === 'sqlite' ? 'File Path' : 'Database Name'}
                    </Label>
                    <Input
                      id="database"
                      value={config.database || ''}
                      onChange={(e) => handleConfigChange({ database: e.target.value })}
                      placeholder={config.type === 'sqlite' ? 'database.db' : 'my_database'}
                    />
                  </div>

                  {/* Connection String */}
                  <div className="space-y-2">
                    <Label className="text-sm">Connection String</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={generateConnectionString()}
                        className="font-mono text-xs bg-gray-50"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyConnectionString}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {connectionStatus === 'success' && (
                        <div className="flex items-center gap-1 text-blue-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Connection successful</span>
                        </div>
                      )}
                      {connectionStatus === 'error' && (
                        <div className="flex items-center gap-1 text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Connection failed</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={testConnection}
                      disabled={isTestingConnection}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isTestingConnection ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <TestTube className="w-3 h-3" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </TabsContent>

                {/* Credentials Tab */}
                <TabsContent value="credentials" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm">Username</Label>
                    <Input
                      id="username"
                      value={config.credentials?.username || ''}
                      onChange={(e) => handleConfigChange({
                        credentials: { ...config.credentials, username: e.target.value, password: config.credentials?.password || '' }
                      })}
                      placeholder="Database username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={config.credentials?.password || ''}
                        onChange={(e) => handleConfigChange({
                          credentials: { username: config.credentials?.username || '', password: e.target.value }
                        })}
                        placeholder="Database password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Security Note</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider using environment variables for production credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Connection Timeout (ms)
                      </Label>
                      <Input type="number" placeholder="30000" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        Max Connections
                      </Label>
                      <Input type="number" placeholder="100" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        SSL/TLS Enabled
                      </Label>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Connection Pooling</Label>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-reconnect</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Additional Connection Parameters</Label>
                    <Textarea
                      placeholder="charset=utf8mb4&#10;timezone=UTC"
                      className="min-h-[80px] text-xs font-mono"
                    />
                  </div>
                </TabsContent>

                {/* Environment Tab */}
                <TabsContent value="environment" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      Environment
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {environment.charAt(0).toUpperCase() + environment.slice(1)}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem onClick={() => setEnvironment('development')}>
                          Development
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEnvironment('staging')}>
                          Staging
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEnvironment('production')}>
                          Production
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2">Environment Variables</h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div>DATABASE_URL="{generateConnectionString()}"</div>
                      <div>DB_HOST="{config.host || 'localhost'}"</div>
                      <div>DB_PORT={config.port || currentDb.defaultPort}</div>
                      <div>DB_NAME="{config.database || 'mydb'}"</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Settings className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Environment Configuration</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Different environments can have different database configurations. 
                          Use environment variables to manage settings across deployments.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}