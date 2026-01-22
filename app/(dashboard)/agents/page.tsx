/**
 * Agents List Page
 * 
 * Agent management with roles, status, and bulk operations
 */

'use client'

import { useState } from 'react'

import { DataTable, SortableHeader, PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, UserPlus, Users } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

type Agent = {
    id: string
    fullName: string
    email: string
    role: 'AGENT' | 'COMPANY_ADMIN' | 'SUPER_ADMIN'
    isActive: boolean
    createdAt: Date
}

const mockAgents: Agent[] = [
    {
        id: '1',
        fullName: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        role: 'AGENT',
        isActive: true,
        createdAt: new Date('2024-01-15')
    },
    {
        id: '2',
        fullName: 'Sarah Mohammed',
        email: 'sarah@example.com',
        role: 'COMPANY_ADMIN',
        isActive: true,
        createdAt: new Date('2024-01-10')
    }
]

const columns: ColumnDef<Agent>[] = [
    {
        accessorKey: 'fullName',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarFallback>{row.getValue<string>('fullName').charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{row.getValue('fullName')}</div>
                    <div className="text-sm text-muted-foreground">{row.original.email}</div>
                </div>
            </div>
        )
    },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
            <Badge variant={row.getValue('role') === 'COMPANY_ADMIN' ? 'default' : 'secondary'}>
                {row.getValue<string>('role').replace('_', ' ')}
            </Badge>
        )
    },
    {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
                {row.getValue('isActive') ? 'Active' : 'Inactive'}
            </Badge>
        )
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => <SortableHeader column={column}>Joined</SortableHeader>,
        cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString()
    }
]

export default function AgentsPage() {
    return (
        
            <div className="space-y-6 p-6">
                <PageHeader
                    title="Agents"
                    description={`${mockAgents.length} team members`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/agents/bulk">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Bulk Add
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/agents/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Agent
                                </Link>
                            </Button>
                        </>
                    }
                />

                {mockAgents.length > 0 ? (
                    <DataTable columns={columns} data={mockAgents} searchKey="fullName" />
                ) : (
                    <EmptyState
                        icon={Users}
                        title="No agents yet"
                        description="Add your first team member to get started"
                        action={{ label: 'Add Agent', onClick: () => { } }}
                    />
                )}
            </div>
        
    )
}

