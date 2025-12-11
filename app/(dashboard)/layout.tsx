import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser, destroySession } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  LogOut,
  User,
  Shield,
} from "lucide-react"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Campaigns", href: "/campaigns", icon: Send },
    { name: "Feedback", href: "/feedback", icon: Star },
    { name: "Team", href: "/team", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Admin Panel", href: "/admin", icon: Shield },
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
            <p className="text-muted-foreground text-xs">{session.email}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-end h-16 px-8">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="w-4 h-4" />
                  {session.fullName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                {session.role === "SUPER_ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Admin</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onSelect={async () => {
                    await destroySession()
                    redirect("/login")
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
