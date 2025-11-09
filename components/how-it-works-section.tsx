"use client"

export default function HowItWorksSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>From idea to production in 5 minutes</h2>
        <p className="text-lg text-[#605A57]">Simple enough for solo devs. Powerful enough for unicorns.</p>
      </div>
      
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              01
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">Describe What You Want</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                Just describe your backend in plain English. No JSON schemas. No DSL syntax. No config hell.
              </p>
            </div>
          </div>
          
          <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 md:p-6 border border-[rgba(55,50,47,0.08)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Example Prompt</div>
            <div className="text-sm md:text-base text-[#605A57] leading-relaxed">
              "Build a SaaS backend with user authentication, subscription billing, file uploads to S3, and real-time notifications"
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              02
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">AI Generates Everything</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                Production-ready code, database schemas, and infrastructure. All generated in minutes.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Backend Code</div>
              <div className="text-2xl font-bold text-[#1d1d1f] mb-1 font-mono">109</div>
              <div className="text-xs text-[#605A57]">files generated</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Database Schema</div>
              <div className="text-2xl font-bold text-[#1d1d1f] mb-1 font-mono">4</div>
              <div className="text-xs text-[#605A57]">tables + indexes</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Infrastructure</div>
              <div className="text-2xl font-bold text-[#1d1d1f] mb-1 font-mono">CDK</div>
              <div className="text-xs text-[#605A57]">ready to deploy</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[rgba(55,50,47,0.12)]">
            <div className="flex flex-wrap gap-4 text-xs text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>TypeScript + Express.js</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>Jest tests (80%+ coverage)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>OpenAPI documentation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              03
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">Deploy & Scale</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                Choose your deployment method. One-click hosted, your AWS, or self-hosted.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[rgba(55,50,47,0.05)] rounded-lg p-5 border-2 border-[#1d1d1f]">
              <div className="text-sm font-semibold text-[#1d1d1f] mb-2">One-Click Hosted</div>
              <div className="text-xs text-[#605A57] mb-3">Recommended</div>
              <div className="space-y-1.5 text-xs text-[#605A57]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>30 seconds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Auto-scaling</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Monitoring</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-5 border border-[rgba(55,50,47,0.12)]">
              <div className="text-sm font-semibold text-[#37322F] mb-2">Your AWS</div>
              <div className="text-xs text-[#605A57] mb-3">Full control</div>
              <div className="space-y-1.5 text-xs text-[#605A57]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Your credentials</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Your billing</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-5 border border-[rgba(55,50,47,0.12)]">
              <div className="text-sm font-semibold text-[#37322F] mb-2">Self-Hosted</div>
              <div className="text-xs text-[#605A57] mb-3">Docker Compose</div>
              <div className="space-y-1.5 text-xs text-[#605A57]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>One command</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Your servers</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-5 border border-[rgba(55,50,47,0.12)]">
              <div className="text-sm font-semibold text-[#37322F] mb-2">Export Only</div>
              <div className="text-xs text-[#605A57] mb-3">Full ownership</div>
              <div className="space-y-1.5 text-xs text-[#605A57]">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Terraform</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#37322F]" />
                  <span>Deploy anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">5 min</div>
          <div className="text-xs text-[#605A57]">Time to production</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">109</div>
          <div className="text-xs text-[#605A57]">Files generated</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">30s</div>
          <div className="text-xs text-[#605A57]">Deploy time</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">100%</div>
          <div className="text-xs text-[#605A57]">Code ownership</div>
        </div>
      </div>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
