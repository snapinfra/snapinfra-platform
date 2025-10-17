"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { loadProjects, hasCompletedOnboarding } from '@/lib/storage'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      // If not signed in, redirect to sign in page
      router.push('/sign-in')
      return
    }

    // User is signed in, determine where to redirect
    if (typeof window !== 'undefined') {
      // Check if user was just created (within last 10 seconds)
      const userCreatedAt = new Date(user?.createdAt || 0)
      const now = new Date()
      const timeDiff = now.getTime() - userCreatedAt.getTime()
      const isNewUser = timeDiff < 10000 // Less than 10 seconds ago
      
      // Also check if they have projects
      const projects = loadProjects()
      const hasProjects = projects && projects.length > 0
      
      if (isNewUser && !hasProjects) {
        // Definitely a first-time user
        router.push('/onboarding')
      } else if (hasProjects) {
        // User has existing projects, redirect to dashboard
        router.push('/dashboard')
      } else {
        // Fallback: check if they have onboarded before
        if (hasCompletedOnboarding()) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      }
    } else {
      // Fallback for server-side rendering
      router.push('/onboarding')
    }
  }, [isLoaded, isSignedIn, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
