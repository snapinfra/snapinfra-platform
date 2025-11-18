import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Snapinfra account and start building production-ready backend infrastructure in minutes.",
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

