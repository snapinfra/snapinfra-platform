import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Snapinfra account to continue building production-ready backends.",
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

