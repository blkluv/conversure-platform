/**
 * Automation Rules Page
 * 
 * Workflow automation management
 */

'use client'


import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Zap } from 'lucide-react'
import Link from 'next/link'

const mockRules = [
    {
        id: '1',
        name: 'Auto-assign hot leads',
        description: 'Automatically assign leads with "hot" status to sales team',
        isActive: true,
        triggerEvent: 'lead_created',
        actionCount: 2
    },
    {
        id: '2',
        name: 'Follow-up reminder',
        description: 'Send reminder for leads with no activity in 3 days',
        isActive: false,
        triggerEvent: 'time_based',
        actionCount: 1
    }
]

export default function AutomationRulesPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Automation Rules"
                    description="Automate your workflows"
                    actions={
                        <Button asChild>
                            <Link href="/automation/rules/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Rule
                            </Link>
                        </Button>
                    }
                />

                {mockRules.length > 0 ? (
                    <div className="space-y-4">
                        {mockRules.map((rule) => (
                            <Card key={rule.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                {rule.name}
                                            </CardTitle>
                                            <CardDescription className="mt-1">{rule.description}</CardDescription>
                                        </div>
                                        <Switch checked={rule.isActive} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <Badge variant="outline">{rule.triggerEvent.replace('_', ' ')}</Badge>
                                        <span>•</span>
                                        <span>{rule.actionCount} action{rule.actionCount > 1 ? 's' : ''}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Zap}
                        title="No automation rules"
                        description="Create rules to automate repetitive tasks"
                        action={{ label: 'Create Rule', onClick: () => { } }}
                    />
                )}
            </div>
        
    )
}
