"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function OpenSourceBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-[#107a4d] to-[#0d6340] h-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center w-full">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-white text-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
              We're welcoming contributions to open source!
            </span>
          </div>
          <Link 
            href="https://github.com/snapinfra/snapinfra" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider hover:underline underline-offset-4 transition-all group"
          >
            <span>Contribute Now</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
