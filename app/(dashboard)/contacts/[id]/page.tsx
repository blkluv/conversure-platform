/**
 * Contact Detail Page
 * 
 * Full contact profile with conversations, notes, and actions
 */

import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Edit, Mail, Phone, MapPin, Calendar, MessageSquare, Tag } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: { id: string }
}

async function getContact(id: string, companyId: string) {
    const contact = await db.lead.findFirst({
        where: { id, companyId },
        include: {
            conversations: {
                orderBy: { lastMessageAt: 'desc' },
                take: 5,
                include: {
                    messages: {
                        take: 1,
                        orderBy: { sentAt: 'desc' }
                    }
                }
            }
        }
    })

    return contact
}

export default async function ContactDetailPage({ params }: PageProps) {
    const user = await getCurrentUser()
    if (!user) return null

    const contact = await getContact(params.id, user.companyId)
    if (!contact) notFound()

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title={contact.name || 'Unnamed Contact'}
                    description={`Contact ID: ${contact.id}`}
                    actions={
                        <Button asChild>
                            <Link href={`/contacts/${contact.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Contact
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column - Contact Info */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-24 w-24">
                                        <AvatarFallback className="text-2xl">
                                            {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-4 text-xl font-semibold">{contact.name || 'Unnamed'}</h3>
                                </div>

                                <div className="mt-6 space-y-3">
                                    {contact.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                                {contact.email}
                                            </a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                                                {contact.phone}
                                            </a>
                                        </div>
                                    )}
                                    {contact.location && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{contact.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {contact.source && (
                                        <Badge variant="outline">
                                            <Tag className="mr-1 h-3 w-3" />
                                            {contact.source}
                                        </Badge>
                                    )}
                                    <Button variant="outline" size="sm">
                                        + Add Tag
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Custom Fields */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Custom Fields</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    {contact.budget && (
                                        <div>
                                            <span className="font-medium">Budget:</span>
                                            <span className="ml-2 text-muted-foreground">{contact.budget}</span>
                                        </div>
                                    )}
                                    {contact.propertyType && (
                                        <div>
                                            <span className="font-medium">Property Type:</span>
                                            <span className="ml-2 text-muted-foreground">{contact.propertyType}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Activity */}
                    <div className="md:col-span-2">
                        <Tabs defaultValue="conversations" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="conversations">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Conversations
                                </TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                            </TabsList>

                            <TabsContent value="conversations" className="space-y-4">
                                {contact.conversations.length > 0 ? (
                                    contact.conversations.map((conversation) => (
                                        <Card key={conversation.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            Conversation #{conversation.id.slice(0, 8)}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Last message: {conversation.lastMessageAt?.toLocaleString()}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={
                                                        conversation.status === 'OPEN' ? 'default' :
                                                            conversation.status === 'RESOLVED' ? 'secondary' : 'outline'
                                                    }>
                                                        {conversation.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {conversation.messages[0] && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {conversation.messages[0].body}
                                                    </p>
                                                )}
                                                <Button variant="outline" size="sm" className="mt-3" asChild>
                                                    <Link href={`/conversations/${conversation.id}`}>
                                                        View Conversation
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <MessageSquare className="h-12 w-12 text-muted-foreground" />
                                            <p className="mt-4 text-sm text-muted-foreground">No conversations yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="activity">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Activity Timeline</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Contact created</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(contact.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Add more activity items here */}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notes">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Notes</CardTitle>
                                        <CardDescription>Add notes about this contact</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button>Add Note</Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
