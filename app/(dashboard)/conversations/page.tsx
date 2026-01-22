/**
 * Conversations List Page
 * 
 * Inbox-style conversation list with filters and status management
 */

'use client'

import { useState } from 'react'

import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Conversation = {
    id: string
    leadName: string
    leadPhone: string
    lastMessage: string
    lastMessageAt: Date
    status: 'ACTIVE' | 'PENDING' | 'ARCHIVED'
    unreadCount: number
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

// Mock data - replace with actual server action
const mockConversations: Conversation[] = [
    {
        id: '1',
        leadName: 'Mohammed Ali',
        leadPhone: '+971501234567',
        lastMessage: 'Hi, I\'m interested in the villa you posted',
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 2),
        status: 'ACTIVE',
        unreadCount: 3,
        priority: 'HIGH'
    },
    {
        id: '2',
        leadName: 'Sarah Ahmed',
        leadPhone: '+971509876543',
        lastMessage: 'Thank you for the information',
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 45),
        status: 'PENDING',
        unreadCount: 0
    }
]

export default function ConversationsPage() {
    const router = useRouter()
    const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'pending' | 'ARCHIVED'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredConversations = mockConversations.filter(conv => {
        const matchesFilter = filter === 'all' || conv.status.toLowerCase() === filter
        const matchesSearch = conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.leadPhone.includes(searchQuery)
        return matchesFilter && matchesSearch
    })

    return (
        
            <div className="flex h-full flex-col p-6">
                <PageHeader
                    title="Conversations"
                    description={`${filteredConversations.length} active conversations`}
                />

                {/* Filters */}
                <div className="mt-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="open">
                                Open
                                {mockConversations.filter(c => c.status === 'ACTIVE').length > 0 && (
                                    <Badge className="ml-2" variant="secondary">
                                        {mockConversations.filter(c => c.status === 'ACTIVE').length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="resolved">Resolved</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Conversations List */}
                <div className="mt-6 flex-1 space-y-2">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conversation) => (
                            <Card
                                key={conversation.id}
                                className="cursor-pointer transition-colors hover:bg-accent"
                                onClick={() => router.push(`/conversations/${conversation.id}`)}
                            >
                                <div className="flex items-start gap-4 p-4">
                                    <Avatar>
                                        <AvatarFallback>
                                            {conversation.leadName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{conversation.leadName}</p>
                                                <p className="text-xs text-muted-foreground">{conversation.leadPhone}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {conversation.priority && (
                                                    <Badge variant={
                                                        conversation.priority === 'URGENT' ? 'destructive' :
                                                            conversation.priority === 'HIGH' ? 'default' : 'secondary'
                                                    } className="text-xs">
                                                        {conversation.priority}
                                                    </Badge>
                                                )}
                                                <Badge variant={
                                                    conversation.status === 'ACTIVE' ? 'default' :
                                                        conversation.status === 'ARCHIVED' ? 'secondary' : 'outline'
                                                }>
                                                    {conversation.status === 'ACTIVE' && <MessageSquare className="mr-1 h-3 w-3" />}
                                                    {conversation.status === 'PENDING' && <Clock className="mr-1 h-3 w-3" />}
                                                    {conversation.status === 'ARCHIVED' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                                    {conversation.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {conversation.lastMessage}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(conversation.lastMessageAt).toLocaleTimeString()}
                                            </span>
                                            {conversation.unreadCount > 0 && (
                                                <Badge className="h-5 min-w-5 rounded-full">
                                                    {conversation.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <EmptyState
                            icon={MessageSquare}
                            title="No conversations found"
                            description="Start a conversation or adjust your filters"
                        />
                    )}
                </div>
            </div>
        
    )
}

