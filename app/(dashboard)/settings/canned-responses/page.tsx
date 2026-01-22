/**
 * Canned Responses Page
 * 
 * Quick reply templates management
 */

'use client'

import { DashboardLayout } from '@/components/layout'
import { DataTable, SortableHeader, PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

type CannedResponse = {
    id: string
    shortCode: string
    content: string
    createdAt: Date
}

const columns: ColumnDef<CannedResponse>[] = [
    {
        accessorKey: 'shortCode',
        header: ({ column }) => <SortableHeader column={column}>Shortcode</SortableHeader>,
        cell: ({ row }) => (
            <Badge variant="outline" className="font-mono">
                /{row.getValue('shortCode')}
            </Badge>
        )
    },
    {
        accessorKey: 'content',
        header: 'Content',
        cell: ({ row }) => (
            <p className="line-clamp-2 max-w-md text-sm">{row.getValue('content')}</p>
        )
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <Button variant="ghost" size="sm">
                <Copy className="h-4 w-4" />
            </Button>
        )
    }
]

const mockData: CannedResponse[] = [
    { id: '1', shortCode: 'greeting', content: 'Hello! Thank you for contacting us. How can I help you today?', createdAt: new Date() },
    { id: '2', shortCode: 'schedule', content: 'I would be happy to schedule a viewing. What time works best for you?', createdAt: new Date() }
]

export default function CannedResponsesPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Quick Replies"
                    description="Save time with pre-written responses"
                    actions={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Response
                        </Button>
                    }
                />
                <DataTable columns={columns} data={mockData} searchKey="shortCode" />
            </div>
        </DashboardLayout>
    )
}
