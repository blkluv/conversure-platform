import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  return <DashboardShell session={session}>{children}</DashboardShell>
}
