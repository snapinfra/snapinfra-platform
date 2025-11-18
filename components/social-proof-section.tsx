"use client"

export default function SocialProofSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>The Backend Architecture Expertise Gap</h2>
        <p className="text-lg text-[#605A57]">Strategic decisions that determine if your backend scales</p>
      </div>
      
      {/* Problem Statement - More Impactful */}
      <div className="bg-[#1d1d1f] rounded-xl p-8 md:p-10 mb-12 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-semibold text-white/70 mb-4 uppercase tracking-wider">The Real Problem</div>
          <p className="text-lg md:text-xl text-white leading-relaxed mb-4">
            Every startup needs <span className="font-semibold">senior backend architecture expertise</span> to make the right scaling, multi-tenancy, and data modeling decisions. But hiring a $300K+ solutions architect isn't an option.
          </p>
          <p className="text-base md:text-lg text-white/90 leading-relaxed">
            Junior developers build backends that don't scale. Senior architects are expensive and scarce. <span className="font-semibold">SnapInfra is your AI backend architect</span> that proposes patterns, evaluates trade-offs, and implements production code.
          </p>
        </div>
      </div>
      
      {/* Use Cases - More Impactful */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Use Case 1 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Architecture Challenge</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">Multi-Tenant Data Isolation</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            Need row-level tenant isolation for B2B SaaS but unsure about performance trade-offs. Schema-per-tenant vs shared schema with RLS?
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">AI Architect Solution</div>
            <div className="space-y-2">
              <div className="text-xs text-[#605A57]">✓ Proposed shared schema + RLS</div>
              <div className="text-xs text-[#605A57]">✓ Implemented tenant_id indexes</div>
              <div className="text-xs text-[#605A57]">✓ Production-ready in 2 hours</div>
            </div>
          </div>
        </div>
        
        {/* Use Case 2 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Architecture Challenge</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">Event-Driven at Scale</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            Need async processing for 10M+ daily events but unclear on event sourcing vs message queues. What's the right pattern for our scale?
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">AI Architect Solution</div>
            <div className="space-y-2">
              <div className="text-xs text-[#605A57]">✓ Proposed SQS + dead letter queues</div>
              <div className="text-xs text-[#605A57]">✓ Designed retry logic + idempotency</div>
              <div className="text-xs text-[#605A57]">✓ Handles 50M events/day</div>
            </div>
          </div>
        </div>
        
        {/* Use Case 3 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Architecture Challenge</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">Database Scaling Strategy</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            PostgreSQL hitting limits at 100K users. Read replicas? Sharding? Caching strategy? Need architect-level guidance on what scales.
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">AI Architect Solution</div>
            <div className="space-y-2">
              <div className="text-xs text-[#605A57]">✓ Proposed read replicas + Redis</div>
              <div className="text-xs text-[#605A57]">✓ Query optimization + indexes</div>
              <div className="text-xs text-[#605A57]">✓ Scaled to 5M users</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Metrics - More Impactful */}
      <div className="bg-white rounded-xl border border-[rgba(55,50,47,0.12)] p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">$300K</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">architect cost saved</div>
            <div className="text-xs text-[#605A57]">vs hiring senior solutions architect</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">10+ years</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">experience encoded</div>
            <div className="text-xs text-[#605A57]">Enterprise patterns & best practices</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">100%</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">code ownership</div>
            <div className="text-xs text-[#605A57]">Your architecture, your infrastructure</div>
          </div>
        </div>
      </div>
    </div>
  )
}
