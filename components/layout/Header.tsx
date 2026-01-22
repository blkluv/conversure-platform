/**
 * Modern Header Component
 * 
 * Top navigation bar with search, notifications, and user menu
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Search,
    Bell,
    Settings,
    LogOut,
    User,
    HelpCircle,
    Moon,
    Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTheme } from 'next-themes'

interface HeaderProps {
    user?: {
        fullName: string
        email: string
        role: string
        avatarUrl?: string
    }
}

export function Header({ user }: HeaderProps) {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    // Mock notifications
    const notifications = [
        {
            id: '1',
            title: 'New conversation assigned',
            message: 'Mohammed Ali started a new conversation',
            time: '2 minutes ago',
            read: false
        },
        {
            id: '2',
            title: 'Campaign sent successfully',
            message: 'Villa Launch campaign has been sent to 150 contacts',
            time: '1 hour ago',
            read: false
        },
        {
            id: '3',
            title: 'New team member added',
            message: 'Sarah Ahmed joined your team',
            time: '3 hours ago',
            read: true
        }
    ]

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts, conversations, campaigns..."
                            className="pl-9"
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                        />
                        {searchOpen && (
                            <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-4 shadow-lg">
                                <div className="text-sm text-muted-foreground">
                                    Start typing to search...
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Help */}
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/docs">
                            <HelpCircle className="h-5 w-5" />
                        </Link>
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <Badge variant="secondary">{unreadCount} new</Badge>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="max-h-[400px]">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="flex gap-3 border-b p-3 last:border-0 hover:bg-accent"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-start gap-2">
                                                <p className="font-medium text-sm">
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <Badge className="h-2 w-2 rounded-full p-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {notification.message}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {notification.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/notifications" className="w-full text-center cursor-pointer">
                                    View all notifications
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                                    <AvatarFallback>
                                        {user?.fullName
                                            ?.split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden text-left md:block">
                                    <p className="text-sm font-medium">{user?.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div>
                                    <p className="font-medium">{user?.fullName}</p>
                                    <p className="text-xs font-normal text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => router.push('/api/auth/signout')}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
