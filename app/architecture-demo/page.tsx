"use client"

import { ReactFlowProvider } from '@xyflow/react'
import { SystemArchitectureEditor } from '@/components/architecture/system-architecture-editor'
import { generateArchitectureFromData } from '@/lib/utils/architecture'
import { SystemArchitecture } from '@/lib/types/architecture'
import { useState, useEffect } from 'react'

// Sample data to test the architecture generation
const sampleData = {
  schemas: [
    {
      name: 'users',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'email', type: 'varchar' },
        { name: 'name', type: 'varchar' },
        { name: 'created_at', type: 'timestamp' }
      ]
    },
    {
      name: 'posts',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'user_id', type: 'uuid', foreign: true },
        { name: 'title', type: 'varchar' },
        { name: 'content', type: 'text' },
        { name: 'created_at', type: 'timestamp' }
      ]
    },
    {
      name: 'comments',
      fields: [
        { name: 'id', type: 'uuid', primary: true },
        { name: 'post_id', type: 'uuid', foreign: true },
        { name: 'user_id', type: 'uuid', foreign: true },
        { name: 'content', type: 'text' },
        { name: 'created_at', type: 'timestamp' }
      ]
    }
  ],
  analysis: {
    databaseRecommendations: [
      {
        name: 'PostgreSQL',
        score: 95,
        reasons: ['Excellent ACID compliance', 'Advanced indexing'],
        bestFor: 'Complex applications with relationships'
      }
    ],
    scalingInsights: {
      expectedLoad: 'High',
      readWriteRatio: '70:30',
      cachingStrategy: 'Redis'
    }
  },
  endpoints: [
    {
      group: 'Authentication',
      endpoints: [
        { path: '/auth/login', method: 'POST', description: 'User login' },
        { path: '/auth/register', method: 'POST', description: 'User registration' },
        { path: '/auth/logout', method: 'POST', description: 'User logout' }
      ]
    },
    {
      group: 'Users',
      endpoints: [
        { path: '/users', method: 'GET', description: 'Get all users' },
        { path: '/users/:id', method: 'GET', description: 'Get user by ID' },
        { path: '/users/:id', method: 'PUT', description: 'Update user' }
      ]
    },
    {
      group: 'Posts',
      endpoints: [
        { path: '/posts', method: 'GET', description: 'Get all posts' },
        { path: '/posts', method: 'POST', description: 'Create new post' },
        { path: '/posts/:id', method: 'GET', description: 'Get post by ID' },
        { path: '/posts/:id/upload', method: 'POST', description: 'Upload post image' }
      ]
    },
    {
      group: 'Comments',
      endpoints: [
        { path: '/posts/:id/comments', method: 'GET', description: 'Get post comments' },
        { path: '/posts/:id/comments', method: 'POST', description: 'Add comment' }
      ]
    },
    {
      group: 'Recommendations',
      endpoints: [
        { path: '/recommendations/posts', method: 'GET', description: 'Get recommended posts' },
        { path: '/recommendations/users', method: 'GET', description: 'Get recommended users' },
        { path: '/ml/predict/engagement', method: 'POST', description: 'Predict user engagement' }
      ]
    },
    {
      group: 'Analytics',
      endpoints: [
        { path: '/analytics/events', method: 'POST', description: 'Track analytics events' },
        { path: '/analytics/dashboard', method: 'GET', description: 'Get analytics dashboard' },
        { path: '/search/posts', method: 'GET', description: 'Full-text search posts' }
      ]
    }
  ]
}

export default function ArchitectureDemoPage() {
  const [architecture, setArchitecture] = useState<SystemArchitecture | null>(null)

  useEffect(() => {
    const schemaData = {
      schemas: sampleData.schemas,
      analysis: sampleData.analysis
    }
    
    const apiData = {
      endpoints: sampleData.endpoints,
      groups: [...new Set(sampleData.endpoints.map(group => group.group))]
    }
    
    const generatedArchitecture = generateArchitectureFromData(
      schemaData,
      apiData,
      'Social Media Demo'
    )
    
    setArchitecture(generatedArchitecture)
  }, [])

  const handleArchitectureChange = (updatedArchitecture: SystemArchitecture) => {
    setArchitecture(updatedArchitecture)
    console.log('Architecture updated:', updatedArchitecture)
  }

  const handleSave = () => {
    console.log('Saving architecture:', architecture)
    alert('Architecture saved! (Check console for details)')
  }

  if (!architecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Generating architecture...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">System Architecture Demo</h1>
          <p className="text-muted-foreground">
            Interactive system architecture editor with sample data
          </p>
        </div>
        
        <div className="h-[800px] border rounded-lg overflow-hidden">
          <ReactFlowProvider>
            <SystemArchitectureEditor
              architecture={architecture}
              onArchitectureChange={handleArchitectureChange}
              onSave={handleSave}
            />
          </ReactFlowProvider>
        </div>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Demo Features</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Drag and drop components to reposition them</li>
            <li>• Click the dropdown menu on any component to edit, duplicate, or delete</li>
            <li>• Use the "Add Node" button to add new architecture components</li>
            <li>• Connect components by dragging from the connection handles</li>
            <li>• Toggle connections visibility and minimap</li>
            <li>• Save your changes with the Save button</li>
          </ul>
        </div>
      </div>
    </div>
  )
}