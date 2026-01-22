/**
 * Notifications Inbox Page
 * 
 * User notifications center
 */

'use client'

import { DashboardLayout } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck } from 'lucide-react'

const mockNotifications = [
    { id: '1', title: 'New conversation assigned', message: 'You have a new conversation from Mohammed Ali', readAt: null, createdAt: new Date(Date.now() - 1000 * 60 * 5) },
    { id: '2', title: 'Campaign sent', message: 'Your campaign "Villa Launch" was sent successfully', readAt: new Date(), createdAt: new Date(Date.now() - 1000 * 60 * 60) }
]

export default function NotificationsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Notifications"
                    description={`${mockNotifications.filter(n => !n.readAt).length} unread`}
                    actions={
                        <Button variant="outline">
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark All Read
                        </Button>
                    }
                />

                <div className="space-y-2">
                    {mockNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`cursor-pointer p-4 transition-colors hover:bg-accent ${!notification.readAt ? 'border-l-4 border-l-primary' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Bell className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                        </div>
                                        {!notification.readAt && (
                                            <Badge className="ml-2">New</Badge>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {notification.createdAt.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
