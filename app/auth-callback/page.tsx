"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { loadProjects } from '@/lib/storage'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      // If not signed in, redirect to sign in page
      router.push('/sign-in')
      return
    }

    // User is signed in, check if they have projects (client-side only)
    if (typeof window !== 'undefined') {
      const projects = loadProjects()
      
      if (projects && projects.length > 0) {
        // User has existing projects, redirect to dashboard
        router.push('/dashboard')
      } else {
        // First time user, redirect to onboarding
        router.push('/onboarding')
      }
    } else {
      // Fallback for server-side rendering
      router.push('/onboarding')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
