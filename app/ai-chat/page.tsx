"use client"

import { useState } from "react"
import { EnterpriseDashboardLayout } from "@/components/enterprise-dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Send, Code, Database, Zap, Lightbulb } from "lucide-react"

const sampleConversation = [
  {
    id: 1,
    type: 'ai',
    content: "Hello! I'm your AI backend assistant. I can help you with database design, API endpoints, security, and deployment questions. What would you like to work on?",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    type: 'user',
    content: "I need help designing a user authentication system for my SaaS application",
    timestamp: "2 hours ago"
  },
  {
    id: 3,
    type: 'ai',
    content: "Great! For a SaaS authentication system, I recommend implementing JWT-based authentication with these key components:\n\n1. **User Registration & Login**: Email/password with email verification\n2. **JWT Tokens**: Access tokens (15min) + Refresh tokens (7 days)\n3. **Role-Based Access Control (RBAC)**: Different permission levels\n4. **Multi-Factor Authentication**: For enhanced security\n5. **Session Management**: Track active sessions\n\nWould you like me to generate the database schema and API endpoints for this?",
    timestamp: "2 hours ago"
  }
]

export default function AiChatPage() {
  const [messages] = useState(sampleConversation)
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    // Handle sending message
    setNewMessage("")
  }

  return (
    <EnterpriseDashboardLayout
      title="AI Assistant"
      description="Get help with backend development, architecture, and best practices"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "AI Assistant" },
      ]}
      actions={
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Online
        </Badge>
      }
    >
      <div className="space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Database className="w-4 h-4" />
                  Design Schema
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Code className="w-4 h-4" />
                  Generate Code
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Zap className="w-4 h-4" />
                  Optimize Performance
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Architecture Tips
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Backend Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about database design, API development, security, and more
                </CardDescription>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.type === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.type === 'ai' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              message.type === 'ai'
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ask me about backend development..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </EnterpriseDashboardLayout>
  )
}