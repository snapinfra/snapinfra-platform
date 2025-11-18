"use client"

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, Target, Scale, CheckCircle2 } from 'lucide-react'
import type { NodeAIExplanation } from '@/lib/types/architecture'

interface NodeExplanationTooltipProps {
  nodeName: string
  nodeType: string
  explanation: NodeAIExplanation
  onClose: () => void
  nodeRect: DOMRect
}

export function NodeExplanationTooltip({
  nodeName,
  nodeType,
  explanation,
  onClose,
  nodeRect,
}: NodeExplanationTooltipProps) {
  const [mounted, setMounted] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Calculate optimal position (right side of node, or left if not enough space)
  const calculatePosition = () => {
    if (!nodeRect) return { left: '50%', top: '50%' }

    const tooltipWidth = 360
    const gap = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Try to place on the right side first
    let left = nodeRect.right + gap
    let preferRight = true

    // If not enough space on right, place on left
    if (left + tooltipWidth > viewportWidth - 20) {
      left = nodeRect.left - tooltipWidth - gap
      preferRight = false
    }

    // Align top with node top
    let top = nodeRect.top

    // Ensure it doesn't go off screen vertically
    const maxHeight = 450
    if (top + maxHeight > viewportHeight - 20) {
      top = Math.max(20, viewportHeight - maxHeight - 20)
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  }

  if (!mounted) return null

  const position = calculatePosition()

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] w-[360px] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={position}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{nodeName}</h3>
            <span className="text-xs text-gray-500">{nodeType}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
          {/* Why Chosen */}
          <div>
            <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Why This Component?
            </h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation.whyChosen}
            </p>
          </div>

          {/* How It Fits */}
          <div>
            <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              How It Fits
            </h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation.howItFits}
            </p>
          </div>

          {/* Trade-offs */}
          <div>
            <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Trade-offs
            </h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation.tradeoffs}
            </p>
          </div>

          {/* Best Practices */}
          <div>
            <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              Best Practices
            </h5>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explanation.bestPractices}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            AI Generated
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
