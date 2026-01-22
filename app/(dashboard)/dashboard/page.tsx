/**
 * Main Dashboard Page
 * 
 * Overview with stats, recent activity, and quick actions
 */

import { Suspense } from 'react'
import { DashboardLayout } from '@/components/layout'
import { StatsCard, StatsCardSkeleton, PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, MessageSquare, Megaphone, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

async function getStats(companyId: string) {
    const [
        totalContacts,
        activeConversations,
        activeCampaigns,
        todayMessages
    ] = await Promise.all([
        db.lead.count({ where: { companyId } }),
        db.conversation.count({
            where: { companyId, status: { in: ['OPEN', 'PENDING'] } }
        }),
        db.campaign.count({
            where: { companyId, status: { in: ['SENDING', 'SCHEDULED'] } }
        }),
        db.message.count({
            where: {
                conversation: { companyId },
                sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        })
    ])

    return {
        totalContacts,
        activeConversations,
        activeCampaigns,
        todayMessages
    }
}

async function getRecentActivity(companyId: string) {
    const recentConversations = await db.conversation.findMany({
        where: { companyId },
        take: 5,
        orderBy: { lastMessageAt: 'desc' },
        include: {
            lead: { select: { name: true, phone: true } },
            messages: {
                take: 1,
                orderBy: { sentAt: 'desc' },
                select: { body: true, sentAt: true }
            }
        }
    })

    return recentConversations
}

async function DashboardStats() {
    const user = await getCurrentUser()
    if (!user) return null

    const stats = await getStats(user.companyId)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Total Contacts"
                value={stats.totalContacts.toLocaleString()}
                icon={Users}
                description="All contacts in system"
                trend={{ value: 12.5, isPositive: true }}
            />
            <StatsCard
                title="Active Conversations"
                value={stats.activeConversations}
                icon={MessageSquare}
                description="Open and pending"
            />
            <StatsCard
                title="Active Campaigns"
                value={stats.activeCampaigns}
                icon={Megaphone}
                description="Sending or scheduled"
            />
            <StatsCard
                title="Messages Today"
                value={stats.todayMessages}
                icon={TrendingUp}
                description="Sent and received"
                trend={{ value: 8.2, isPositive: true }}
            />
        </div>
    )
}

async function RecentActivity() {
    const user = await getCurrentUser()
    if (!user) return null

    const activity = await getRecentActivity(user.companyId)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>Latest customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activity.map((conversation) => (
                        <Link
                            key={conversation.id}
                            href={`/conversations/${conversation.id}`}
                            className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{conversation.lead?.name || 'Unknown'}</p>
                                    <time className="text-xs text-muted-foreground">
                                        {conversation.messages[0]?.sentAt.toLocaleTimeString()}
                                    </time>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {conversation.messages[0]?.body || 'No messages yet'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {conversation.lead?.phone}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
                <Button variant="outline" className="mt-4 w-full" asChild>
                    <Link href="/conversations">View All Conversations</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default async function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Dashboard"
                    description="Overview of your WhatsApp CRM"
                    actions={
                        <>
                            <Button asChild>
                                <Link href="/campaigns/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Campaign
                                </Link>
                            </Button>
                        </>
                    }
                />

                {/* Stats */}
                <Suspense fallback={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <StatsCardSkeleton key={i} />
                        ))}
                    </div>
                }>
                    <DashboardStats />
                </Suspense>

                {/* Recent Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Suspense fallback={<Card><CardContent className="p-6"><div className="h-64 animate-pulse bg-muted" /></CardContent></Card>}>
                        <RecentActivity />
                    </Suspense>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/contacts/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Contact
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/campaigns/create">
                                    <Megaphone className="mr-2 h-4 w-4" />
                                    Create Campaign
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/agents/new">
                                    <Users className="mr-2 h-4 w-4" />
                                    Add Team Member
                                </Link>
                            </Button>
                            <Button variant="outline" className="justify-start" asChild>
                                <Link href="/settings/canned-responses">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Quick Replies
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
