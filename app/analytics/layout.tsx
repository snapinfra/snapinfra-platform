import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track performance metrics, usage statistics, and infrastructure health across your projects.",
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

