import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Project",
  description: "View and manage your backend infrastructure project. Monitor deployments, edit schemas, and configure settings.",
}

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

