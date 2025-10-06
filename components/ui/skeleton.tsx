"use client"

import React from 'react'
import { motion } from 'framer-motion'
 import { cn } from '@/lib/utils'
import { shimmer } from '@/lib/animations'

interface SkeletonProps extends React.ComponentProps<'div'> {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'button'
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-lg',
    text: 'h-4 w-3/4 rounded',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-md',
  }

  return (
    <motion.div
      {...shimmer}
      data-slot="skeleton"
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        variantClasses[variant],
        className
      )}
      style={{ backgroundSize: '200% 100%' }}
      {...props}
    />
  )
}

// Pre-built skeleton components for common patterns
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circle" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <Skeleton variant="card" className="h-24" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

function SkeletonStat() {
  return (
    <div className="rounded-lg border border-gray-200 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 border-b border-gray-100 pb-3">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStat, SkeletonList }
