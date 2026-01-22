/**
 * Conversation Thread Page
 * 
 * WhatsApp-style chat interface with message thread and actions
 */

import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ArrowLeft, Send, MoreVertical, User, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: { id: string }
}

async function getConversation(id: string, companyId: string) {
    const conversation = await db.conversation.findFirst({
        where: { id, companyId },
        include: {
            lead: true,
            messages: {
                orderBy: { sentAt: 'asc' },
                include: {
                    sender: { select: { fullName: true } }
                }
            }
        }
    })

    return conversation
}

export default async function ConversationThreadPage({ params }: PageProps) {
    const user = await getCurrentUser()
    if (!user) return null

    const conversation = await getConversation(params.id, user.companyId)
    if (!conversation) notFound()

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-4rem)] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-card px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" as Child>
                            <Link href="/conversations">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        <Avatar>
                            <AvatarFallback>
                                {conversation.lead?.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <h2 className="font-semibold">{conversation.lead?.name || 'Unknown'}</h2>
                            <p className="text-sm text-muted-foreground">{conversation.lead?.phone}</p>
                        </div>

                        <Badge variant={
                            conversation.status === 'OPEN' ? 'default' :
                                conversation.status === 'RESOLVED' ? 'secondary' : 'outline'
                        }>
                            {conversation.status}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {conversation.lead && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/contacts/${conversation.lead.id}`}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Profile
                                </Link>
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Assign to Agent</DropdownMenuItem>
                                <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                                <DropdownMenuItem>Set Priority</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Close Conversation</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
                    <div className="mx-auto max-w-4xl space-y-4">
                        {conversation.messages.map((message) => {
                            const isIncoming = message.messageType === 'INCOMING'

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[70%] space-y-1`}>
                                        <Card className={`${isIncoming
                                                ? 'bg-card'
                                                : 'bg-primary text-primary-foreground'
                                            }`}>
                                            <div className="p-3">
                                                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                                            </div>
                                        </Card>
                                        <div className={`flex items-center gap-2 px-2 text-xs text-muted-foreground ${!isIncoming && 'justify-end'
                                            }`}>
                                            <span>{new Date(message.sentAt).toLocaleTimeString()}</span>
                                            {!isIncoming && message.sender && (
                                                <span>• {message.sender.fullName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Input */}
                <div className="border-t bg-card p-4">
                    <div className="mx-auto flex max-w-4xl items-center gap-2">
                        <Input
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l bg-card p-6">
                    <h3 className="font-semibold">Contact Information</h3>
                    <div className="mt-4 space-y-3">
                        {conversation.lead?.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{conversation.lead.email}</span>
                            </div>
                        )}
                        {conversation.lead?.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{conversation.lead.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
