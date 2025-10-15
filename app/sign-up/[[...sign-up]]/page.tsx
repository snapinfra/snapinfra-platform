"use client"

import { SignUp, useUser } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"

export default function SignUpPage() {
  const { isLoaded } = useUser()
  const [showClerk, setShowClerk] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setShowClerk(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-br from-[#fafaf9] via-[#f5f3f0] to-[#ede9e3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch overflow-hidden flex flex-col justify-center items-center relative z-10 min-h-screen">
            {/* Navigation */}
            <nav className="w-full h-14 fixed top-0 left-0 right-0 bg-white border-b border-[rgba(55,50,47,0.08)] z-50">
              <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center">
                    <Image src="/snapinfra-logo.svg" alt="Snapinfra" width={100} height={24} className="h-6 w-auto" />
                  </Link>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link href="/sign-in">
                    <button className="px-4 py-2 bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-sm font-medium font-sans transition-colors">
                      Sign in
                    </button>
                  </Link>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center w-full px-4 pt-24 pb-12">
              <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
                {/* Header Section */}
                <div className="w-full flex flex-col items-center gap-4 text-center">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-[#37322F] text-3xl sm:text-4xl md:text-5xl font-normal leading-tight font-serif">
                      Start building
                    </h1>
                    <p className="text-[#605A57] text-sm sm:text-base font-normal leading-6 font-sans">
                      Create your account and ship backends in minutes, not weeks
                    </p>
                  </div>
                </div>

                {/* Sign Up Section */}
                <div className="w-full" style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="w-full" style={{ maxWidth: '28rem' }}>
                      {showClerk ? (
                        <div className="animate-in fade-in duration-500" style={{ display: 'flex', justifyContent: 'center' }}>
                          <SignUp 
                            appearance={{
                              elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none w-full border-0",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: 
                                  "border-[rgba(55,50,47,0.12)] bg-white hover:bg-[#fafafa] hover:border-[rgba(55,50,47,0.18)] text-[#37322F] font-sans font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200",
                                socialButtonsBlockButtonText: "font-sans font-medium text-[#37322F]",
                                dividerLine: "bg-[rgba(55,50,47,0.12)]",
                                dividerText: "text-[#605A57] font-sans text-sm",
                                formButtonPrimary: 
                                  "bg-[#005BE3] hover:bg-[#004BC9] text-white font-sans font-semibold shadow-[0_2px_8px_rgba(0,91,227,0.3)] hover:shadow-[0_4px_12px_rgba(0,91,227,0.4)] transition-all duration-200 normal-case",
                                formFieldLabel: "text-[#37322F] font-sans font-medium text-sm",
                                formFieldInput: 
                                  "border-[rgba(55,50,47,0.12)] bg-white focus:border-[#005BE3] focus:ring-[#005BE3]/20 text-[#37322F] font-sans placeholder:text-[#605A57]/50 rounded-lg transition-all duration-200",
                                footerActionLink: "text-[#005BE3] hover:text-[#004BC9] font-sans font-medium transition-colors duration-200",
                                formFieldInputShowPasswordButton: "text-[#605A57] hover:text-[#37322F]",
                                identityPreviewText: "text-[#37322F] font-sans",
                                identityPreviewEditButton: "text-[#005BE3] hover:text-[#004BC9]",
                                formResendCodeLink: "text-[#005BE3] hover:text-[#004BC9] font-sans font-medium",
                                otpCodeFieldInput: "border-[rgba(55,50,47,0.12)] focus:border-[#005BE3] focus:ring-[#005BE3]/20 text-[#37322F]",
                              }
                            }}
                            routing="path"
                            path="/sign-up"
                            signInUrl="/sign-in"
                            afterSignUpUrl="/auth-callback"
                          />
                        </div>
                      ) : (
                        <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-6">
                          {/* Loading spinner */}
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-[rgba(55,50,47,0.1)] border-t-[#005BE3] rounded-full animate-spin"></div>
                          </div>
                          
                          {/* Loading text */}
                          <div className="text-center space-y-2">
                            <p className="text-[#37322F] font-medium font-sans">Preparing your registration</p>
                            <p className="text-[#605A57] text-sm font-sans">Setting up your account form...</p>
                          </div>
                          
                          {/* Skeleton forms */}
                          <div className="w-full max-w-sm space-y-4 mt-8">
                            {/* Social buttons skeleton */}
                            <div className="space-y-3">
                              <div className="h-10 bg-[rgba(55,50,47,0.06)] rounded-lg animate-pulse"></div>
                              <div className="h-10 bg-[rgba(55,50,47,0.06)] rounded-lg animate-pulse"></div>
                            </div>
                            
                            {/* Divider */}
                            <div className="flex items-center my-6">
                              <div className="flex-1 h-px bg-[rgba(55,50,47,0.12)]"></div>
                              <span className="px-4 text-sm text-[#605A57] font-sans">or</span>
                              <div className="flex-1 h-px bg-[rgba(55,50,47,0.12)]"></div>
                            </div>
                            
                            {/* Form fields skeleton */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="h-4 w-24 bg-[rgba(55,50,47,0.06)] rounded animate-pulse"></div>
                                <div className="h-10 bg-[rgba(55,50,47,0.06)] rounded-lg animate-pulse"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 w-20 bg-[rgba(55,50,47,0.06)] rounded animate-pulse"></div>
                                <div className="h-10 bg-[rgba(55,50,47,0.06)] rounded-lg animate-pulse"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 w-16 bg-[rgba(55,50,47,0.06)] rounded animate-pulse"></div>
                                <div className="h-10 bg-[rgba(55,50,47,0.06)] rounded-lg animate-pulse"></div>
                              </div>
                              <div className="h-10 bg-[#005BE3]/20 rounded-lg animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Bottom text */}
                <div className="text-center text-[#605A57] text-xs sm:text-sm font-normal font-sans">
                  By continuing, you agree to Snapinfra's{" "}
                  <Link href="/terms" className="text-[#005BE3] hover:text-[#004BC9] underline transition-colors">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#005BE3] hover:text-[#004BC9] underline transition-colors">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
