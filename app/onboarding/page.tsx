"use client"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { Header } from "@/components/header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"

export default function OnboardingPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <SignedOut>
          <div className="flex flex-col items-center justify-center gap-5 py-24">
            <p className="text-sm text-muted-foreground">Please sign in to continue</p>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <Button size="sm" className="px-4">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" variant="outline" className="px-4">
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <OnboardingFlow />
        </SignedIn>
      </div>
    </SidebarProvider>
  )
}
