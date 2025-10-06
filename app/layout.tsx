import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AppProvider } from "@/lib/app-context"
import { WorkspaceProvider } from "@/lib/workspace-context"
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
  title: "Snapinfra - AI Backend Builder",
  description: "Build backends that absolutely slap with AI",
  generator: "Snapinfra",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        </head>
        <body className={`font-sans ${geistMono.variable} ${tasaOrbiter.variable} antialiased tracking-tight`}>
          <AppProvider>
            <WorkspaceProvider>
              <Suspense fallback={null}>
                {children}
                <Analytics />
              </Suspense>
            </WorkspaceProvider>
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
