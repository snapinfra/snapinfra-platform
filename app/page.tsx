"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Database, Code2, Lock, Boxes, Server, Zap, Check, ArrowUp, Sparkles } from "lucide-react"
import { Instrument_Serif } from 'next/font/google'
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid'
import { loadProjects, hasCompletedOnboarding } from '@/lib/storage'

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
import KeyDifferentiatorsSection from "@/components/key-differentiators-section"
import HowItWorksSection from "@/components/how-it-works-section"
import FinalCTASection from "@/components/final-cta-section"
import SocialProofSection from "@/components/social-proof-section"
import TechStackSection from "@/components/tech-stack-section"
import SecurityComplianceSection from "@/components/security-compliance-section"

// Streaming Code Component
function StreamingCode() {
  const [currentLine, setCurrentLine] = useState(4) // Start at line 5 (index 4)
  const [currentChar, setCurrentChar] = useState(0)
  const mountedRef = useRef(true)

  const codeLines = [
    { num: 1, code: <><span className="text-purple-600">import</span> <span className="text-gray-700">&#123; validateToken, generateJWT &#125;</span> <span className="text-purple-600">from</span> <span className="text-blue-600">'@/lib/auth'</span>;</> },
    { num: 2, code: <><span className="text-purple-600">import</span> <span className="text-gray-700">&#123; TenantService &#125;</span> <span className="text-purple-600">from</span> <span className="text-blue-600">'@/services'</span>;</> },
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
          <div key={line.num} className="flex gap-3 sm:gap-4 md:gap-6 text-[8px] sm:text-[9px] md:text-[10px]" style={{ opacity }}>
            <span className="w-5 sm:w-6 text-right text-gray-400 flex-shrink-0">{line.num}</span>
            <div className="relative font-mono min-h-[12px] sm:min-h-[14px] break-words overflow-x-auto">
              {(isComplete || (isActive && currentChar > 0)) && (
                <span>{line.code}</span>
              )}
              {isActive && currentChar < lineText.length && (
                <span className="inline-block w-1 h-2.5 sm:w-1.5 sm:h-3.5 bg-[#37322F] ml-0.5 animate-pulse"></span>
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
      <div className="absolute inset-0 rounded-2xl p-[2px] bg-[#1d1d1f]">
        <div className="w-full h-full rounded-2xl"></div>
      </div>
      
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
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
              prompt.trim()
                ? 'bg-[#1d1d1f] cursor-pointer'
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

// ROI Calculator Component
function ROICalculator() {
  const [teamSize, setTeamSize] = useState(5)
  const [projectsPerYear, setProjectsPerYear] = useState(3)
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex' | 'enterprise'>('medium')
  const [avgDeveloperRate, setAvgDeveloperRate] = useState(100) // $100/hour average
  const [iacType, setIacType] = useState<'terraform' | 'kubernetes' | 'cloudformation' | 'manual'>('terraform')
  const [cloudProvider, setCloudProvider] = useState<'aws' | 'gcp' | 'azure' | 'multi'>('aws')

  // Industry benchmarks based on market research and actual cloud provider pricing
  // Costs include: Database (RDS/Cloud SQL), Compute (EC2/VMs), API Gateway, Storage, Data Transfer
  const complexityMultipliers = {
    simple: { 
      apis: 10, // Simple MVP: 5-15 APIs, average 10
      hoursPerAPI: 8, // Simple API: 4-8 hours, average 8
      monthlyInfraCost: {
        aws: 180,      // RDS db.t3.micro ($15) + EC2 t3.small ($15) + API Gateway ($5) + S3 ($10) + Data Transfer ($15) + misc ($120)
        gcp: 165,      // Cloud SQL db-f1-micro ($7) + e2-small ($13) + Cloud Endpoints ($5) + Storage ($8) + Transfer ($12) + misc ($120)
        azure: 190,    // Azure DB Basic ($5) + B1S VM ($15) + API Management ($10) + Blob ($8) + Transfer ($12) + misc ($140)
        multi: 280     // Multi-cloud adds complexity and redundancy
      },
      snapinfraSetupHours: 1 // SnapInfra automated setup
    },
    medium: { 
      apis: 30, // Medium SaaS: 20-40 APIs, average 30
      hoursPerAPI: 12, // Medium API: 8-16 hours, average 12
      monthlyInfraCost: {
        aws: 450,      // RDS db.t3.medium ($60) + EC2 t3.medium ($30) + API Gateway ($20) + S3 ($25) + Data Transfer ($50) + misc ($265)
        gcp: 420,      // Cloud SQL db-n1-standard-1 ($50) + e2-medium ($25) + Cloud Endpoints ($15) + Storage ($20) + Transfer ($40) + misc ($270)
        azure: 480,    // Azure DB Standard ($55) + D2s v3 ($30) + API Management ($25) + Blob ($22) + Transfer ($48) + misc ($300)
        multi: 680     // Multi-cloud with redundancy
      },
      snapinfraSetupHours: 2
    },
    complex: { 
      apis: 65, // Complex: 50-80 APIs, average 65
      hoursPerAPI: 20, // Complex API: 16-32 hours, average 20
      monthlyInfraCost: {
        aws: 1200,     // RDS db.t3.large ($120) + EC2 m5.large ($70) + API Gateway ($50) + S3 ($60) + Data Transfer ($150) + Load Balancer ($20) + misc ($730)
        gcp: 1100,     // Cloud SQL db-n1-standard-2 ($100) + e2-standard-2 ($60) + Cloud Endpoints ($40) + Storage ($50) + Transfer ($120) + LB ($15) + misc ($715)
        azure: 1250,   // Azure DB Premium ($130) + D4s v3 ($70) + API Management ($60) + Blob ($55) + Transfer ($140) + LB ($25) + misc ($770)
        multi: 1800    // Multi-cloud enterprise setup
      },
      snapinfraSetupHours: 3
    },
    enterprise: { 
      apis: 100, // Enterprise: 80-150 APIs, average 100
      hoursPerAPI: 24, // Enterprise API: 20-40 hours, average 24
      monthlyInfraCost: {
        aws: 2800,     // RDS db.r5.xlarge ($350) + EC2 m5.xlarge ($150) + API Gateway ($100) + S3 ($150) + Data Transfer ($400) + Multi-AZ ($200) + misc ($1450)
        gcp: 2600,     // Cloud SQL db-n1-highmem-4 ($320) + e2-standard-4 ($130) + Cloud Endpoints ($80) + Storage ($140) + Transfer ($350) + HA ($180) + misc ($1380)
        azure: 2900,   // Azure DB Business Critical ($380) + D8s v3 ($160) + API Management ($120) + Blob ($150) + Transfer ($420) + HA ($220) + misc ($1450)
        multi: 4200    // Multi-cloud with full redundancy and failover
      },
      snapinfraSetupHours: 4
    }
  }

  // IaC setup time multipliers based on type and complexity
  const iacSetupMultipliers = {
    terraform: {
      simple: 40,    // Terraform: 40-60 hours
      medium: 60,    // Terraform: 50-80 hours
      complex: 80,   // Terraform: 70-100 hours
      enterprise: 120 // Terraform: 100-150 hours
    },
    kubernetes: {
      simple: 60,    // K8s: 60-80 hours (steep learning curve)
      medium: 90,    // K8s: 80-120 hours
      complex: 120,  // K8s: 100-150 hours
      enterprise: 180 // K8s: 150-200 hours (with DevOps team)
    },
    cloudformation: {
      simple: 50,    // CloudFormation: 50-70 hours
      medium: 70,    // CloudFormation: 60-90 hours
      complex: 100,  // CloudFormation: 90-120 hours
      enterprise: 140 // CloudFormation: 120-160 hours
    },
    manual: {
      simple: 80,    // Manual setup: 80-100 hours
      medium: 120,   // Manual setup: 100-150 hours
      complex: 160,  // Manual setup: 150-200 hours
      enterprise: 240 // Manual setup: 200-300 hours
    }
  }

  const multiplier = complexityMultipliers[complexity]
  const iacMultiplier = iacSetupMultipliers[iacType][complexity]
  
  // Get actual cloud provider costs based on complexity
  const traditionalMonthlyCost = multiplier.monthlyInfraCost[cloudProvider]
  
  // Calculate development time
  const totalAPIs = multiplier.apis * projectsPerYear
  const hoursPerAPI = multiplier.hoursPerAPI
  const totalDevHours = totalAPIs * hoursPerAPI
  
  // Infrastructure setup time (traditional IaC vs SnapInfra)
  // Multi-cloud adds 20% more setup time due to complexity
  const cloudComplexityMultiplier = cloudProvider === 'multi' ? 1.2 : 1.0
  const traditionalInfraHours = Math.round(iacMultiplier * cloudComplexityMultiplier * projectsPerYear)
  const snapinfraInfraHours = multiplier.snapinfraSetupHours * projectsPerYear
  const infraTimeSaved = traditionalInfraHours - snapinfraInfraHours
  
  // Total time saved (infrastructure + reduced API dev time with code generation)
  // SnapInfra generates production-ready code, saving ~30% of API development time
  const apiDevTimeSaved = totalDevHours * 0.30 // 30% time saved on API development
  const totalHoursSaved = infraTimeSaved + apiDevTimeSaved
  
  // Cost calculations - SnapInfra includes all infrastructure
  const snapinfraMonthlyCost = 99
  const monthlyCostSaved = traditionalMonthlyCost - snapinfraMonthlyCost
  const annualCostSaved = monthlyCostSaved * 12
  
  // Development cost savings (time saved * developer rate * team size)
  const devCostSaved = totalHoursSaved * avgDeveloperRate * teamSize
  
  // Total annual savings
  const totalCostSaved = annualCostSaved + devCostSaved
  
  // ROI Payback Period (months) = Annual SnapInfra cost / Monthly savings
  const snapinfraAnnualCost = snapinfraMonthlyCost * 12
  const monthlySavings = totalCostSaved / 12
  const paybackMonths = monthlySavings > 0 ? Math.ceil(snapinfraAnnualCost / monthlySavings) : 0

  const formatTime = (hours: number) => {
    if (hours >= 1000) {
      return `~${Math.round(hours / 1000 * 10) / 10}K hours`
    }
    return `~${Math.round(hours)} hours`
  }

  const formatCost = (cost: number) => {
    if (cost >= 1000000) {
      return `$${Math.round(cost / 1000000 * 10) / 10}M`
    } else if (cost >= 1000) {
      return `$${Math.round(cost / 1000)}K`
    }
    return `$${Math.round(cost)}`
  }

  // Helper function to format provider names
  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      aws: 'AWS',
      gcp: 'GCP',
      azure: 'Azure',
      multi: 'Multi-Cloud'
    }
    return names[provider] || provider
  }

  // Helper function to format IaC tool names
  const getIacToolName = (tool: string) => {
    const names: Record<string, string> = {
      terraform: 'Terraform',
      kubernetes: 'K8s',
      cloudformation: 'CloudFormation',
      manual: 'Manual'
    }
    return names[tool] || tool
  }

  // Calculate percentage savings
  const timeSavingsPercentage = traditionalInfraHours > 0 
    ? Math.round((infraTimeSaved / traditionalInfraHours) * 100) 
    : 0
  
  const costSavingsPercentage = traditionalMonthlyCost > 0
    ? Math.round((monthlyCostSaved / traditionalMonthlyCost) * 100)
    : 0

  return (
    <div className="w-full max-w-[1100px] mt-16 px-4">
      <div className="bg-white rounded-2xl border border-[rgba(55,50,47,0.12)] p-6 md:p-12 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] mb-2">Calculate Your Savings</h3>
          <p className="text-sm md:text-base text-[#605A57]">See how much time and money SnapInfra can save your team</p>
        </div>

        {/* Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Team Size
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={teamSize}
                className="w-full h-2 bg-[rgba(55,50,47,0.1)] rounded-lg appearance-none cursor-pointer accent-[#1d1d1f]"
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-[#605A57] mt-1">
                <span>1</span>
                <span className="font-semibold text-[#1d1d1f]">{teamSize}</span>
                <span>50+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Projects per Year
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={projectsPerYear}
                className="w-full h-2 bg-[rgba(55,50,47,0.1)] rounded-lg appearance-none cursor-pointer accent-[#1d1d1f]"
                onChange={(e) => setProjectsPerYear(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-[#605A57] mt-1">
                <span>1</span>
                <span className="font-semibold text-[#1d1d1f]">{projectsPerYear}</span>
                <span>20+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Average Project Complexity
              </label>
              <select
                value={complexity}
                className="w-full px-4 py-2.5 border border-[rgba(55,50,47,0.12)] rounded-lg bg-white text-[#37322F] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent transition-colors"
                onChange={(e) => setComplexity(e.target.value as typeof complexity)}
              >
                <option value="simple">Simple MVP (5-15 APIs)</option>
                <option value="medium">Medium SaaS (20-40 APIs)</option>
                <option value="complex">Complex Platform (50-80 APIs)</option>
                <option value="enterprise">Enterprise (80+ APIs)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Current IaC Tool
              </label>
              <select
                value={iacType}
                className="w-full px-4 py-2.5 border border-[rgba(55,50,47,0.12)] rounded-lg bg-white text-[#37322F] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent transition-colors"
                onChange={(e) => setIacType(e.target.value as typeof iacType)}
              >
                <option value="terraform">Terraform</option>
                <option value="kubernetes">Kubernetes</option>
                <option value="cloudformation">AWS CloudFormation</option>
                <option value="manual">Manual Setup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Cloud Provider
              </label>
              <select
                value={cloudProvider}
                className="w-full px-4 py-2.5 border border-[rgba(55,50,47,0.12)] rounded-lg bg-white text-[#37322F] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:border-transparent transition-colors"
                onChange={(e) => setCloudProvider(e.target.value as typeof cloudProvider)}
              >
                <option value="aws">AWS</option>
                <option value="gcp">Google Cloud Platform</option>
                <option value="azure">Microsoft Azure</option>
                <option value="multi">Multi-Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37322F] mb-2">
                Average Developer Rate ($/hour)
              </label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={avgDeveloperRate}
                className="w-full h-2 bg-[rgba(55,50,47,0.1)] rounded-lg appearance-none cursor-pointer accent-[#1d1d1f]"
                onChange={(e) => setAvgDeveloperRate(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-[#605A57] mt-1">
                <span>$50</span>
                <span className="font-semibold text-[#1d1d1f]">${avgDeveloperRate}</span>
                <span>$200+</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-[rgba(55,50,47,0.03)] rounded-xl p-6 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-medium text-[#605A57] uppercase tracking-wider mb-3">Estimated Annual Savings</div>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-1">
                    {formatTime(totalHoursSaved)}
                  </div>
                  <div className="text-sm text-[#605A57]">Time saved per year</div>
                  <div className="text-xs text-[#605A57]/70 mt-1">
                    {formatTime(infraTimeSaved)} infrastructure + {formatTime(apiDevTimeSaved)} development
                  </div>
                </div>
                <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
                  <div className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-1">
                    {formatCost(totalCostSaved)}
                  </div>
                  <div className="text-sm text-[#605A57]">Total cost savings</div>
                  <div className="text-xs text-[#605A57]/70 mt-1">
                    {formatCost(devCostSaved)} dev time + {formatCost(annualCostSaved)} infrastructure
                  </div>
                </div>
                <div className="pt-4 border-t border-[rgba(55,50,47,0.12)]">
                  <div className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-1">
                    ~{totalAPIs} APIs
                  </div>
                  <div className="text-sm text-[#605A57]">APIs generated per year</div>
                </div>
              </div>
            </div>

            <div className="bg-[#1d1d1f] rounded-xl p-6 text-white">
              <div className="text-sm font-medium mb-3">Comparison Breakdown</div>
              <div className="text-xs text-white/70 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Infrastructure setup ({getIacToolName(iacType)}):</span>
                  <span className="font-semibold">{snapinfraInfraHours}h vs {traditionalInfraHours}h</span>
                </div>
                <div className="text-xs text-white/50 pl-2">
                  ({timeSavingsPercentage}% time saved)
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Monthly infrastructure cost ({getProviderName(cloudProvider)}):</span>
                  <span className="font-semibold">${snapinfraMonthlyCost} vs ${traditionalMonthlyCost}</span>
                </div>
                <div className="text-xs text-white/50 pl-2">
                  (${monthlyCostSaved}/mo saved, {costSavingsPercentage}% reduction)
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>API development time:</span>
                  <span className="font-semibold">~30% faster</span>
                </div>
                <div className="text-xs text-white/50 pl-2">
                  ({formatTime(apiDevTimeSaved)} saved per year)
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Total APIs per year:</span>
                  <span className="font-semibold">{totalAPIs} APIs</span>
                </div>
                <div className="text-xs text-white/50 pl-2">
                  ({multiplier.apis} APIs × {projectsPerYear} projects)
                </div>
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ROI Payback Period:</span>
                    <span className="font-semibold text-green-400">
                      {paybackMonths > 0 ? `${paybackMonths} month${paybackMonths > 1 ? 's' : ''}` : 'Immediate'}
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Based on ${formatCost(totalCostSaved)} annual savings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function LandingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  // Auto-redirect existing users to dashboard
  useEffect(() => {
    if (!isLoaded) return
    
    if (isSignedIn) {
      // Check if user has projects or has completed onboarding
      const projects = loadProjects()
      const hasProjects = projects && projects.length > 0
      const hasOnboarded = hasCompletedOnboarding()
      
      if (hasProjects || hasOnboarded) {
        // Existing user with projects or completed onboarding - go to dashboard
        router.push('/dashboard')
      } else {
        // Signed in but no projects and hasn't onboarded - redirect to onboarding
        router.push('/onboarding')
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  // Show loading state if user is signed in to prevent flash
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fafaf9] via-[#f5f3f0] to-[#ede9e3]">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[rgba(55,50,47,0.1)] border-t-[#37322F] rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-[#37322F] font-medium font-sans">Redirecting...</p>
          <p className="text-[#605A57] text-sm font-sans">Taking you to your dashboard</p>
        </div>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapinfra.com'

  // Structured Data (JSON-LD) for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Snapinfra",
    "url": baseUrl,
    "logo": `${baseUrl}/snapinfra-logo.svg`,
    "description": "Generate production-ready backend infrastructure with AI. Multi-tenant architecture, database schemas, API layers, and security built-in.",
    "sameAs": [
      "https://github.com/manojmaheshwarjg/snapinfra"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service"
    }
  }

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Snapinfra",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "AI-powered backend infrastructure generator. Create production-ready backends with multi-tenant architecture, database schemas, API layers, and security built-in. Deploy to AWS, GCP, or Azure in minutes.",
    "featureList": [
      "Multi-tenant architecture",
      "Database schema generation",
      "API layer generation",
      "Security built-in",
      "Infrastructure as Code",
      "Cloud deployment (AWS, GCP, Azure)",
      "TypeScript backend generation"
    ]
  }

  // FAQ Schema for AI models
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Snapinfra?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Snapinfra is an AI-powered platform that generates production-ready backend infrastructure from natural language prompts. It creates multi-tenant architectures, database schemas, API layers, and security configurations, then deploys to cloud providers like AWS, GCP, and Azure."
        }
      },
      {
        "@type": "Question",
        "name": "Does Snapinfra generate real code?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Snapinfra generates actual TypeScript code, not no-code solutions. You own all the generated code with no vendor lock-in. The code includes Infrastructure as Code (Terraform, AWS CDK), database schemas, API endpoints, and security configurations."
        }
      },
      {
        "@type": "Question",
        "name": "Which cloud providers does Snapinfra support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Snapinfra supports AWS (Amazon Web Services), Google Cloud Platform (GCP), Azure, and multi-cloud deployments. You can choose your preferred cloud provider during the setup process."
        }
      },
      {
        "@type": "Question",
        "name": "What technologies does Snapinfra use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Snapinfra generates backends using TypeScript, Express.js, Node.js, PostgreSQL, Docker, AWS CDK, and Terraform. The frontend is built with Next.js 15, React 18, and Tailwind CSS."
        }
      },
      {
        "@type": "Question",
        "name": "Is there vendor lock-in with Snapinfra?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, there is zero vendor lock-in. You own all generated code and can export it at any time. Snapinfra generates standard Infrastructure as Code (IaC) that works with industry-standard tools like Terraform and AWS CDK."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to generate a backend?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Snapinfra can generate a complete backend infrastructure in minutes, compared to weeks of traditional development. The process involves describing your requirements in natural language, and the AI generates the complete infrastructure code."
        }
      }
    ]
  }

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-br from-[#fafaf9] via-[#f5f3f0] to-[#ede9e3] overflow-x-hidden flex flex-col justify-start items-center">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="z-0 absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#37322F"
        maxOpacity={0.05}
        flickerChance={0.2}
      />
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1280px] lg:w-[1280px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
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
                    <a href="https://github.com/manojmaheshwarjg/snapinfra" target="_blank" rel="noopener noreferrer" className="text-[#37322F] text-sm font-medium font-sans cursor-pointer flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                      </svg>
                      GitHub
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link href="/sign-in">
                      <button className="px-4 py-2 bg-[#1d1d1f] text-white text-sm font-medium font-sans">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/sign-up">
                      <button className="px-5 py-2 bg-[#1d1d1f] text-white text-sm font-medium font-sans">
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
                  <h1 className="w-full max-w-[700px] text-center flex justify-center flex-col text-[36px] xs:text-[40px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-normal leading-[1.15] sm:leading-[1.15] md:leading-[1.15] font-serif px-2 sm:px-4 md:px-0" style={{ letterSpacing: '-0.02em' }}>
                    <span className="text-[#1d1d1f]" style={{ letterSpacing: '-0.02em' }}>Enterprise infrastructure in{" "}
                    <span className={`text-[#005BE3] font-normal italic ${instrumentSerif.className} whitespace-nowrap`} style={{ letterSpacing: '-0.02em' }}>one prompt.</span></span>
                  </h1>
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

              {/* Code Editor Section */}
              <div className="w-full max-w-[1000px] lg:w-[1000px] mt-16 px-4">
                <div className="bg-white rounded-xl border border-[rgba(55,50,47,0.12)] overflow-hidden shadow-lg">
                  {/* AI Code Generation Interface */}
                  <div className="flex flex-col">
                    {/* AI Generation Header */}
                    <div className="flex items-center justify-between bg-[#f8f8f8] px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex items-center justify-center">
                          <div className="relative w-2 h-2 bg-[#1d1d1f] rounded-full"></div>
                        </div>
                        <span className="text-[#1d1d1f] text-xs sm:text-sm font-medium font-sans">AI generating your backend...</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-500 text-[10px] sm:text-xs font-mono">
                        <span className="hidden sm:inline">auth.service.ts</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-[10px] sm:text-xs">47 lines</span>
                      </div>
                    </div>
                    
                    {/* Code Editor with AI Streaming Effect */}
                    <div className="flex-1 p-4 sm:p-6 font-mono text-[9px] sm:text-[10px] md:text-[11px] leading-relaxed overflow-x-auto bg-white relative min-h-[200px] sm:min-h-[250px]">
                      {/* Streaming Code Component */}
                      <StreamingCode />
                      
                      {/* AI Generation Indicator */}
                      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[rgba(55,50,47,0.05)] rounded-full border border-[rgba(55,50,47,0.12)]">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#37322F] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-[#37322F] text-[8px] sm:text-[10px] font-medium font-sans">Generating...</span>
                      </div>
                    </div>
                    
                    {/* Bottom Status Bar */}
                    <div className="h-5 sm:h-6 bg-[#1d1d1f] flex items-center justify-between px-3 sm:px-4 text-[9px] sm:text-[10px] text-white">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="font-mono hidden sm:inline">TypeScript</span>
                        <span className="opacity-70 hidden sm:inline">UTF-8</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 opacity-70">
                        <span className="hidden sm:inline">Ln 7, Col 48</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar Section - Interactive ROI Calculator */}
              <ROICalculator />

              {/* The Problem Section */}
              <div className="w-full max-w-[1100px] mt-32 px-4">
                <div className="text-center mb-20">
                  <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>The $500K Backend Problem</h2>
                  <p className="text-lg sm:text-xl text-[#605A57] max-w-2xl mx-auto">Why every alternative is broken</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
                  {/* Column 1: No-Code Trap */}
                  <div className="bg-white rounded-2xl p-8 lg:p-10 border border-[rgba(55,50,47,0.12)] flex flex-col">
                    <div className="mb-6">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center mb-4">
                        <span className="text-[#1d1d1f] font-bold text-lg">01</span>
                      </div>
                      <h3 className="text-2xl lg:text-2xl font-bold text-[#1d1d1f] mb-3">The No-Code Trap</h3>
                      <p className="text-sm italic text-[#605A57] leading-relaxed">"We started with Firebase"</p>
                    </div>
                    
                    <div className="flex-1 space-y-3.5 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">$30,000 surprise bill because one query went viral</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Can't do complex queries - NoSQL limitations hit hard</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Vendor lock-in nightmare - "Firebase doesn't provide any tools to migrate data"</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Supabase "doesn't support transactions yet" - blocked our product launch</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-[rgba(55,50,47,0.12)] space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#1d1d1f]">61,161</span>
                        <span className="text-xs text-[#605A57]">companies using Firebase</span>
                      </div>
                      <p className="text-xs text-[#605A57]">54% worried about lock-in</p>
                    </div>
                  </div>
                  
                  {/* Column 2: DevOps Nightmare */}
                  <div className="bg-white rounded-2xl p-8 lg:p-10 border border-[rgba(55,50,47,0.12)] flex flex-col">
                    <div className="mb-6">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center mb-4">
                        <span className="text-[#1d1d1f] font-bold text-lg">02</span>
                      </div>
                      <h3 className="text-2xl lg:text-2xl font-bold text-[#1d1d1f] mb-3">The DevOps Nightmare</h3>
                      <p className="text-sm italic text-[#605A57] leading-relaxed">"We tried building it ourselves"</p>
                    </div>
                    
                    <div className="flex-1 space-y-3.5 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Terraform takes 3-6 months to learn before shipping</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Kubernetes requires "an army of specialists" to manage</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">CloudFormation's 15-minute feedback loops kill velocity</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">"YAML hell" - endless config files nobody understands</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-[rgba(55,50,47,0.12)] space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#1d1d1f]">77%</span>
                        <span className="text-xs text-[#605A57]">still struggle with K8s</span>
                      </div>
                      <p className="text-xs text-[#605A57]">70% onboarding takes 1+ month</p>
                    </div>
                  </div>
                  
                  {/* Column 3: Hidden Costs */}
                  <div className="bg-white rounded-2xl p-8 lg:p-10 border border-[rgba(55,50,47,0.12)] flex flex-col">
                    <div className="mb-6">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center mb-4">
                        <span className="text-[#1d1d1f] font-bold text-lg">03</span>
                      </div>
                      <h3 className="text-2xl lg:text-2xl font-bold text-[#1d1d1f] mb-3">The Hidden Costs</h3>
                      <p className="text-sm italic text-[#605A57] leading-relaxed">"Costs spiraled out of control"</p>
                    </div>
                    
                    <div className="flex-1 space-y-3.5 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Firebase's pay-per-read model becomes unsustainable</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">Supabase's PITR backup: $100/month regardless of DB size</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">"Empty EKS cluster costs are ridiculous" - baseline $150/mo</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#37322F] mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-[#605A57] leading-relaxed">AWS egress fees make migration financially painful</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-[rgba(55,50,47,0.12)] space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#1d1d1f]">54%</span>
                        <span className="text-xs text-[#605A57]">face steep learning curves</span>
                      </div>
                      <p className="text-xs text-[#605A57]">89% use multi-cloud to avoid lock</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link href="/sign-up">
                    <button className="px-8 py-4 bg-[#1d1d1f] text-white text-base sm:text-lg font-semibold rounded-lg transition-opacity hover:opacity-90">
                      There has to be a better way →
                    </button>
                  </Link>
                </div>
              </div>

              {/* The Solution Section */}
              <div className="w-full max-w-[1100px] mt-32 px-4">
                <div className="text-center mb-16">
                  <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>
                    Infrastructure that thinks like code,<br />feels like magic
                  </h2>
                  <p className="text-xl text-[#605A57] mt-6">We're the Goldilocks solution: Not too simple. Not too complex. Just right.</p>
                </div>
                
                <div className="bg-white rounded-2xl border border-[rgba(55,50,47,0.12)] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f8f8f8] border-b-2 border-[rgba(55,50,47,0.12)]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#37322F]">What You Get</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-[#37322F]">No-Code<br/><span className="text-xs font-normal">(Firebase/Supabase)</span></th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">SnapInfra</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-[#37322F]">Raw IaC<br/><span className="text-xs font-normal">(Terraform/K8s)</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(55,50,47,0.08)]">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Time to first deploy</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">1 hour</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">1 hour</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">40+ hours</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Learning curve</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Days</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">2 weeks</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">3-6 months</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Transaction support</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Missing (Supabase)</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">Built-in</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Manual setup</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Vendor lock-in</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">High risk</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">Full export</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Portable</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Custom business logic</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Limited</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">Full code</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Full code</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Cost predictability</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Surprise bills</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">Usage caps</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">Controlled</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-[#37322F]">Production ready</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">For prototypes</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#1d1d1f] bg-[rgba(55,50,47,0.05)]">Day one</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">After weeks</td>
                        </tr>
                        <tr className="bg-[#f8f8f8] font-semibold">
                          <td className="px-6 py-4 text-sm font-bold text-[#37322F]">Your monthly cost at 1M users</td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">$0-$2,847<br/><span className="text-xs font-normal">(volatile)</span></td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-[#1d1d1f] bg-[rgba(55,50,47,0.10)]">$0-$299<br/><span className="text-xs font-normal">(capped)</span></td>
                          <td className="px-6 py-4 text-center text-sm text-[#605A57]">$280 + 3 engineers</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Key Differentiators Section */}
              <KeyDifferentiatorsSection />

              {/* How It Works Section */}
              <HowItWorksSection />

              {/* Social Proof Section */}
              <SocialProofSection />

              {/* Tech Stack Section */}
              <TechStackSection />

              {/* Security & Compliance Section */}
              <SecurityComplianceSection />


              {/* Final CTA Section */}
              <FinalCTASection />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section - Full Width */}
      <FooterSection />
    </div>
  )
}

