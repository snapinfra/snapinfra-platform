import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Get started with Snapinfra. Set up your workspace and create your first backend infrastructure project.",
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

