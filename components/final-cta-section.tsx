"use client"

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function FinalCTASection() {
  return (
    <div className="w-full mt-32 px-4">
      <div className="relative overflow-hidden rounded-2xl bg-[#1d1d1f] p-12 md:p-16 lg:p-20">
        {/* Content */}
        <div className="relative z-10 text-center space-y-6 md:space-y-8">
          <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-white" style={{ letterSpacing: '-0.02em' }}>
            From Idea to Production in 5 Minutes
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Join developers building the future, faster
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link href="/sign-up">
              <button className="group px-8 py-4 bg-white text-[#1d1d1f] text-base md:text-lg font-semibold rounded-xl hover:bg-white/95 transition-all duration-200 flex items-center gap-2">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
          
          <p className="text-white/70 text-sm">
            No credit card required • Full source ownership
          </p>
          
          {/* Trust Badges */}
          <div className="pt-8 flex flex-wrap gap-3 justify-center items-center">
            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/90 text-xs font-medium">SOC 2 Type II</span>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/90 text-xs font-medium">ISO 27001</span>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/90 text-xs font-medium">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
