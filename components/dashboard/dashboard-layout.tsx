"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageSquare, LayoutDashboard, Users, Settings, LogOut, MessageCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: ReactNode
  role: "admin" | "agent"
  companyName: string
}

export function DashboardLayout({ children, role, companyName }: DashboardLayoutProps) {
  const adminNavItems = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/agents", label: "Agents", icon: Users },
    { href: "/dashboard/admin/leads", label: "Leads", icon: MessageCircle },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
    { href: "/compliance", label: "Compliance", icon: FileText },
  ]

  const agentNavItems = [
    { href: "/dashboard/agent", label: "Conversations", icon: MessageCircle },
    { href: "/dashboard/agent/leads", label: "My Leads", icon: Users },
    { href: "/dashboard/agent/profile", label: "Profile", icon: Settings },
  ]

  const navItems = role === "admin" ? adminNavItems : agentNavItems

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-6">
          <Link href={role === "admin" ? "/dashboard/admin" : "/dashboard/agent"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg">Conversure</span>
              <span className="text-xs text-muted-foreground block -mt-1">{companyName}</span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background min-h-[calc(100vh-4rem)] p-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}

function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Redirect to login page
        router.push("/login")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: redirect anyway
      router.push("/login")
    }
  }

  return (
    <Button onClick={handleLogout} variant="ghost" size="sm">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  )
}
