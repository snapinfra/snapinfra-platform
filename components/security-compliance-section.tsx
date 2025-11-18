"use client"

import { Shield, Lock, FileCheck, Key, Eye, AlertTriangle } from 'lucide-react'

export default function SecurityComplianceSection() {
  return (
    <div className="w-full max-w-[1100px] mt-32 px-4">
      <div className="text-center mb-16">
        <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-normal leading-[0.95] font-serif text-[#1d1d1f] mb-4" style={{ letterSpacing: '-0.02em' }}>Built secure. Stays secure.</h2>
        <p className="text-lg text-[#605A57]">SOC 2, HIPAA, GDPR compliant from day one</p>
      </div>
      
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Security Features - Large Card (2x2) */}
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f]">Security Features</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">Encryption at rest (AES-256)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">Encryption in transit (TLS 1.3)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">Row-level security (PostgreSQL RLS)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">API key rotation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">IP allowlisting</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">DDoS protection (CloudFlare)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">Automated security updates</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">Penetration testing (quarterly)</span>
            </div>
          </div>
        </div>

        {/* Compliance - Medium Card (1x2) */}
        <div className="md:col-span-1 lg:col-span-1 bg-white rounded-xl p-6 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f]">Compliance</h3>
          </div>
          
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">SOC 2 Type II certified</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">HIPAA compliant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">GDPR compliant</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#37322F] flex-shrink-0" />
              <span className="text-sm text-[#605A57]">ISO 27001 in progress</span>
            </div>
          </div>
        </div>

        {/* Audit Trail - Small Card (1x1) */}
        <div className="md:col-span-1 lg:col-span-1 bg-white rounded-xl p-6 border border-[rgba(55,50,47,0.12)] flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(55,50,47,0.05)] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-[#37322F]" />
            </div>
            <h3 className="text-lg font-bold text-[#1d1d1f]">Audit Trail</h3>
          </div>
          
          <p className="text-sm text-[#605A57] mb-4 flex-1">
            Every action logged. Full compliance reports.
          </p>
          
          <button className="text-sm text-[#37322F] font-medium text-left">
            View sample audit log →
          </button>
        </div>

        {/* Key Features - Small Cards */}
        <div className="md:col-span-1 lg:col-span-1 bg-[rgba(55,50,47,0.03)] rounded-xl p-6 border border-[rgba(55,50,47,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
            <Key className="w-5 h-5 text-[#37322F]" />
          </div>
          <h4 className="text-base font-semibold text-[#1d1d1f] mb-2">API Security</h4>
          <p className="text-xs text-[#605A57]">Rotating keys, IP allowlisting, and rate limiting</p>
        </div>

        <div className="md:col-span-1 lg:col-span-1 bg-[rgba(55,50,47,0.03)] rounded-xl p-6 border border-[rgba(55,50,47,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
            <Eye className="w-5 h-5 text-[#37322F]" />
          </div>
          <h4 className="text-base font-semibold text-[#1d1d1f] mb-2">Monitoring</h4>
          <p className="text-xs text-[#605A57]">24/7 security monitoring and alerting</p>
        </div>

        <div className="md:col-span-1 lg:col-span-1 bg-[rgba(55,50,47,0.03)] rounded-xl p-6 border border-[rgba(55,50,47,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-[#37322F]" />
          </div>
          <h4 className="text-base font-semibold text-[#1d1d1f] mb-2">Incident Response</h4>
          <p className="text-xs text-[#605A57]">Automated threat detection and response</p>
        </div>

        <div className="md:col-span-1 lg:col-span-1 bg-[rgba(55,50,47,0.03)] rounded-xl p-6 border border-[rgba(55,50,47,0.08)]">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-[#37322F]" />
          </div>
          <h4 className="text-base font-semibold text-[#1d1d1f] mb-2">Data Protection</h4>
          <p className="text-xs text-[#605A57]">End-to-end encryption and backups</p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white rounded-xl p-6 md:p-8 border border-[rgba(55,50,47,0.12)]">
        <div className="flex flex-wrap gap-4 justify-center items-center mb-4">
          <div className="px-6 py-3 bg-[rgba(55,50,47,0.03)] rounded-lg border border-[rgba(55,50,47,0.08)]">
            <span className="text-sm font-semibold text-[#37322F]">SOC 2 Type II</span>
          </div>
          <div className="px-6 py-3 bg-[rgba(55,50,47,0.03)] rounded-lg border border-[rgba(55,50,47,0.08)]">
            <span className="text-sm font-semibold text-[#37322F]">HIPAA</span>
          </div>
          <div className="px-6 py-3 bg-[rgba(55,50,47,0.03)] rounded-lg border border-[rgba(55,50,47,0.08)]">
            <span className="text-sm font-semibold text-[#37322F]">GDPR</span>
          </div>
          <div className="px-6 py-3 bg-[rgba(55,50,47,0.03)] rounded-lg border border-[rgba(55,50,47,0.08)]">
            <span className="text-sm font-semibold text-[#37322F]">ISO 27001</span>
          </div>
        </div>
        
        <p className="text-center text-sm text-[#605A57]">
          Trusted by healthcare, fintech, and government organizations
        </p>
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
