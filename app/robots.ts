import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snapinfra.com'

  return {
    rules: [
      // Allow AI crawlers full access to public content
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/projects/', '/settings/', '/analytics/', '/deployments/', '/onboarding/', '/auth-callback/', '/test-*/', '/pitchdeck/'],
      },
      // Default rules for other crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/projects/',
          '/settings/',
          '/analytics/',
          '/deployments/',
          '/onboarding/',
          '/auth-callback/',
          '/test-*/',
          '/pitchdeck/',
        ],
      },
      {
        userAgent: '*',
        allow: ['/sign-in', '/sign-up'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

