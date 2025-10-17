"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/app-context"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Code2, 
  Download, 
  Play, 
  Settings,
  FileCode,
  Package,
  Terminal,
  Rocket,
  CheckCircle,
  Clock,
  Eye,
  Copy,
  Zap,
  Database,
  Shield,
  Globe
} from "lucide-react"

const frameworks = [
  { id: 'express', name: 'Express.js', language: 'javascript', description: 'Fast, unopinionated web framework' },
  { id: 'fastify', name: 'Fastify', language: 'javascript', description: 'Fast and low overhead web framework' },
  { id: 'nestjs', name: 'NestJS', language: 'typescript', description: 'Progressive Node.js framework' },
  { id: 'django', name: 'Django', language: 'python', description: 'High-level Python web framework' },
  { id: 'fastapi', name: 'FastAPI', language: 'python', description: 'Modern, fast web framework for Python' },
  { id: 'spring', name: 'Spring Boot', language: 'java', description: 'Java-based enterprise framework' },
  { id: 'gin', name: 'Gin', language: 'go', description: 'Go HTTP web framework' },
  { id: 'fiber', name: 'Fiber', language: 'go', description: 'Express-inspired Go web framework' }
]

const codeTemplates = [
  {
    id: 'user-auth',
    name: 'User Authentication',
    description: 'Complete user auth with JWT tokens',
    framework: 'express',
    code: `// User Authentication Service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
  async register(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await User.create({
      ...userData,
      password: hashedPassword
    });
    
    const token = this.generateToken(user.id);
    return { user: this.sanitizeUser(user), token };
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken(user.id);
    return { user: this.sanitizeUser(user), token };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user.toObject();
    return sanitized;
  }
}

module.exports = new AuthService();`
  },
  {
    id: 'crud-api',
    name: 'CRUD API Endpoints',
    description: 'RESTful API with full CRUD operations',
    framework: 'express',
    code: `// CRUD Controller
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

class CRUDController {
  constructor(model) {
    this.model = model;
  }

  // GET /api/resources
  getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
    
    const resources = await this.model
      .find()
      .sort({ [sort]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await this.model.countDocuments();
    
    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  });

  // GET /api/resources/:id
  getById = asyncHandler(async (req, res) => {
    const resource = await this.model.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(resource);
  });

  // POST /api/resources
  create = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const resource = await this.model.create(req.body);
    res.status(201).json(resource);
  });

  // PUT /api/resources/:id
  update = asyncHandler(async (req, res) => {
    const resource = await this.model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(resource);
  });

  // DELETE /api/resources/:id
  delete = asyncHandler(async (req, res) => {
    const resource = await this.model.findByIdAndDelete(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json({ message: 'Resource deleted successfully' });
  });
}

module.exports = CRUDController;`
  }
]

export default function CodeGenerationPage() {
  const { state } = useAppContext()
  const [selectedFramework, setSelectedFramework] = useState('express')
  const [selectedLanguage, setSelectedLanguage] = useState('typescript')
  const [selectedTemplate, setSelectedTemplate] = useState(codeTemplates[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [includeAuth, setIncludeAuth] = useState(true)
  const [includeTests, setIncludeTests] = useState(true)
  const [includeDocker, setIncludeDocker] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Simulate code generation progress
    const steps = ['Analyzing schema', 'Generating models', 'Creating controllers', 'Writing tests', 'Finalizing']
    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        setGenerationProgress(((i + 1) / steps.length) * 100)
        if (i === steps.length - 1) {
          setIsGenerating(false)
          // Simulate generated files
          setGeneratedFiles([
            { name: 'app.js', type: 'javascript', size: '2.3kb' },
            { name: 'models/User.js', type: 'javascript', size: '1.8kb' },
            { name: 'controllers/userController.js', type: 'javascript', size: '3.2kb' },
            { name: 'routes/users.js', type: 'javascript', size: '1.1kb' },
            { name: 'middleware/auth.js', type: 'javascript', size: '0.9kb' },
            { name: 'package.json', type: 'json', size: '0.8kb' },
            { name: 'README.md', type: 'markdown', size: '2.1kb' }
          ])
        }
      }, (i + 1) * 1000)
    }
  }

  const selectedFrameworkData = frameworks.find(f => f.id === selectedFramework)

  return (
    <EnterpriseDashboardLayout
      title="Code Generation"
      description="Generate production-ready backend code from your schema"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Code Generation" },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Generate Code
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">

        {/* Generation Progress */}
        {isGenerating && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Generating your backend...</span>
                  <span className="text-sm text-gray-500">{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-gray-500">
                  This may take a few minutes depending on your schema complexity
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Framework & Language</CardTitle>
                <CardDescription>Choose your preferred technology stack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="framework">Framework</Label>
                  <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.map((framework) => (
                        <SelectItem key={framework.id} value={framework.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {framework.language}
                            </Badge>
                            {framework.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFrameworkData && (
                    <p className="text-sm text-gray-500 mt-1">{selectedFrameworkData.description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="language">Language Variant</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generation Options</CardTitle>
                <CardDescription>Customize what to include in your generated code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auth" 
                    checked={includeAuth} 
                    onCheckedChange={setIncludeAuth}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="auth" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Authentication & Authorization
                    </Label>
                    <p className="text-xs text-gray-500">JWT-based auth with middleware</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tests" 
                    checked={includeTests} 
                    onCheckedChange={setIncludeTests}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="tests" className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Unit & Integration Tests
                    </Label>
                    <p className="text-xs text-gray-500">Jest test suites for all endpoints</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="docker" 
                    checked={includeDocker} 
                    onCheckedChange={setIncludeDocker}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="docker" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Docker Configuration
                    </Label>
                    <p className="text-xs text-gray-500">Dockerfile and docker-compose.yml</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Instructions</CardTitle>
                <CardDescription>Additional requirements or modifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., Use Redis for caching, implement rate limiting, add email notifications..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview & Results */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="templates" className="space-y-6">
              <TabsList>
                <TabsTrigger value="templates" className="gap-2">
                  <FileCode className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Code Preview
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <Download className="w-4 h-4" />
                  Generated Files
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Templates</CardTitle>
                    <CardDescription>Choose from pre-built code templates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {codeTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedTemplate.id === template.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.framework}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Code Preview</CardTitle>
                        <CardDescription>{selectedTemplate.name} - {selectedTemplate.framework}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
                        <code>{selectedTemplate.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                {generatedFiles.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Generated Files</CardTitle>
                          <CardDescription>Your backend code is ready to download</CardDescription>
                        </div>
                        <Button className="gap-2">
                          <Download className="w-4 h-4" />
                          Download All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {generatedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileCode className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <Alert className="mt-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Code generation complete! Your backend includes authentication, CRUD operations, 
                          and is ready for deployment.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Generated Files</h3>
                      <p className="text-gray-500 mb-6">
                        Configure your settings and click "Generate Code" to create your backend files
                      </p>
                      <Button onClick={handleGenerate} className="gap-2">
                        <Rocket className="w-4 h-4" />
                        Generate Code
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Quick Stats */}
        {state.currentProject && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database Tables</p>
                    <p className="text-2xl font-bold text-blue-600">{state.currentProject.schema.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                    <p className="text-2xl font-bold text-green-600">{state.currentProject.schema.length * 5}</p>
                  </div>
                  <Globe className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Est. Lines of Code</p>
                    <p className="text-2xl font-bold text-purple-600">{state.currentProject.schema.length * 150}</p>
                  </div>
                  <Code2 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </EnterpriseDashboardLayout>
  )
}