/**
 * Contacts List Page
 * 
 * Advanced contact management with search, filters, bulk actions, and export
 */

'use client'

import { useState, useTransition } from 'react'
import { DashboardLayout } from '@/components/layout'
import { DataTable, SortableHeader, PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Plus, Download, MoreVertical, Users as UsersIcon, Mail, Phone } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { searchContacts, exportContacts, bulkContactAction } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

type Contact = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  source: string | null
  status: string | null
  createdAt: Date
}

const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="font-medium text-primary">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <div className="font-medium">{name || 'Unnamed'}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <SortableHeader column={column}>Phone</SortableHeader>,
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string
      return phone ? (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{phone}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) => {
      const source = row.getValue('source') as string
      return source ? (
        <Badge variant="outline">{source}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variant = status === 'HOT' ? 'destructive' : status === 'WARM' ? 'default' : 'secondary'
      return status ? (
        <Badge variant={variant}>{status}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
      return <span className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</span>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const contact = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/contacts/${contact.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export default function ContactsPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  // Load contacts on mount
  useState(() => {
    loadContacts()
  })

  async function loadContacts(query: string = '') {
    setLoading(true)
    const result = await searchContacts(query, 1)
    if (result.success && result.data) {
      setContacts(result.data as any)
    }
    setLoading(false)
  }

  async function handleExport() {
    startTransition(async () => {
      const result = await exportContacts()
      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'contacts.csv'
        a.click()
        toast.success('Contacts exported successfully')
      } else {
        toast.error(result.error || 'Export failed')
      }
    })
  }

  async function handleBulkAction(action: string) {
    if (selectedContacts.length === 0) {
      toast.error('No contacts selected')
      return
    }

    startTransition(async () => {
      const contactIds = selectedContacts.map(c => c.id)
      const result = await bulkContactAction(action, contactIds, {})

      if (result.success) {
        toast.success(result.message)
        loadContacts()
        setSelectedContacts([])
      } else {
        toast.error(result.error)
      }
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <PageHeader
          title="Contacts"
          description={`${contacts.length} contacts in total`}
          actions={
            <>
              <Button variant="outline" onClick={handleExport} disabled={isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button asChild>
                <Link href="/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Link>
              </Button>
            </>
          }
        />

        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4">
            <span className="text-sm font-medium">
              {selectedContacts.length} selected
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('assign')}
              disabled={isPending}
            >
              Assign to Agent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('add_tags')}
              disabled={isPending}
            >
              Add Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('update_status')}
              disabled={isPending}
            >
              Change Status
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        )}

        {/* Table */}
        {contacts.length > 0 ? (
          <DataTable
            columns={columns}
            data={contacts}
            searchKey="name"
            selectable
            onSelectionChange={setSelectedContacts}
            onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
          />
        ) : (
          <EmptyState
            icon={UsersIcon}
            title="No contacts yet"
            description="Get started by adding your first contact or importing from CSV"
            action={{
              label: 'Add Contact',
              onClick: () => router.push('/contacts/new')
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
