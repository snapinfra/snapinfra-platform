import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Deployments",
  description: "Monitor and manage your infrastructure deployments across cloud providers.",
}

export default function DeploymentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

