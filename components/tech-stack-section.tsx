"use client"

export default function TechStackSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>Built on the Best</h2>
        <p className="text-lg text-[#605A57]">Enterprise tech stack your engineers already love</p>
        <p className="text-sm text-[#605A57] mt-2">No proprietary lock-in. Just battle-tested tools.</p>
      </div>
      
      {/* Tech Stack Grid */}
      <div className="bg-white rounded-xl border border-[rgba(55,50,47,0.12)] p-8 md:p-10 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Frontend */}
          <div>
            <h3 className="text-xs font-bold text-[#37322F] mb-6 uppercase tracking-wider">Frontend</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/nextdotjs/37322F" alt="Next.js" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Next.js 15</div>
                  <div className="text-xs text-[#605A57]">React framework</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/typescript/37322F" alt="TypeScript" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">TypeScript</div>
                  <div className="text-xs text-[#605A57]">Type-safe JavaScript</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/tailwindcss/37322F" alt="Tailwind CSS" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Tailwind CSS</div>
                  <div className="text-xs text-[#605A57]">Utility-first CSS</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/react/37322F" alt="React" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">React 18</div>
                  <div className="text-xs text-[#605A57]">UI library</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Backend */}
          <div>
            <h3 className="text-xs font-bold text-[#37322F] mb-6 uppercase tracking-wider">Backend</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/express/37322F" alt="Express.js" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Express.js</div>
                  <div className="text-xs text-[#605A57]">Web framework</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/nodedotjs/37322F" alt="Node.js" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Node.js 18</div>
                  <div className="text-xs text-[#605A57]">Runtime environment</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazonwebservices.svg" alt="AWS CDK" className="w-6 h-6" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(5%) saturate(1000%) hue-rotate(0deg) brightness(95%) contrast(90%)' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">AWS CDK</div>
                  <div className="text-xs text-[#605A57]">Infrastructure as code</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/typescript/37322F" alt="TypeScript" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">TypeScript</div>
                  <div className="text-xs text-[#605A57]">Type-safe backend</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Infrastructure */}
          <div>
            <h3 className="text-xs font-bold text-[#37322F] mb-6 uppercase tracking-wider">Infrastructure</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazonwebservices.svg" alt="AWS" className="w-6 h-6" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(5%) saturate(1000%) hue-rotate(0deg) brightness(95%) contrast(90%)' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">AWS</div>
                  <div className="text-xs text-[#605A57]">Cloud platform</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/docker/37322F" alt="Docker" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Docker</div>
                  <div className="text-xs text-[#605A57]">Containerization</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/terraform/37322F" alt="Terraform" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">Terraform</div>
                  <div className="text-xs text-[#605A57]">IaC tool</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)] flex items-center justify-center flex-shrink-0">
                  <img src="https://cdn.simpleicons.org/postgresql/37322F" alt="PostgreSQL" className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">PostgreSQL</div>
                  <div className="text-xs text-[#605A57]">Database</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Why These Tools */}
      <div className="bg-white rounded-xl p-8 md:p-10 border border-[rgba(55,50,47,0.12)]">
        <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-8 text-center">Why these tools?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">Industry standard</p>
              <p className="text-xs text-[#605A57]">No vendor lock-in</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">Battle-tested at scale</p>
              <p className="text-xs text-[#605A57]">Billions of requests daily</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">Your team knows them</p>
              <p className="text-xs text-[#605A57]">Zero learning curve</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">Huge ecosystem</p>
              <p className="text-xs text-[#605A57]">Thousands of plugins</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">Long-term support</p>
              <p className="text-xs text-[#605A57]">Backed by giants</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#37322F] mb-1 text-sm">99.99% uptime</p>
              <p className="text-xs text-[#605A57]">Production-ready</p>
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
