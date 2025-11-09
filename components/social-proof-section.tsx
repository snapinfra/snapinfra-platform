"use client"

export default function SocialProofSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>Built for Real-World Problems</h2>
        <p className="text-lg text-[#605A57]">The challenges developers face every day</p>
      </div>
      
      {/* Problem Statement - More Impactful */}
      <div className="bg-[#1d1d1f] rounded-xl p-8 md:p-10 mb-12 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-semibold text-white/70 mb-4 uppercase tracking-wider">The Problem We Solve</div>
          <p className="text-lg md:text-xl text-white leading-relaxed mb-4">
            After migrating from Firebase (surprise costs) to Supabase (missing transactions) to raw Terraform (6-month learning curve), we asked: <span className="font-semibold">why doesn't the 'just right' solution exist?</span>
          </p>
          <p className="text-base md:text-lg text-white/90 leading-relaxed">
            We're not trying to replace Firebase for todo apps or Kubernetes for Netflix. We're for the 99% in between—teams building real products who need production-grade infrastructure without becoming DevOps experts.
          </p>
        </div>
      </div>
      
      {/* Use Cases - More Impactful */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Use Case 1 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Use Case</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">PostgreSQL Transactions</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            Need ACID transactions but Supabase doesn't support them. Building custom infrastructure would take months.
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Outcome</div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#1d1d1f]">3 months</span>
                <span className="text-xs text-[#605A57]">→</span>
                <span className="text-lg font-bold text-[#1d1d1f]">4 hours</span>
              </div>
              <div className="text-xs text-[#605A57]">MVP launched same day</div>
              <div className="text-xs text-[#605A57]">Scales without rewrites</div>
            </div>
          </div>
        </div>
        
        {/* Use Case 2 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Use Case</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">Cost Predictability</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            Firebase's pay-per-read model becomes unsustainable at scale. Predictable costs with usage caps prevent surprise bills.
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Outcome</div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#1d1d1f]">$800/mo</span>
                <span className="text-xs text-[#605A57]">→</span>
                <span className="text-lg font-bold text-[#1d1d1f]">$99/mo</span>
              </div>
              <div className="text-xs text-[#605A57]">Predictable scaling costs</div>
              <div className="text-xs text-[#605A57]">Profitable from day one</div>
            </div>
          </div>
        </div>
        
        {/* Use Case 3 */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="mb-5">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Use Case</div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">Self-Hosted Compliance</h3>
          </div>
          
          <p className="text-sm text-[#605A57] leading-relaxed mb-6 flex-1">
            Need self-hosted for HIPAA/SOC 2 compliance but don't want to become a DevOps shop. One-command deploy.
          </p>
          
          <div className="pt-5 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs font-semibold text-[#37322F] mb-3 uppercase tracking-wider">Outcome</div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#1d1d1f]">SOC 2 + HIPAA compliant</div>
              <div className="text-xs text-[#605A57]">Zero DevOps overhead</div>
              <div className="text-xs text-[#605A57]">Audit-ready infrastructure</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Metrics - More Impactful */}
      <div className="bg-white rounded-xl border border-[rgba(55,50,47,0.12)] p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">95%</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">faster</div>
            <div className="text-xs text-[#605A57]">Time to market vs Terraform</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">100%</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">code ownership</div>
            <div className="text-xs text-[#605A57]">Full source export included</div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-[#1d1d1f] mb-3">$0</div>
            <div className="text-base font-semibold text-[#37322F] mb-1">vendor lock-in</div>
            <div className="text-xs text-[#605A57]">Deploy anywhere, anytime</div>
          </div>
        </div>
      </div>
    </div>
  )
}
