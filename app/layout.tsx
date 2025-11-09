import type React from "react"
import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AppProvider } from "@/lib/app-context"
import { WorkspaceProvider } from "@/lib/workspace-context"
import { EnterpriseQueryProvider, NetworkStatusMonitor } from "./providers-enterprise"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"
import { Code2 } from "lucide-react"
import "./globals.css"

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const tasaOrbiter = localFont({
  src: [
    {
      path: '../fonts/TASA Orbiter/otf (static)/TASAOrbiterDisplay-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/TASA Orbiter/otf (static)/TASAOrbiterDisplay-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/TASA Orbiter/otf (static)/TASAOrbiterDisplay-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/TASA Orbiter/otf (static)/TASAOrbiterDisplay-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/TASA Orbiter/otf (static)/TASAOrbiterDisplay-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-tasa-orbiter'
})

export const metadata: Metadata = {
  title: {
    default: "Snapinfra - Enterprise Backend Infrastructure in One Prompt",
    template: "%s | Snapinfra"
  },
  description: "Generate production-ready backend infrastructure with AI. Multi-tenant architecture, database schemas, API layers, and security built-in. Deploy to AWS, GCP, or Azure in minutes.",
  keywords: [
    "AI backend generator",
    "infrastructure as code",
    "backend as a service",
    "multi-tenant architecture",
    "API generator",
    "database schema generator",
    "AWS CDK",
    "Terraform",
    "TypeScript backend",
    "enterprise backend",
    "production-ready infrastructure",
    "cloud infrastructure",
    "backend automation",
    "infrastructure automation"
  ],
  authors: [{ name: "Snapinfra" }],
  creator: "Snapinfra",
  publisher: "Snapinfra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://snapinfra.com"),
  alternates: {
    canonical: "/",
  },
  other: {
    "llms.txt": "/llms.txt",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/snap-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://snapinfra.com",
    siteName: "Snapinfra",
    title: "Snapinfra - Enterprise Backend Infrastructure in One Prompt",
    description: "Generate production-ready backend infrastructure with AI. Multi-tenant architecture, database schemas, API layers, and security built-in. Deploy to AWS, GCP, or Azure in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Snapinfra - Enterprise Backend Infrastructure Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snapinfra - Enterprise Backend Infrastructure in One Prompt",
    description: "Generate production-ready backend infrastructure with AI. Multi-tenant architecture, database schemas, API layers, and security built-in.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined
      }}
    >
      <html lang="en" className="overflow-x-hidden">
        <body className={`font-sans ${geistMono.variable} ${tasaOrbiter.variable} antialiased tracking-tight`}>
          <ErrorBoundary>
            <EnterpriseQueryProvider>
              <AppProvider>
                <WorkspaceProvider>
                  <Suspense fallback={null}>
                    {children}
                    <Analytics />
                    <NetworkStatusMonitor />
                    <Toaster richColors position="top-right" />
                  </Suspense>
                </WorkspaceProvider>
              </AppProvider>
            </EnterpriseQueryProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
