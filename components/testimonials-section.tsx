"use client"

import { useState, useEffect } from "react"

export default function TestimonialsSection() {
  const [activeQuote, setActiveQuote] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const quotes = [
    {
      quote: "I've built 6 MVPs in the time it used to take me to build 1. Snapinfra changed how I work.",
      context: "Solo developer building SaaS products"
    },
    {
      quote: "My clients don't care about my auth implementation. They care about features. Now I deliver features.",
      context: "Freelance developer"
    },
    {
      quote: "I thought this would be shit code. I was wrong. It's cleaner than most production code I've inherited.",
      context: "Senior engineer at a tech company"
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveQuote((prev) => (prev + 1) % quotes.length)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 300)
    }, 12000)

    return () => clearInterval(interval)
  }, [quotes.length])

  const handleNavigationClick = (index: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveQuote(index)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Quote Content */}
      <div className="self-stretch px-2 overflow-hidden flex justify-start items-center bg-background border border-b border-l-0 border-r-0 border-t-0">
        <div className="flex-1 py-16 md:py-17 flex flex-col md:flex-row justify-center items-end gap-6">
          <div className="self-stretch px-3 md:px-12 justify-center items-start gap-4 flex flex-col md:flex-row">
            {/* Quote Icon */}
            <div className="w-48 h-48 md:w-48 md:h-48 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center transition-all duration-700 ease-in-out flex-shrink-0">
              <svg 
                className={`w-16 h-16 text-[#37322F] transition-all duration-700 ${isTransitioning ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l1.017 2.193c-2.065.906-3.448 3.004-3.448 5.69v4h6v6h-7zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l1 2.193c-2.065.906-3.448 3.004-3.448 5.69v4h6v6h-7z"/>
              </svg>
            </div>
            <div className="flex-1 px-6 py-6 shadow-[0px_0px_0px_0.75px_rgba(50,45,43,0.12)] overflow-hidden flex flex-col justify-start items-start gap-6 shadow-none pb-0 pt-0">
              <div
                className="self-stretch justify-start flex flex-col text-[#49423D] text-2xl md:text-[32px] font-normal leading-10 md:leading-[42px] font-serif h-[200px] md:h-[210px] overflow-hidden line-clamp-5 transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                  transition: "filter 0.7s ease-in-out",
                }}
              >
                "{quotes[activeQuote].quote}"
              </div>
              <div
                className="self-stretch flex flex-col justify-start items-start gap-1 transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                  transition: "filter 0.7s ease-in-out",
                }}
              >
                <div className="self-stretch justify-center flex flex-col text-[rgba(73,66,61,0.70)] text-sm font-medium leading-[26px] font-sans">
                  {quotes[activeQuote].context}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="pr-6 justify-start items-start gap-[14px] flex">
            <button
              onClick={() => handleNavigationClick((activeQuote - 1 + quotes.length) % quotes.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] justify-center items-center gap-2 flex"
            >
              <div className="w-6 h-6 relative overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="#46413E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <button
              onClick={() => handleNavigationClick((activeQuote + 1) % quotes.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] justify-center items-center gap-2 flex"
            >
              <div className="w-6 h-6 relative overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="#46413E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
