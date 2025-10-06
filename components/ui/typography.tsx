import React from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function H1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn('text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl', className)}>
      {children}
    </Component>
  )
}

export function H2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={cn('text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl', className)}>
      {children}
    </Component>
  )
}

export function H3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={cn('text-2xl font-semibold tracking-tight text-gray-900', className)}>
      {children}
    </Component>
  )
}

export function H4({ children, className, as: Component = 'h4' }: TypographyProps) {
  return (
    <Component className={cn('text-xl font-semibold text-gray-900', className)}>
      {children}
    </Component>
  )
}

export function Body({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('text-base leading-relaxed text-gray-700', className)}>
      {children}
    </Component>
  )
}

export function BodySmall({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('text-sm leading-relaxed text-gray-600', className)}>
      {children}
    </Component>
  )
}

export function Caption({ children, className, as: Component = 'span' }: TypographyProps) {
  return (
    <Component className={cn('text-xs text-gray-500', className)}>
      {children}
    </Component>
  )
}

export function Label({ children, className, as: Component = 'label' }: TypographyProps) {
  return (
    <Component className={cn('text-sm font-medium text-gray-700', className)}>
      {children}
    </Component>
  )
}

export function Code({ children, className, as: Component = 'code' }: TypographyProps) {
  return (
    <Component className={cn('rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800', className)}>
      {children}
    </Component>
  )
}

export function Muted({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('text-sm text-gray-500', className)}>
      {children}
    </Component>
  )
}

export function Lead({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn('text-xl text-gray-600 leading-relaxed', className)}>
      {children}
    </Component>
  )
}

export function Quote({ children, className, as: Component = 'blockquote' }: TypographyProps) {
  return (
    <Component className={cn('border-l-4 border-gray-300 pl-4 italic text-gray-700', className)}>
      {children}
    </Component>
  )
}
