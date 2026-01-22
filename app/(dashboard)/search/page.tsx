/**
 * Global Search Page
 * 
 * Unified search across contacts, conversations, and messages
 */

'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Users, MessageSquare, Mail } from 'lucide-react'

export default function GlobalSearchPage() {
    const [query, setQuery] = useState('')

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Search"
                    description="Find contacts, conversations, and messages"
                />

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Type to search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 text-lg"
                    />
                </div>

                <Tabs defaultValue="all">
                    <TabsList>
                        <TabsTrigger value="all">All Results</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                        <TabsTrigger value="conversations">Conversations</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {query ? (
                            <div className="space-y-3">
                                <Card>
                                    <CardContent className="flex items-start gap-4 pt-6">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">Ahmed Hassan</p>
                                                <Badge variant="secondary">Contact</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">+971501234567</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Search className="h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Start typing to search</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
