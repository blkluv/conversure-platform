/**
 * Macros Management Page
 * 
 * Saved action sequences
 */

'use client'


import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Command } from 'lucide-react'

const mockMacros = [
    { id: '1', name: 'Qualify Lead', visibility: 'GLOBAL', actions: ['Update status', 'Assign agent', 'Add tag'] },
    { id: '2', name: 'Close Won', visibility: 'PERSONAL', actions: ['Mark resolved', 'Send feedback'] }
]

export default function MacrosPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Macros"
                    description="Saved action sequences for quick workflows"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Macro
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2">
                    {mockMacros.map((macro) => (
                        <Card key={macro.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span className="flex items-center gap-2">
                                        <Command className="h-4 w-4" />
                                        {macro.name}
                                    </span>
                                    <Badge variant={macro.visibility === 'GLOBAL' ? 'default' : 'secondary'}>
                                        {macro.visibility}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {macro.actions.map((action, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">{i + 1}.</span>
                                            <span>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        
    )
}
