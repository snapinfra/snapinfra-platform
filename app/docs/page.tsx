"use client"

import { useState } from "react"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Clock, 
  User,
  Code2,
  Database,
  Rocket,
  Shield,
  Zap,
  Settings,
  Play,
  FileText,
  Video,
  HelpCircle
} from "lucide-react"

const docCategories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: <Play className="w-5 h-5" />,
    description: 'Quick start guides and tutorials',
    docs: [
      { id: '1', title: 'Quick Start Guide', description: 'Get up and running in 5 minutes', type: 'guide', readTime: '5 min' },
      { id: '2', title: 'Your First Project', description: 'Create your first backend project', type: 'tutorial', readTime: '15 min' },
      { id: '3', title: 'Platform Overview', description: 'Understanding the platform features', type: 'overview', readTime: '8 min' }
    ]
  },
  {
    id: 'schema-design',
    name: 'Schema Design',
    icon: <Database className="w-5 h-5" />,
    description: 'Database design and modeling',
    docs: [
      { id: '4', title: 'Schema Editor Guide', description: 'Using the visual schema editor', type: 'guide', readTime: '12 min' },
      { id: '5', title: 'Database Relationships', description: 'Defining table relationships', type: 'tutorial', readTime: '10 min' },
      { id: '6', title: 'Best Practices', description: 'Schema design best practices', type: 'guide', readTime: '20 min' }
    ]
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    icon: <Code2 className="w-5 h-5" />,
    description: 'Generating backend code',
    docs: [
      { id: '7', title: 'Framework Selection', description: 'Choosing the right framework', type: 'guide', readTime: '8 min' },
      { id: '8', title: 'Customizing Generated Code', description: 'Modify and extend generated code', type: 'tutorial', readTime: '25 min' },
      { id: '9', title: 'Code Templates', description: 'Understanding code templates', type: 'reference', readTime: '15 min' }
    ]
  },
  {
    id: 'deployment',
    name: 'Deployment',
    icon: <Rocket className="w-5 h-5" />,
    description: 'Deploy to cloud providers',
    docs: [
      { id: '10', title: 'AWS Deployment', description: 'Deploy to Amazon Web Services', type: 'tutorial', readTime: '30 min' },
      { id: '11', title: 'Google Cloud Platform', description: 'Deploy to GCP', type: 'tutorial', readTime: '25 min' },
      { id: '12', title: 'Environment Variables', description: 'Managing environment configurations', type: 'guide', readTime: '10 min' }
    ]
  },
  {
    id: 'security',
    name: 'Security',
    icon: <Shield className="w-5 h-5" />,
    description: 'Authentication and security',
    docs: [
      { id: '13', title: 'Authentication Setup', description: 'Implementing user authentication', type: 'tutorial', readTime: '20 min' },
      { id: '14', title: 'Role-Based Access Control', description: 'Setting up RBAC', type: 'guide', readTime: '18 min' },
      { id: '15', title: 'API Security', description: 'Securing your API endpoints', type: 'guide', readTime: '22 min' }
    ]
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    icon: <FileText className="w-5 h-5" />,
    description: 'Complete API documentation',
    docs: [
      { id: '16', title: 'REST API Reference', description: 'Complete REST API documentation', type: 'reference', readTime: '45 min' },
      { id: '17', title: 'SDK Documentation', description: 'Client SDK usage guide', type: 'reference', readTime: '30 min' },
      { id: '18', title: 'Webhooks', description: 'Setting up webhook notifications', type: 'guide', readTime: '15 min' }
    ]
  }
]

const popularDocs = [
  { id: '1', title: 'Quick Start Guide', category: 'Getting Started', views: 1250 },
  { id: '4', title: 'Schema Editor Guide', category: 'Schema Design', views: 890 },
  { id: '10', title: 'AWS Deployment', category: 'Deployment', views: 756 },
  { id: '13', title: 'Authentication Setup', category: 'Security', views: 634 },
  { id: '16', title: 'REST API Reference', category: 'API Reference', views: 543 }
]

const recentUpdates = [
  { id: '1', title: 'Quick Start Guide', category: 'Getting Started', date: '2024-01-15', type: 'updated' },
  { id: '19', title: 'Docker Deployment', category: 'Deployment', date: '2024-01-14', type: 'new' },
  { id: '14', title: 'Role-Based Access Control', category: 'Security', date: '2024-01-12', type: 'updated' },
  { id: '20', title: 'GraphQL API Guide', category: 'API Reference', date: '2024-01-10', type: 'new' }
]

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="w-4 h-4" />
      case 'tutorial': return <Play className="w-4 h-4" />
      case 'reference': return <FileText className="w-4 h-4" />
      case 'overview': return <HelpCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tutorial': return 'bg-green-100 text-green-800 border-green-200'
      case 'reference': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'overview': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredCategories = docCategories.filter(category => 
    selectedCategory === 'all' || category.id === selectedCategory
  ).map(category => ({
    ...category,
    docs: category.docs.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.docs.length > 0)

  return (
    <EnterpriseDashboardLayout
      title="Documentation"
      description="Comprehensive guides and API references"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Documentation" },
      ]}
    >
      <div className="space-y-8">

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg border-2"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <Zap className="w-4 h-4" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recent Updates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {docCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Documentation Grid */}
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {category.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.docs.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(doc.type)}
                              <Badge className={`text-xs ${getTypeBadgeColor(doc.type)}`}>
                                {doc.type}
                              </Badge>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                            {doc.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {doc.description}
                          </CardDescription>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {doc.readTime}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Documentation</CardTitle>
                <CardDescription>The most viewed documentation pages this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularDocs.map((doc, index) => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-600">{doc.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {doc.views.toLocaleString()} views
                        </Badge>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>Latest documentation updates and new content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUpdates.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                            {doc.title}
                          </h3>
                          <Badge 
                            className={`text-xs ${
                              doc.type === 'new' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {doc.type === 'new' ? 'New' : 'Updated'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{doc.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{doc.date}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Jump to commonly used resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Code2 className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">API Reference</div>
                  <div className="text-sm text-gray-500">Complete API docs</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Video className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Video Tutorials</div>
                  <div className="text-sm text-gray-500">Step-by-step guides</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">FAQ</div>
                  <div className="text-sm text-gray-500">Common questions</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <User className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">Community</div>
                  <div className="text-sm text-gray-500">Join discussions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnterpriseDashboardLayout>
  )
}