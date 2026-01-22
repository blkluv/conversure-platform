/**
 * Custom Attributes Page
 * 
 * Dynamic field definitions for contacts/conversations
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Database } from 'lucide-react'

const mockAttributes = {
    contact: [
        { id: '1', key: 'budget', displayName: 'Budget', displayType: 'NUMBER', required: false },
        { id: '2', key: 'property_type', displayName: 'Property Type', displayType: 'LIST', required: true }
    ],
    conversation: [
        { id: '3', key: 'lead_score', displayName: 'Lead Score', displayType: 'NUMBER', required: false }
    ]
}

export default function CustomAttributesPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Custom Attributes"
                    description="Define custom fields for your data"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Attribute
                        </Button>
                    }
                />

                <Tabs defaultValue="contact">
                    <TabsList>
                        <TabsTrigger value="contact">Contact Attributes</TabsTrigger>
                        <TabsTrigger value="conversation">Conversation Attributes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="contact" className="space-y-4">
                        {mockAttributes.contact.map((attr) => (
                            <Card key={attr.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span className="flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            {attr.displayName}
                                        </span>
                                        <div className="flex gap-2">
                                            <Badge variant="outline">{attr.displayType}</Badge>
                                            {attr.required && <Badge>Required</Badge>}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <code className="text-sm text-muted-foreground">{attr.key}</code>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="conversation" className="space-y-4">
                        {mockAttributes.conversation.map((attr) => (
                            <Card key={attr.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span className="flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            {attr.displayName}
                                        </span>
                                        <Badge variant="outline">{attr.displayType}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <code className="text-sm text-muted-foreground">{attr.key}</code>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        
    )
}

