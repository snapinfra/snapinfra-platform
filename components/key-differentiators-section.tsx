"use client"

import { Code2, DoorOpen, ShieldCheck, Tag } from 'lucide-react'

export default function KeyDifferentiatorsSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>Why Developers Choose SnapInfra</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Real Code - Large */}
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl p-6 lg:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-[#1d1d1f]">Real Code, Real Control</h3>
          </div>
          <p className="text-sm text-[#605A57] mb-6 leading-relaxed flex-1">
            Generate TypeScript/Python infrastructure that you own. Every resource, every config - inspect it, version it, customize it.
          </p>
          <div className="bg-[#1d1d1f] rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="text-[rgba(255,255,255,0.5)] mb-2">// Your generated API route</div>
            <div className="text-white mb-1"><span className="text-[rgba(255,255,255,0.7)]">export</span> <span className="text-[rgba(255,255,255,0.7)]">const</span> <span className="text-white">createTask</span> = <span className="text-[rgba(255,255,255,0.7)]">async</span> (req) =&gt; &#123;</div>
            <div className="pl-4 text-white mb-1">  <span className="text-[rgba(255,255,255,0.7)]">const</span> task = <span className="text-[rgba(255,255,255,0.7)]">await</span> db.tasks.<span className="text-white">create</span>(&#123;</div>
            <div className="pl-8 text-[rgba(255,255,255,0.8)] mb-1">    userId: req.user.id,</div>
            <div className="pl-8 text-[rgba(255,255,255,0.8)] mb-1">    title: req.body.title</div>
            <div className="pl-4 text-white mb-1">  &#125;);</div>
            <div className="pl-4 text-white">  <span className="text-[rgba(255,255,255,0.7)]">return</span> task;</div>
            <div className="text-white">&#125;</div>
          </div>
        </div>

        {/* Card 2: Exit Strategy - Medium */}
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl p-6 lg:p-8 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center flex-shrink-0">
              <DoorOpen className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-[#1d1d1f]">Exit Strategy Included</h3>
          </div>
          <p className="text-sm text-[#605A57] mb-6 leading-relaxed flex-1">
            Export your entire backend as standard Terraform + Docker Compose. Migrate to AWS, GCP, or your own servers without rewriting a single line.
          </p>
          <div className="bg-[#1d1d1f] rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="text-white mb-2">$ snapinfra export --format terraform</div>
            <div className="text-[rgba(255,255,255,0.7)] mb-3">Exporting...</div>
            <div className="text-white mb-1">✓ main.tf</div>
            <div className="text-white mb-1">✓ variables.tf</div>
            <div className="text-white mb-1">✓ docker-compose.yml</div>
            <div className="text-white mb-1">✓ README.md</div>
            <div className="text-[rgba(255,255,255,0.7)] mt-2">Done! Deploy anywhere.</div>
          </div>
        </div>

        {/* Card 3: No Surprise Bills - Large with pricing */}
        <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl p-6 lg:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-[#1d1d1f]">No $30K Surprise Bills</h3>
          </div>
          <p className="text-sm text-[#605A57] mb-6 leading-relaxed">
            Usage caps prevent Firebase nightmares. See exactly what you'll pay at 10x scale before you deploy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-4 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs text-[#605A57] mb-2">10K users</div>
              <div className="text-2xl font-bold text-[#1d1d1f]">$49/mo</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-4 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs text-[#605A57] mb-2">100K users</div>
              <div className="text-2xl font-bold text-[#1d1d1f]">$99/mo</div>
            </div>
            <div className="bg-[rgba(55,50,47,0.03)] rounded-lg p-4 border border-[rgba(55,50,47,0.08)]">
              <div className="text-xs text-[#605A57] mb-2">1M users</div>
              <div className="text-2xl font-bold text-[#1d1d1f]">$249/mo</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(55,50,47,0.12)]">
            <div className="text-xs text-[#605A57]">
              Compare: Firebase ~$2,847/mo • Supabase ~$419/mo
            </div>
          </div>
        </div>

        {/* Card 4: Benefits List - Small */}
        <div className="md:col-span-2 lg:col-span-1 bg-white rounded-xl p-6 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="space-y-3 text-sm text-[#605A57] flex-1">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>TypeScript type safety</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>Express.js patterns</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>ESLint + Prettier</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>Standard Terraform</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>Docker Compose</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span>Usage caps</span>
            </div>
          </div>
        </div>

        {/* Card 5: Production Ready - Full Width */}
        <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl p-6 lg:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-[#1d1d1f]">Production-Ready From Day One</h3>
          </div>
          <p className="text-sm text-[#605A57] mb-6 leading-relaxed max-w-3xl">
            Transaction support. Full-text search. Row-level security. Automated backups. Everything Supabase charges extra for or "doesn't support yet."
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="space-y-2 text-sm text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>ACID transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Full-text search</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Row-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Point-in-time recovery</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Automated backups</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Real-time subscriptions</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Auto-generated APIs</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Edge Functions</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#605A57]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>File storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
                <span>Authentication</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[rgba(55,50,47,0.12)]">
            <div className="inline-block px-5 py-2.5 bg-[rgba(55,50,47,0.05)] rounded-lg text-sm font-medium text-[#37322F] border border-[rgba(55,50,47,0.08)]">
              Enterprise features, startup pricing
            </div>
          </div>
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
