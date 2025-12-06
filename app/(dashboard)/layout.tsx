import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Send,
  Star,
  Upload,
  LayoutDashboard,
} from "lucide-react"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Conversations", href: "/conversations", icon: MessageSquare },
    { name: "Campaigns", href: "/campaigns", icon: Send },
    { name: "Feedback", href: "/feedback", icon: Star },
    { name: "Contacts", href: "/contacts/upload", icon: Upload },
    { name: "Team", href: "/team", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Settings", href: "/admin/integrations", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Conversure</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start">
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm">
            <p className="font-medium">{session.fullName}</p>
            <p className="text-muted-foreground">{session.email}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
