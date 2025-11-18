import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Snapinfra - Enterprise Backend Infrastructure Generator',
    short_name: 'Snapinfra',
    description: 'Generate production-ready backend infrastructure with AI. Multi-tenant architecture, database schemas, API layers, and security built-in.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#1d1d1f',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/snap-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

