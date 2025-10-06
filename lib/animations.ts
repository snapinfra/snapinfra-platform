import { Variants } from 'framer-motion'

// Easing curves - Apple-inspired smooth curves
export const easing = {
  smooth: [0.25, 0.1, 0.25, 1],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  snappy: { type: 'spring', stiffness: 400, damping: 25 },
  bouncy: { type: 'spring', stiffness: 500, damping: 20 },
}

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: easing.smooth } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easing.smooth } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

export const scaleInSpring: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: easing.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

// Slide animations
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    x: 60,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

// Hover and tap animations
export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
}

export const hoverLift = {
  whileHover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
    transition: { duration: 0.2, ease: easing.smooth },
  },
  whileTap: { scale: 0.98 },
}

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    transition: { duration: 0.2 },
  },
}

// Number counter animation
export const counterAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing.smooth },
  },
}

// Skeleton loading animation
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Page transition
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easing.smooth,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: easing.smooth },
  },
}

// Modal/Dialog animations
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: easing.smooth },
  },
}

// Notification/Toast animations
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.8 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: easing.snappy,
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
}

// Collapse/Expand animations
export const collapse: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: easing.smooth },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: easing.smooth },
  },
}

// Shimmer effect for loading states
export const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}
