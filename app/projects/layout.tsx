import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects",
  description: "View and manage all your backend infrastructure projects. Create, deploy, and monitor your infrastructure.",
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

