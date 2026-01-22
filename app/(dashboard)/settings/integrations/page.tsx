/**
 * OAuth Integrations Page
 * 
 * Connect Google, Microsoft accounts
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle2, XCircle } from 'lucide-react'

const integrations = [
    { id: 'google', name: 'Google', icon: Mail, connected: false, description: 'Connect Gmail for email integration' },
    { id: 'microsoft', name: 'Microsoft', icon: Mail, connected: false, description: 'Connect Outlook for email integration' }
]

export default function IntegrationsPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Integrations"
                    description="Connect third-party services"
                />

                <div className="grid gap-4 md:grid-cols-2">
                    {integrations.map((integration) => (
                        <Card key={integration.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <integration.icon className="h-5 w-5" />
                                    {integration.name}
                                </CardTitle>
                                <CardDescription>{integration.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    {integration.connected ? (
                                        <>
                                            <Badge variant="default" className="gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Connected
                                            </Badge>
                                            <Button variant="outline" size="sm">Disconnect</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Badge variant="secondary" className="gap-1">
                                                <XCircle className="h-3 w-3" />
                                                Not Connected
                                            </Badge>
                                            <Button size="sm">Connect</Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        
    )
}
