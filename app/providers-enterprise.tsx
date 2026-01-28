'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Error logging utility
function logError(error: Error, context: string) {
  console.error(`[${context}]`, error)

  // Send to monitoring service (e.g., Sentry, DataDog)
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: { context }
    })
  }
}

// Retry logic with exponential backoff
function shouldRetry(failureCount: number, error: any): boolean {
  // Don't retry on client errors (4xx)
  if (error?.statusCode >= 400 && error?.statusCode < 500) {
    return false
  }

  // Don't retry authentication errors
  if (error?.statusCode === 401 || error?.statusCode === 403) {
    return false
  }

  // Retry up to 3 times for server errors and network issues
  return failureCount < 3
}

// Calculate retry delay with exponential backoff
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000) // Max 30 seconds
}

export function EnterpriseQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - data considered fresh for 1 minute
        staleTime: 60 * 1000,

        // Cache time - keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,

        // Retry failed requests
        retry: shouldRetry,
        retryDelay,

        // Don't refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'development',

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Refetch on mount if data is stale
        refetchOnMount: true,

        // Structural sharing for better performance
        structuralSharing: true,

        // Network mode - fail if offline
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000,

        // Network mode
        networkMode: 'online',
      },
    },

    // Global query error handler
    queryCache: new QueryCache({
      onError: (error: any, query) => {
        logError(error, `Query Error: ${query.queryHash}`)

        // Show user-friendly error message
        const message = error?.message || 'Failed to load data'

        // Don't show toast for background refetches
        if (query.state.data === undefined) {
          toast.error(message, {
            description: 'Please check your connection and try again',
          })
        }
      },

      onSuccess: (data, query) => {
        // Log successful queries in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Query Success] ${query.queryHash}`, data)
        }
      },
    }),

    // Global mutation error handler
    mutationCache: new MutationCache({
      onError: (error: any, _variables, _context, mutation) => {
        logError(error, `Mutation Error: ${mutation.options.mutationKey}`)

        // Show user-friendly error message
        const message = error?.message || 'Operation failed'
        toast.error(message, {
          description: 'Your changes could not be saved. Please try again.',
        })
      },

      onSuccess: (data, _variables, _context, mutation) => {
        // Log successful mutations
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Mutation Success] ${mutation.options.mutationKey}`, data)
        }
      },
    }),
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Network status monitor
export function NetworkStatusMonitor() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored', {
        description: 'You are back online'
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Connection lost', {
        description: 'You are currently offline',
        duration: Infinity,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return !isOnline ? (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium z-50">
      You are currently offline. Some features may not work.
    </div>
  ) : null
}
