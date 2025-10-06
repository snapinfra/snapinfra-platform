import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category: string
}

export const shortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    key: 'd',
    metaKey: true,
    ctrlKey: true,
    action: () => window.location.href = '/dashboard',
    description: 'Go to Dashboard',
    category: 'Navigation',
  },
  {
    key: 'p',
    metaKey: true,
    ctrlKey: true,
    action: () => window.location.href = '/projects',
    description: 'Go to Projects',
    category: 'Navigation',
  },
  {
    key: 's',
    metaKey: true,
    ctrlKey: true,
    action: () => window.location.href = '/schema',
    description: 'Go to Schema',
    category: 'Navigation',
  },
  {
    key: 'a',
    metaKey: true,
    ctrlKey: true,
    action: () => window.location.href = '/architecture-demo',
    description: 'Go to Architecture',
    category: 'Navigation',
  },
  // Actions
  {
    key: 'n',
    metaKey: true,
    ctrlKey: true,
    action: () => window.location.href = '/onboarding?new=true',
    description: 'New Project',
    category: 'Actions',
  },
  {
    key: '/',
    action: () => {
      // Focus search input
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
      if (searchInput) searchInput.focus()
    },
    description: 'Focus Search',
    category: 'Actions',
  },
  {
    key: '?',
    shiftKey: true,
    action: () => {
      // Open shortcuts modal
      const event = new CustomEvent('open-shortcuts-modal')
      window.dispatchEvent(event)
    },
    description: 'Show Keyboard Shortcuts',
    category: 'Help',
  },
  {
    key: 'Escape',
    action: () => {
      // Close modals or menus
      const event = new CustomEvent('close-all-modals')
      window.dispatchEvent(event)
    },
    description: 'Close Modals',
    category: 'Navigation',
  },
]

export function useKeyboardShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Allow Escape and some other keys
        if (event.key !== 'Escape' && event.key !== '?') {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const metaOrCtrl = (event.metaKey && shortcut.metaKey) || (event.ctrlKey && shortcut.ctrlKey)
        const matchesModifiers =
          metaOrCtrl &&
          (shortcut.shiftKey ? event.shiftKey : !event.shiftKey) &&
          (shortcut.altKey ? event.altKey : !event.altKey)

        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if ((metaOrCtrl || !shortcut.metaKey) && matchesKey) {
          if (metaOrCtrl || shortcut.key === 'Escape' || shortcut.key === '/' || (shortcut.key === '?' && event.shiftKey)) {
            event.preventDefault()
            shortcut.action()
            break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
