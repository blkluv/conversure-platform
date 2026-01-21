"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Send,
  LayoutDashboard,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Inbox,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/Logo"

interface Session {
  id: string
  email: string
  fullName: string
  role: string
  companyId: string
}

interface DashboardShellProps {
  session: Session
  children: React.ReactNode
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    description: "Overview & analytics"
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Users,
    description: "CRM & contact management"
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Send,
    description: "WhatsApp automation"
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: Inbox,
    description: "Live conversations"
  },
  {
    name: "Settings",
    href: "/admin/integrations",
    icon: Settings,
    description: "Integrations & config"
  },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function NavItem({
  item,
  isActive,
  onClick
}: {
  item: typeof navigation[0]
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className={cn(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            isActive ? "text-primary-foreground" : ""
          )}>{item.name}</p>
          <p className={cn(
            "text-xs truncate",
            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>{item.description}</p>
        </div>
        {isActive && (
          <ChevronRight className="w-4 h-4 text-primary-foreground/70" />
        )}
      </div>
    </Link>
  )
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <Logo href="/dashboard/admin" variant="full" size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Main Menu
        </p>
        {navigation.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavClick}
          />
        ))}

        {/* Admin Section */}
        {(session.role === "SUPER_ADMIN" || session.role === "COMPANY_ADMIN") && (
          <>
            <div className="pt-6 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                Admin
              </p>
            </div>
            <NavItem
              item={{
                name: "Billing",
                href: "/billing",
                icon: CreditCard,
                description: "Subscription & payments"
              }}
              isActive={pathname === "/billing"}
              onClick={onNavClick}
            />
            {session.role === "SUPER_ADMIN" && (
              <NavItem
                item={{
                  name: "Super Admin",
                  href: "/admin",
                  icon: Shield,
                  description: "System management"
                }}
                isActive={pathname === "/admin" && !pathname.includes("/integrations")}
                onClick={onNavClick}
              />
            )}
          </>
        )}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(session.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{session.email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto border-r bg-card">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Hamburger Menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Mobile Logo */}
          <Logo href="/dashboard/admin" variant="full" size="sm" />

          {/* Mobile User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(session.fullName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{session.fullName}</p>
                  <p className="text-xs text-muted-foreground">{session.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:fixed lg:top-0 lg:left-72 lg:right-0 lg:z-40">
        <div className="flex items-center justify-between h-16 px-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Page Title / Breadcrumb area */}
          <div />

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 pl-3 pr-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(session.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{session.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{session.role.toLowerCase().replace("_", " ")}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/integrations">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {session.role === "SUPER_ADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="w-4 h-4 mr-2" />
                      Super Admin Panel
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="lg:pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
