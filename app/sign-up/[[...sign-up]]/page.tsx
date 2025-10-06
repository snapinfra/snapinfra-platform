"use client"

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export default function SignUpPage() {
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

                {/* Sign Up Card */}
                <div className="w-full relative">
                  {/* Subtle border */}
                  <div className="absolute inset-0 rounded-2xl bg-[rgba(16,122,77,0.1)] p-[1px]">
                    <div className="w-full h-full rounded-2xl bg-white"></div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[rgba(55,50,47,0.08)] overflow-hidden">
                    <div className="p-6 sm:p-8">
                      <SignUp 
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "bg-transparent shadow-none w-full",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: 
                              "border-[rgba(55,50,47,0.12)] bg-white hover:bg-[#fafafa] hover:border-[rgba(55,50,47,0.18)] text-[#37322F] font-sans font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-200",
                            socialButtonsBlockButtonText: "font-sans font-medium text-[#37322F]",
                            dividerLine: "bg-[rgba(55,50,47,0.12)]",
                            dividerText: "text-[#605A57] font-sans text-sm",
                            formButtonPrimary: 
                              "bg-[#107a4d] hover:bg-[#0d6340] text-white font-sans font-semibold shadow-[0_2px_8px_rgba(16,122,77,0.3)] hover:shadow-[0_4px_12px_rgba(16,122,77,0.4)] transition-all duration-200 normal-case",
                            formFieldLabel: "text-[#37322F] font-sans font-medium text-sm",
                            formFieldInput: 
                              "border-[rgba(55,50,47,0.12)] bg-white focus:border-[#107a4d] focus:ring-[#107a4d]/20 text-[#37322F] font-sans placeholder:text-[#605A57]/50 rounded-lg transition-all duration-200",
                            footerActionLink: "text-[#107a4d] hover:text-[#0d6340] font-sans font-medium transition-colors duration-200",
                            formFieldInputShowPasswordButton: "text-[#605A57] hover:text-[#37322F]",
                            identityPreviewText: "text-[#37322F] font-sans",
                            identityPreviewEditButton: "text-[#107a4d] hover:text-[#0d6340]",
                            formResendCodeLink: "text-[#107a4d] hover:text-[#0d6340] font-sans font-medium",
                            otpCodeFieldInput: "border-[rgba(55,50,47,0.12)] focus:border-[#107a4d] focus:ring-[#107a4d]/20 text-[#37322F]",
                          }
                        }}
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
                        afterSignUpUrl="/auth-callback"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom text */}
                <div className="text-center text-[#605A57] text-xs sm:text-sm font-normal font-sans">
                  By continuing, you agree to Snapinfra's{" "}
                  <Link href="/terms" className="text-[#107a4d] hover:text-[#0d6340] underline transition-colors">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-[#107a4d] hover:text-[#0d6340] underline transition-colors">
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
