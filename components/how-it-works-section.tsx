"use client"

export default function HowItWorksSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>From Platform Vision to Production Backend</h2>
        <p className="text-lg text-[#605A57]">Architecture design + backend implementation in one workflow</p>
      </div>
      
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[#1d1d1f] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              01
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">Define Your Backend Requirements</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                Describe your platform architecture needs. Scale requirements, data patterns, compliance constraints. AI understands system design, not just code syntax.
              </p>
            </div>
          </div>
          
          <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 md:p-6 border border-[rgba(55,50,47,0.08)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Example Architecture Brief</div>
            <div className="text-sm md:text-base text-[#605A57] leading-relaxed">
              "Enterprise B2B SaaS. Multi-tenant architecture with row-level tenant isolation. Event-driven for 10M+ requests/day. RBAC with audit logging. PostgreSQL with read replicas + Redis caching. Stripe integration for usage-based billing. Must be SOC2 compliant."
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
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">AI Architects Your Backend System</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                AI proposes architecture patterns, evaluates trade-offs, implements security boundaries. Not templates. Complete backend systems with enterprise patterns baked in.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Architecture Design</div>
              <div className="text-lg font-bold text-[#1d1d1f] mb-1">Multi-tenant + RBAC</div>
              <div className="text-xs text-[#605A57]">with security boundaries</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Database Design</div>
              <div className="text-lg font-bold text-[#1d1d1f] mb-1">Optimized schema</div>
              <div className="text-xs text-[#605A57]">+ indexes + migrations</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-5 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs font-semibold text-[#37322F] mb-2 uppercase tracking-wider">Production Code</div>
              <div className="text-lg font-bold text-[#1d1d1f] mb-1">TypeScript Backend</div>
              <div className="text-xs text-[#605A57]">+ IaC ready to deploy</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[rgba(55,50,47,0.12)]">
            <div className="flex flex-wrap gap-4 text-xs text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>Event-driven patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>Scalability designed in</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#37322F] flex-shrink-0" />
                <span>Security boundaries enforced</span>
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
              <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-3">Deploy to Your Infrastructure</h3>
              <p className="text-sm text-[#605A57] leading-relaxed mb-4">
                Choose your deployment target. One-click hosted, deploy to your AWS account, or self-hosted with full control.
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
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">Minutes</div>
          <div className="text-xs text-[#605A57]">Architecture to production</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">Enterprise</div>
          <div className="text-xs text-[#605A57]">Patterns built-in</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">Your Cloud</div>
          <div className="text-xs text-[#605A57]">AWS, GCP, or Azure</div>
        </div>
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[rgba(55,50,47,0.12)] text-center">
          <div className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-1.5">Zero</div>
          <div className="text-xs text-[#605A57]">Vendor lock-in</div>
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
