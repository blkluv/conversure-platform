/**
 * Modern Sidebar Navigation Component
 * 
 * Collapsible sidebar with modern design, icons, and nested navigation
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Megaphone,
    UserCog,
    Users as UsersIcon,
    Tag,
    MessageCircle,
    Workflow,
    Command,
    Search as SearchIcon,
    ThumbsUp,
    Settings,
    BookOpen,
    Bot,
    Webhook,
    Clock,
    Database,
    Bell,
    ChevronLeft,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface NavItem {
    title: string
    href?: string
    icon: React.ComponentType<{ className?: string }>
    badge?: number
    children?: NavItem[]
}

const navigation: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: 'Contacts',
        href: '/contacts',
        icon: Users
    },
    {
        title: 'Conversations',
        href: '/conversations',
        icon: MessageSquare,
        badge: 12 // Example unread count
    },
    {
        title: 'Campaigns',
        href: '/campaigns',
        icon: Megaphone
    },
    {
        title: 'Team',
        icon: UsersIcon,
        children: [
            { title: 'Agents', href: '/agents', icon: UserCog },
            { title: 'Teams', href: '/teams', icon: UsersIcon }
        ]
    },
    {
        title: 'Automation',
        icon: Workflow,
        children: [
            { title: 'Rules', href: '/automation/rules', icon: Workflow },
            { title: 'Macros', href: '/automation/macros', icon: Command }
        ]
    },
    {
        title: 'Knowledge Base',
        href: '/knowledge-base',
        icon: BookOpen
    },
    {
        title: 'Analytics',
        icon: ThumbsUp,
        children: [
            { title: 'Search', href: '/search', icon: SearchIcon },
            { title: 'CSAT', href: '/csat', icon: ThumbsUp }
        ]
    },
    {
        title: 'Settings',
        icon: Settings,
        children: [
            { title: 'Quick Replies', href: '/settings/canned-responses', icon: MessageCircle },
            { title: 'Labels', href: '/settings/labels', icon: Tag },
            { title: 'Integrations', href: '/settings/integrations', icon: Webhook },
            { title: 'Agent Bots', href: '/settings/bots', icon: Bot },
            { title: 'Webhooks', href: '/settings/webhooks', icon: Webhook },
            { title: 'Working Hours', href: '/settings/working-hours', icon: Clock },
            { title: 'Custom Attributes', href: '/settings/custom-attributes', icon: Database },
            { title: 'Company', href: '/settings/company', icon: Settings }
        ]
    }
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const pathname = usePathname()

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        )
    }

    return (
        <div
            className={cn(
                'flex h-screen flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <MessageSquare className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-semibold">Conversure</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn('h-8 w-8', collapsed && 'mx-auto')}
                >
                    <ChevronLeft
                        className={cn(
                            'h-4 w-4 transition-transform',
                            collapsed && 'rotate-180'
                        )}
                    />
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {navigation.map((item) => (
                        <NavItemComponent
                            key={item.title}
                            item={item}
                            collapsed={collapsed}
                            pathname={pathname}
                            expandedItems={expandedItems}
                            toggleExpanded={toggleExpanded}
                        />
                    ))}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4">
                {!collapsed ? (
                    <div className="text-xs text-muted-foreground">
                        <div className="font-medium">v2.0.0</div>
                        <div>Pro Plan • 25/50 Agents</div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Badge variant="outline" className="h-2 w-2 rounded-full p-0" />
                    </div>
                )}
            </div>
        </div>
    )
}

function NavItemComponent({
    item,
    collapsed,
    pathname,
    expandedItems,
    toggleExpanded,
    depth = 0
}: {
    item: NavItem
    collapsed: boolean
    pathname: string
    expandedItems: string[]
    toggleExpanded: (title: string) => void
    depth?: number
}) {
    const Icon = item.icon
    const isActive = item.href === pathname
    const isExpanded = expandedItems.includes(item.title)
    const hasChildren = item.children && item.children.length > 0

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                    </div>
                    {!collapsed && (
                        <ChevronRight
                            className={cn(
                                'h-4 w-4 shrink-0 transition-transform',
                                isExpanded && 'rotate-90'
                            )}
                        />
                    )}
                </button>
                {!collapsed && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-4">
                        {item.children?.map((child) => (
                            <NavItemComponent
                                key={child.title}
                                item={child}
                                collapsed={collapsed}
                                pathname={pathname}
                                expandedItems={expandedItems}
                                toggleExpanded={toggleExpanded}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Link
            href={item.href || '#'}
            className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
                collapsed && 'justify-center px-2'
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
            </div>
            {!collapsed && item.badge && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {item.badge}
                </Badge>
            )}
        </Link>
    )
}
