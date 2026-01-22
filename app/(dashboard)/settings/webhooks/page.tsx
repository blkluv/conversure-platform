/**
 * Webhooks Management Page
 * 
 * Outgoing webhook configuration
 */

'use client'

import { DashboardLayout } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Webhook as WebhookIcon } from 'lucide-react'

const mockWebhooks = [
    { id: '1', name: 'CRM Sync', url: 'https://api.example.com/webhook', events: ['message_created', 'contact_updated'] },
    { id: '2', name: 'Analytics', url: 'https://analytics.example.com/events', events: ['conversation_created'] }
]

export default function WebhooksPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Webhooks"
                    description="Configure outgoing webhooks"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Webhook
                        </Button>
                    }
                />

                <div className="space-y-4">
                    {mockWebhooks.map((webhook) => (
                        <Card key={webhook.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <WebhookIcon className="h-4 w-4" />
                                    {webhook.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Endpoint</p>
                                    <code className="text-sm">{webhook.url}</code>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Events</p>
                                    <div className="flex flex-wrap gap-2">
                                        {webhook.events.map((event) => (
                                            <Badge key={event} variant="outline">{event}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
