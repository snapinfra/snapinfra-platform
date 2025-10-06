"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { scaleInSpring, fadeInUp } from '@/lib/animations'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <motion.div
        variants={scaleInSpring}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100"
      >
        <Icon className="h-10 w-10 text-gray-400" />
      </motion.div>
      
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mb-8 max-w-md text-sm text-gray-600 leading-relaxed">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
