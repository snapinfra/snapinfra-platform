"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Database, Code2, Lock, Boxes, Server, Zap, Check, ArrowUp, Sparkles } from "lucide-react"
import { Instrument_Serif } from 'next/font/google'
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid'

const instrumentSerif = Instrument_Serif({ 
  subsets: ['latin'], 
  weight: ['400'],
  style: ['italic']
})
import DocumentationSection from "@/components/documentation-section"
import TestimonialsSection from "@/components/testimonials-section"
import PricingSection from "@/components/pricing-section"
import FAQSection from "@/components/faq-section"
import CTASection from "@/components/cta-section"
import FooterSection from "@/components/footer-section"
import OpenSourceBanner from "@/components/opensource-banner"

// Streaming Code Component
function StreamingCode() {
  const [currentLine, setCurrentLine] = useState(4) // Start at line 5 (index 4)
  const [currentChar, setCurrentChar] = useState(0)
  const mountedRef = useRef(true)

  const codeLines = [
    { num: 1, code: <><span className="text-purple-600">import</span> <span className="text-gray-700">&#123; validateToken, generateJWT &#125;</span> <span className="text-purple-600">from</span> <span className="text-green-600">'@/lib/auth'</span>;</> },
    { num: 2, code: <><span className="text-purple-600">import</span> <span className="text-gray-700">&#123; TenantService &#125;</span> <span className="text-purple-600">from</span> <span className="text-green-600">'@/services'</span>;</> },
    { num: 3, code: <></> },
    { num: 4, code: <span className="text-gray-500">/** Multi-tenant authentication with RBAC */</span> },
    { num: 5, code: <><span className="text-purple-600">export</span> <span className="text-purple-600">class</span> <span className="text-blue-600 font-semibold">AuthService</span> &#123;</> },
    { num: 6, code: <span className="pl-4"><span className="text-purple-600">async</span> <span className="text-yellow-600">authenticate</span>(tenantId: <span className="text-blue-600">string</span>, credentials: <span className="text-blue-600">Credentials</span>) &#123;</span> },
    { num: 7, code: <span className="pl-8"><span className="text-purple-600">const</span> tenant = <span className="text-purple-600">await</span> TenantService.<span className="text-yellow-600">findById</span>(tenantId);</span> },
    { num: 8, code: <span className="pl-8"><span className="text-purple-600">if</span> (!tenant?.active) <span className="text-purple-600">throw</span> <span className="text-purple-600">new</span> <span className="text-yellow-600">UnauthorizedError</span>();</span> },
  ]

  const lineTexts = [
    "import { validateToken, generateJWT } from '@/lib/auth';",
    "import { TenantService } from '@/services';",
    "",
    "/** Multi-tenant authentication with RBAC */",
    "export class AuthService {",
    "  async authenticate(tenantId: string, credentials: Credentials) {",
    "    const tenant = await TenantService.findById(tenantId);",
    "    if (!tenant?.active) throw new UnauthorizedError();",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return
      
      setCurrentChar(prev => {
        const lineLength = lineTexts[currentLine]?.length || 0
        
        if (prev >= lineLength) {
          if (currentLine < lineTexts.length - 1) {
            setCurrentLine(currentLine + 1)
            return 0
          } else {
            // Reset animation
            setCurrentLine(0)
            return 0
          }
        }
        return prev + 1
      })
    }, 50)

    return () => {
      clearInterval(interval)
      mountedRef.current = false
    }
  }, [currentLine])

  return (
    <div className="space-y-1.5">
      {codeLines.map((line, idx) => {
        const isActive = idx === currentLine
        const isComplete = idx < currentLine
        const opacity = isComplete || isActive ? 1 : 0.2
        const lineText = lineTexts[idx]
        const visibleText = isActive ? lineText.substring(0, currentChar) : (isComplete ? lineText : '')
        
        return (
          <div key={line.num} className="flex gap-6 text-[10px]" style={{ opacity }}>
            <span className="w-6 text-right text-gray-400">{line.num}</span>
            <div className="relative font-mono min-h-[14px]">
              {(isComplete || (isActive && currentChar > 0)) && (
                <span>{line.code}</span>
              )}
              {isActive && currentChar < lineText.length && (
                <span className="inline-block w-1.5 h-3.5 bg-[#107a4d] ml-0.5 animate-pulse"></span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Interactive Prompt Box Component
function InteractivePromptBox() {
  const [prompt, setPrompt] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (prompt.trim()) {
      // Store the prompt in sessionStorage to pass to onboarding
      sessionStorage.setItem('backend-prompt', prompt)
      // Redirect to sign-up
      router.push('/sign-up')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [prompt])

  return (
    <div className="w-full relative">
      {/* Solid primary border */}
      <div className="absolute inset-0 rounded-2xl p-[2px] bg-[#107a4d]">
        <div className="w-full h-full rounded-2xl"></div>
      </div>
      
      {/* Background glow effect */}
      <div className={`absolute -inset-2 bg-[#107a4d]/30 rounded-2xl blur-xl transition-opacity duration-300 ${
        isFocused ? 'opacity-100' : 'opacity-40'
      }`}></div>
      
      {/* Main input container */}
      <div className="relative rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden" style={{ margin: '2px' }}>
        {/* Semi-transparent dark background */}
        <div className="absolute inset-0 bg-[#1d1d1f]/90 backdrop-blur-sm z-0"></div>
        <div className="flex items-start gap-3 p-4 sm:p-5 relative z-10">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="multi-tenant SaaS with usage-based billing. need RBAC, audit logs, and analytics dashboards."
            className="flex-1 bg-transparent text-white placeholder-[rgba(255,255,255,0.4)] text-sm sm:text-base resize-none outline-none min-h-[24px] overflow-hidden font-sans"
            rows={1}
          />
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              prompt.trim()
                ? 'bg-[#107a4d] hover:bg-[#0d6340] shadow-[0_2px_8px_rgba(16,122,77,0.4)] cursor-pointer hover:shadow-[0_4px_12px_rgba(16,122,77,0.5)] hover:scale-105'
                : 'bg-white/10 cursor-not-allowed'
            }`}
          >
            <ArrowUp className={`w-5 h-5 ${
              prompt.trim() ? 'text-white' : 'text-white/30'
            }`} />
          </button>
        </div>
        
        {/* Bottom row with hints */}
        <div className="px-4 sm:px-5 pb-3 flex items-center gap-2 text-xs text-[rgba(255,255,255,0.5)] relative z-10">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border border-[rgba(255,255,255,0.3)] flex items-center justify-center">
              <span className="text-[8px]">⏎</span>
            </div>
            <span>to send</span>
          </div>
          <span>•</span>
          <span>Shift + ⏎ for new line</span>
        </div>
      </div>
    </div>
  )
}

// Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}


// Feature Card with Progress
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
  icon,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-6 rounded-2xl overflow-hidden flex flex-col justify-start items-start gap-4 cursor-pointer relative transition-all duration-500 group ${
        isActive
          ? "bg-white shadow-[0_8px_30px_rgba(16,122,77,0.15),0_0_0_2px_rgba(16,122,77,0.2)] scale-[1.02] md:scale-105"
          : "bg-white/60 hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:scale-[1.01]"
      }`}
      onClick={onClick}
    >
      {/* Progress bar */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-[#107a4d]/10 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#107a4d] to-[#0d6340] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(16,122,77,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
        isActive 
          ? 'bg-[#107a4d] text-white shadow-[0_4px_12px_rgba(16,122,77,0.3)]' 
          : 'bg-[#107a4d]/10 text-[#107a4d] group-hover:bg-[#107a4d]/20'
      }`}>
        {icon}
      </div>

      {/* Title */}
      <div className={`self-stretch text-base md:text-lg font-semibold leading-tight font-sans transition-colors duration-300 ${
        isActive ? 'text-[#107a4d]' : 'text-[#37322F] group-hover:text-[#107a4d]'
      }`}>
        {title}
      </div>
      
      {/* Description */}
      <div className="self-stretch text-[#605A57] text-sm font-normal leading-relaxed font-sans">
        {description}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="flex items-center gap-2 text-[#107a4d] text-xs font-medium mt-auto">
          <div className="w-2 h-2 rounded-full bg-[#107a4d] animate-pulse"></div>
          <span>Active</span>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)


  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-br from-[#fafaf9] via-[#f5f3f0] to-[#ede9e3] overflow-x-hidden flex flex-col justify-start items-center">
      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="z-0 absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#107a4d"
        maxOpacity={0.1}
        flickerChance={0.3}
      />
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Open Source Banner */}
            <div className="w-full fixed top-0 left-0 right-0 z-50">
              <OpenSourceBanner />
            </div>
            
            {/* Navigation */}
            <nav className="w-full h-14 fixed top-[32px] left-0 right-0 bg-white border-b border-[rgba(55,50,47,0.08)] z-50">
              <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Left side - Logo */}
                <div className="flex items-center">
                  <Link href="/" className="flex items-center">
                    <Image src="/snapinfra-logo.svg" alt="Snapinfra" width={100} height={24} className="h-6 w-auto" />
                  </Link>
                </div>
                
                {/* Right side - Nav Links and Auth Buttons */}
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex items-center gap-6">
                    <a href="#pricing" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer">
                      Pricing
                    </a>
                    <a href="#enterprise" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer">
                      Enterprise
                    </a>
                    <a href="#resources" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer">
                      Resources
                    </a>
                    <a href="#blog" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer">
                      Blog
                    </a>
                    <a href="#docs" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer">
                      Docs
                    </a>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#37322F] text-sm font-medium font-sans hover:text-[#107a4d] transition-colors cursor-pointer flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                      </svg>
                      GitHub
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link href="/sign-in">
                      <button className="px-4 py-2 bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-sm font-medium font-sans transition-colors">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/sign-up">
                      <button className="px-5 py-2 bg-[#107a4d] hover:bg-[#0d6340] text-white text-sm font-medium font-sans shadow-sm transition-all duration-200">
                        Sign Up
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-28 sm:pt-32 md:pt-36 lg:pt-[140px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
              <div className="w-full max-w-[900px] flex flex-col justify-center items-center gap-2 sm:gap-3">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5">
              <div className="w-full max-w-[700px] text-center flex justify-center flex-col text-[36px] xs:text-[40px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.15] sm:leading-[1.15] md:leading-[1.15] font-serif px-2 sm:px-4 md:px-0" style={{ letterSpacing: '-0.04em' }}>
                    <span className="text-[#1d1d1f]">Enterprise infrastructure in</span>
                    <span className={`text-[#107a4d] font-normal italic ${instrumentSerif.className}`}>one prompt.</span>
                  </div>
                  <div className="w-full max-w-[700px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] text-[15px] sm:text-[16px] leading-[1.6] font-sans px-2 sm:px-4 md:px-0 font-normal">
                    Multi-tenant architecture. Database schemas. API layers. Security built-in.
                    <br />
                    Generated in minutes. Deployed to your cloud.
                  </div>
                </div>
              </div>

              {/* Interactive Input Box */}
              <div className="w-full max-w-[800px] lg:w-[800px] flex flex-col justify-center items-center gap-3 relative z-10 mt-8 px-4">
                <InteractivePromptBox />
              </div>

              {/* MacBook UI Placeholder */}
              <div className="w-full max-w-[1000px] lg:w-[1000px] mt-16 px-4">
                <div className="relative">
                  {/* MacBook Frame - Light Theme */}
                  <div className="bg-gradient-to-b from-[#e5e5e7] to-[#d1d1d6] rounded-t-2xl p-3 shadow-2xl">
                    {/* Top Bar with Traffic Lights */}
                    <div className="flex items-center gap-2 mb-4 px-3">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
                    </div>
                    
                    {/* Screen Content */}
                    <div className="bg-white rounded-xl overflow-hidden aspect-[16/10] shadow-inner border border-gray-100">
                      <div className="w-full h-full bg-white">
                        {/* AI Code Generation Interface */}
                        <div className="h-full flex">
                          {/* Main Content Area - Full Width */}
                          <div className="flex-1 flex flex-col">
                            {/* AI Generation Header */}
                            <div className="flex items-center justify-between bg-[#f8f8f8] px-6 py-3 border-b border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[#107a4d]/20 rounded-full animate-ping"></div>
                                    <div className="relative w-2 h-2 bg-[#107a4d] rounded-full"></div>
                                  </div>
                                  <span className="text-[#1d1d1f] text-sm font-medium font-sans">AI generating your backend...</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-gray-500 text-xs font-mono">
                                <span>auth.service.ts</span>
                                <span>•</span>
                                <span>47 lines</span>
                              </div>
                            </div>
                            
                            {/* Code Editor with AI Streaming Effect */}
                            <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed overflow-hidden bg-white relative">
                              {/* Streaming Code Component */}
                              <StreamingCode />
                              
                              {/* AI Generation Indicator */}
                              <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-[#107a4d]/10 rounded-full border border-[#107a4d]/20">
                                <svg className="w-3 h-3 text-[#107a4d] animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-[#107a4d] text-[10px] font-medium font-sans">Generating...</span>
                              </div>
                            </div>
                            
                            {/* Bottom Status Bar */}
                            <div className="h-6 bg-[#107a4d] flex items-center justify-between px-4 text-[10px] text-white">
                              <div className="flex items-center gap-4">
                                <span className="font-mono">TypeScript</span>
                                <span className="opacity-70">UTF-8</span>
                              </div>
                              <div className="flex items-center gap-4 opacity-70">
                                <span>Ln 7, Col 48</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* MacBook Base - Light */}
                  <div className="h-2 bg-gradient-to-b from-[#e5e5e7] to-[#d1d1d6] rounded-b-xl shadow-lg"></div>
                  <div className="h-1 bg-gradient-to-b from-[#d1d1d6] to-[#b8b8bd] mx-auto" style={{ width: '60%' }}></div>
                  
                  {/* Subtle Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#107a4d]/10 to-transparent rounded-xl blur-3xl -z-10"></div>
                </div>
              </div>

              {/* Feature Cards Section */}
              <div className="self-stretch flex justify-center items-center mt-16 px-4 sm:px-6 md:px-8 lg:px-0">
                <div className="w-full max-w-[1000px] flex flex-col md:flex-row justify-center items-stretch gap-4 md:gap-6">
                  <FeatureCard
                    title="Enterprise-grade architecture"
                    description="Not starter templates. Production-ready systems with scalability, observability, and security baked in from the start."
                    isActive={activeCard === 0}
                    progress={activeCard === 0 ? progress : 0}
                    onClick={() => handleCardClick(0)}
                    icon={<Boxes className="w-6 h-6" />}
                  />
                  <FeatureCard
                    title="Own your infrastructure"
                    description="Full source code export. Deploy to your cloud. Customize everything. No vendor lock-in, no compromises."
                    isActive={activeCard === 1}
                    progress={activeCard === 1 ? progress : 0}
                    onClick={() => handleCardClick(1)}
                    icon={<Server className="w-6 h-6" />}
                  />
                  <FeatureCard
                    title="Accelerate time-to-market"
                    description="Your team focuses on differentiated features. We handle auth, APIs, compliance. Ship 10x faster."
                    isActive={activeCard === 2}
                    progress={activeCard === 2 ? progress : 0}
                    onClick={() => handleCardClick(2)}
                    icon={<Zap className="w-6 h-6" />}
                  />
                </div>
              </div>

              {/* Infrastructure Section - NEW */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center mt-16">
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-16 py-12 sm:py-16 md:py-20 flex justify-center items-center">
                  <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Left side - The Problem */}
                    <div className="flex flex-col gap-6">
                      <div className="inline-flex">
                        <div className="px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
                          <span className="text-red-700 text-xs font-semibold">The Problem</span>
                        </div>
                      </div>
                      <h2 className="text-[#37322F] text-2xl sm:text-3xl md:text-4xl font-normal leading-tight font-serif">
                        Infrastructure is killing velocity
                      </h2>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">6-8 weeks to MVP</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              Your team spends months on auth, role management, and API scaffolding. Competitors ship faster.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">Technical debt compounds</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              Quick decisions become architectural nightmares. Refactoring at 50k users costs millions in engineering hours.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">Compliance & security gaps</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              SOC 2, GDPR, audit logs. One security incident or failed audit derails your entire roadmap.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side - The Solution */}
                    <div className="flex flex-col gap-6">
                      <div className="inline-flex">
                        <div className="px-3 py-1.5 bg-[#107a4d]/10 rounded-full border border-[#107a4d]/20">
                          <span className="text-[#107a4d] text-xs font-semibold">The Solution</span>
                        </div>
                      </div>
                      <h2 className="text-[#37322F] text-2xl sm:text-3xl md:text-4xl font-normal leading-tight font-serif">
                        Enterprise infrastructure, instantly
                      </h2>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#107a4d] flex items-center justify-center mt-0.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">Production-ready in hours</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              Multi-tenant auth, RBAC, SSO, audit logs. Everything enterprises demand, generated and deployed instantly.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#107a4d] flex items-center justify-center mt-0.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">Built for scale</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              Optimized database architecture, query patterns, caching strategies. Handles 10M+ users without breaking a sweat.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#107a4d] flex items-center justify-center mt-0.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[#37322F] text-base font-semibold font-sans mb-1">Compliance-ready</h4>
                            <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                              SOC 2, HIPAA, GDPR controls built-in. Audit trails, data encryption, access controls. Pass audits with confidence.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center mt-16">
                <div className="self-stretch px-4 sm:px-6 md:px-24 py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[586px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                    <Badge
                      icon={
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="3" width="4" height="6" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="8" stroke="#37322F" strokeWidth="1" fill="none" />
                        </svg>
                      }
                      text="Why Snapinfra"
                    />
                    <div className="w-full max-w-[472.55px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-normal leading-tight md:leading-[60px] font-serif">
                      Move fast without breaking things
                    </div>
                    <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      Your engineers shouldn't spend months rebuilding what already exists.
                      <br className="hidden sm:block" />
                      Generate enterprise-grade backends. Ship features that drive revenue.
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="self-stretch flex justify-center items-start border-t">
                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden md:block">
                    <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                    {[
                      { icon: <Zap className="w-6 h-6" />, title: "10x faster iteration", desc: "Ship MVPs in days, not quarters. Validate product-market fit before burning through your Series A." },
                      { icon: <Code2 className="w-6 h-6" />, title: "Production-grade code", desc: "Enterprise patterns, comprehensive testing, full documentation. Code your senior engineers will approve." },
                      { icon: <Database className="w-6 h-6" />, title: "Scale-ready architecture", desc: "Optimized queries, proper indexing, efficient caching. Built to handle millions of users from day one." },
                      { icon: <Lock className="w-6 h-6" />, title: "Security & compliance", desc: "SOC 2, HIPAA, GDPR controls. Encryption, audit logs, access management. Enterprise security by default." },
                      { icon: <Boxes className="w-6 h-6" />, title: "Modular & maintainable", desc: "Clean architecture patterns. Easy to extend, simple to maintain. Onboard new engineers in hours, not weeks." },
                      { icon: <Server className="w-6 h-6" />, title: "Your infrastructure", desc: "Deploy to your AWS, GCP, or Azure. Full source code ownership. No vendor lock-in, ever." },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="p-6 md:p-8 lg:p-10 border-b border-r border-[rgba(55,50,47,0.12)] last:border-r-0 flex flex-col gap-4 group hover:bg-white/50 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#107a4d]/10 flex items-center justify-center text-[#107a4d] group-hover:bg-[#107a4d]/20 group-hover:shadow-[0_4px_12px_rgba(16,122,77,0.15)] transition-all duration-300">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-[#37322F] text-lg font-semibold leading-tight font-sans mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden md:block">
                    <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 100 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Section */}
              <DocumentationSection />

              {/* Testimonials Section */}
              <TestimonialsSection />

              {/* Pricing Section */}
              <PricingSection />

              {/* FAQ Section */}
              <FAQSection />

              {/* CTA Section */}
              <CTASection />

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

