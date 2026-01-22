/**
 * Labels Management Page
 * 
 * Tag and label management with color pickers
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Tag } from 'lucide-react'

const mockLabels = [
    { id: '1', title: 'Hot Lead', description: 'High priority leads', color: '#ef4444', showOnSidebar: true },
    { id: '2', title: 'Follow Up', description: 'Needs follow up', color: '#f59e0b', showOnSidebar: true },
    { id: '3', title: 'VIP', description: 'VIP clients', color: '#8b5cf6', showOnSidebar: false }
]

export default function LabelsPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Labels"
                    description="Organize conversations with tags"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Label
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2">
                    {mockLabels.map((label) => (
                        <Card key={label.id}>
                            <CardContent className="flex items-start gap-4 pt-6">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${label.color}20` }}
                                >
                                    <Tag className="h-5 w-5" style={{ color: label.color }} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{label.title}</h3>
                                        {label.showOnSidebar && (
                                            <Badge variant="secondary" className="text-xs">Sidebar</Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{label.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        
    )
}
