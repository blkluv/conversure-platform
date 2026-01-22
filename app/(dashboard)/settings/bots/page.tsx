/**
 * Agent Bots Management Page
 * 
 * Chatbot integrations
 */

'use client'

import { DashboardLayout } from '@/components/layout'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Bot } from 'lucide-react'

const mockBots = [
    { id: '1', name: 'Lead Qualifier Bot', botType: 'WEBHOOK', active: true },
    { id: '2', name: 'FAQ Bot', botType: 'DIALOGFLOW', active: false }
]

export default function AgentBotsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Agent Bots"
                    description="Manage chatbot integrations"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Bot
                        </Button>
                    }
                />

                <div className="space-y-4">
                    {mockBots.map((bot) => (
                        <Card key={bot.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2">
                                        <Bot className="h-4 w-4" />
                                        {bot.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{bot.botType}</Badge>
                                        <Badge variant={bot.active ? 'default' : 'secondary'}>
                                            {bot.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
