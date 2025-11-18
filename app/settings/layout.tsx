import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Snapinfra account settings, preferences, and team configuration.",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

