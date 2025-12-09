"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Sparkles, Database, Code, Lightbulb } from "lucide-react"
import { useAppContext } from "@/lib/appContext/app-context"
import type { ChatMessage, Project, TableSchema, ApiEndpoint } from "@/lib/appContext/app-context"
import { analyzeEntities, generateTableSchema, generateDatabaseConfig } from "@/lib/schema-generator"

// Enhanced AI response with intelligent schema generation
function getContextualResponse(input: string, project: Project | null, messageCount: number) {
  // Analyze entities and relationships from user input
  const analysis = analyzeEntities(input)
  
  // Generate comprehensive database schema
  const generatedTables = analysis.entities.map(entity => 
    generateTableSchema(entity, analysis)
  )
  
  // Generate database configuration
  const databaseConfig = generateDatabaseConfig(analysis)
  
  // Create contextual response message
  const message = generateResponseMessage(analysis, input)
  
  return {
    message,
    metadata: { 
      tablesGenerated: generatedTables.length, 
      endpointsCreated: generatedTables.length * 4, // Rough estimate
      action: 'schema_update' as const 
    },
    schemaUpdate: generatedTables,
    databaseUpdate: databaseConfig
  }
}

function generateResponseMessage(analysis: any, input: string): string {
  const { entities, suggestedDatabase, reasoning, features } = analysis
  
  const dbEmojis = {
    postgresql: 'ðŸ˜',
    mongodb: 'ðŸƒ', 
    redis: 'ðŸš€',
    pinecone: 'ðŸŒ²',
    influxdb: 'ðŸ“Š',
    elasticsearch: 'ðŸ”',
    mysql: 'ðŸ¬',
    sqlite: 'ðŸ“'
  }
  
  const emoji = dbEmojis[suggestedDatabase] || 'ðŸ’¾'
  
  return `Perfect! I've analyzed your requirements and I'm building something amazing! ${emoji}

**Database Choice:** ${suggestedDatabase.toUpperCase()}
**Why?** ${reasoning}

**Generated Tables:** ${entities.join(', ')}
**Key Features:** ${features.join(', ')}

I've created a comprehensive schema with proper relationships, indexes, and field validations. Your backend is going to be rock solid! ðŸ—ï¸`
}

// Enhanced AI schema generation is now handled by schema-generator.ts

export function ChatInterface() {
  const { state, dispatch } = useAppContext()
  const { chatMessages, isAiTyping, currentProject } = state
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Clean up any existing welcome messages from chat conversation on mount
  useEffect(() => {
    // Only run once when component mounts
    if (isInitialized.current) return
    
    // Use a timeout to allow persisted messages to load from storage first
    const timer = setTimeout(() => {
      console.log('Chat initialization, messages count:', chatMessages.length)
      
      // Remove all welcome messages from chat conversation since we have the header message
      const welcomeMessages = chatMessages.filter(msg => 
        msg.id === 'welcome-persistent' || 
        (msg.type === 'ai' && (
          msg.content.includes('RhinoAI here - your coding bestie') ||
          msg.content.includes('Ready to level up')
        ))
      )
      
      if (welcomeMessages.length > 0) {
        console.log('Removing welcome messages from chat conversation...')
        // Keep only non-welcome messages
        const nonWelcomeMessages = chatMessages.filter(msg => 
          msg.id !== 'welcome-persistent' && 
          !(msg.type === 'ai' && (
            msg.content.includes('RhinoAI here - your coding bestie') ||
            msg.content.includes('Ready to level up')
          ))
        )
        dispatch({ type: 'LOAD_PROJECT_CHAT', payload: nonWelcomeMessages })
      }
      
      isInitialized.current = true
    }, 300) // Delay to ensure all data is loaded
    
    return () => clearTimeout(timer)
  }, []) // Empty dependency array - only run once on mount
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [chatMessages, isAiTyping])

  const handleSend = async () => {
    if (!input.trim() || isAiTyping) return

    const userMessage: ChatMessage = {
      id: "user-" + Date.now(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    // Add user message
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage })
    const userInput = input.trim()
    setInput("")
    dispatch({ type: 'SET_AI_TYPING', payload: true })

    try {
      // Call real AI API
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userInput,
          systemMessage: `You are RhinoAI, an expert backend developer assistant. You help users create database schemas and API endpoints through natural language conversation.

Current Project: ${currentProject ? `"${currentProject.name}" - ${currentProject.description}` : 'No active project'}
Existing Tables: ${currentProject?.schema?.map(t => t.name).join(', ') || 'None'}

Respond in a helpful, technical manner. When users describe backend requirements:
1. Suggest appropriate database schemas
2. Recommend suitable database types
3. Explain your reasoning
4. Be specific about field types and relationships

Keep responses conversational but informative.`,
          options: {
            temperature: 0.7,
            maxTokens: 1000,
          }
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Generate contextual schema updates based on AI response and user input
        const contextualResponse = getContextualResponse(userInput, currentProject, chatMessages.length)
        
        const aiMessage: ChatMessage = {
          id: "ai-" + Date.now(),
          type: "ai",
          content: data.content,
          timestamp: new Date(),
          metadata: contextualResponse.metadata,
        }
        
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMessage })
        
        // Update project schema/endpoints if contextual analysis generated them
        if (contextualResponse.schemaUpdate && contextualResponse.schemaUpdate.length > 0) {
          dispatch({ type: 'UPDATE_SCHEMA', payload: contextualResponse.schemaUpdate })
        }
        if (contextualResponse.endpointsUpdate) {
          dispatch({ type: 'UPDATE_ENDPOINTS', payload: contextualResponse.endpointsUpdate })
        }
        if (contextualResponse.databaseUpdate) {
          dispatch({ type: 'UPDATE_DATABASE', payload: contextualResponse.databaseUpdate })
        }
      } else {
        // Handle API error
        const errorMessage: ChatMessage = {
          id: "ai-" + Date.now(),
          type: "ai",
          content: `I apologize, but I'm having trouble connecting right now. Error: ${data.error || 'Unknown error'}. Please try again in a moment.`,
          timestamp: new Date(),
        }
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: errorMessage })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Fallback to mock response if API fails
      const fallbackResponse = getContextualResponse(userInput, currentProject, chatMessages.length)
      
      const errorMessage: ChatMessage = {
        id: "ai-" + Date.now(),
        type: "ai",
        content: `I'm currently running in offline mode. Here's what I can help you with:\n\n${fallbackResponse.message}`,
        timestamp: new Date(),
        metadata: fallbackResponse.metadata,
      }
      
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: errorMessage })
      
      // Still apply schema updates from contextual analysis
      if (fallbackResponse.schemaUpdate) {
        dispatch({ type: 'UPDATE_SCHEMA', payload: fallbackResponse.schemaUpdate })
      }
      if (fallbackResponse.databaseUpdate) {
        dispatch({ type: 'UPDATE_DATABASE', payload: fallbackResponse.databaseUpdate })
      }
    } finally {
      dispatch({ type: 'SET_AI_TYPING', payload: false })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-background min-w-0">
      <div className="flex-shrink-0 border-b border-border p-2 sm:p-3 bg-background">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base truncate">AI Chat Interface</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Powered by RhinoAI</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
              Online
            </Badge>
            {currentProject && (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {currentProject.name}
              </Badge>
            )}
            {chatMessages.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear the chat conversation?')) {
                    dispatch({ type: 'CLEAR_CHAT' })
                  }
                }}
                className="text-xs text-gray-500 hover:text-red-600 underline transition-colors hidden sm:inline"
                title="Clear all chat messages"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 sm:p-2.5">
          <p className="text-xs sm:text-sm text-gray-800 font-medium mb-1">Ready to build something amazing?</p>
          <p className="text-xs text-gray-600 leading-relaxed">Describe your backend requirements and I'll generate the perfect database schema and API endpoints for you.</p>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 w-full bg-background">
        <div className="px-4 sm:px-6 py-4 w-full min-h-full bg-background">
          <div className="space-y-4 w-full max-w-none">
            {chatMessages.length === 0 ? (
              // Empty state when no messages at all (shouldn't happen with persistent welcome)
              <div className="w-full flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                <div className="text-center text-gray-500 px-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium mb-2">Loading...</p>
                  <p className="text-xs text-gray-400">Getting things ready</p>
                </div>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div key={message.id} className={`flex gap-2 sm:gap-3 w-full ${
                  message.type === "ai" ? "" : ""
                }`}>
                  <Avatar className="w-7 h-7 sm:w-9 sm:h-9 mt-1 flex-shrink-0">
                    <AvatarFallback
                      className={message.type === "ai" 
                        ? "bg-gray-100 text-gray-700 border border-gray-200" 
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                      }
                    >
                      {message.type === "ai" ? <Bot className="w-3 h-3 sm:w-4 sm:h-4" /> : <User className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 w-full space-y-2">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="font-semibold text-xs sm:text-sm text-foreground">
                        {message.type === "ai" ? "RhinoAI" : "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`rounded-md border p-2 sm:p-3 ${
                        message.type === "ai" 
                          ? "bg-gray-50 border-gray-200 text-gray-900" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        {message.type === "ai" ? (
                          <div className="text-sm leading-relaxed break-words m-0">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                pre: ({ children }) => <pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-xs">{children}</pre>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-1">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-1">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed break-words m-0 whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                    {message.metadata && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {message.metadata.tablesGenerated && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            <Database className="w-3 h-3 mr-1" />
                            {message.metadata.tablesGenerated} tables generated
                          </Badge>
                        )}
                        {message.metadata.endpointsCreated && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                            <Code className="w-3 h-3 mr-1" />
                            {message.metadata.endpointsCreated} endpoints created
                          </Badge>
                        )}
                        {message.metadata.action === 'schema_update' && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Schema updated
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isAiTyping && (
              <div className="flex gap-2 sm:gap-3 w-full">
                <Avatar className="w-7 h-7 sm:w-9 sm:h-9 mt-1 flex-shrink-0">
                  <AvatarFallback className="bg-gray-100 text-gray-700 border border-gray-200">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="font-semibold text-xs sm:text-sm text-foreground">RhinoAI</span>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 animate-pulse">Building your backend magic...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 border-t border-border p-4 sm:p-6 bg-background">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Describe your backend idea... 'Build a social media app' or 'Create an e-commerce API'"
              className="min-h-[40px] sm:min-h-[48px] max-h-[100px] sm:max-h-[120px] resize-none pr-12 sm:pr-16 border-gray-300 rounded-lg shadow-sm focus:border-gray-500 focus:ring-gray-500 transition-all duration-200 text-sm"
              maxLength={2000}
              disabled={isAiTyping}
            />
            <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 text-xs text-muted-foreground bg-background px-1 rounded">
              {input.length}/2000
            </div>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isAiTyping} 
            className="self-end h-10 sm:h-12 px-3 sm:px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 transition-colors duration-200"
            size="sm"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground hidden sm:block">Press Enter to send, Shift+Enter for new line</p>
          <p className="text-xs text-muted-foreground sm:hidden">Enter to send</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Powered by</span>
            <Sparkles className="w-3 h-3" />
            <span>RhinoAI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
