'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Download, Phone, Mail, MapPin } from 'lucide-react'
import { exportLeadsToCSV, type LeadExportData } from '@/lib/utils/exportLeads'

interface LeadsTableProps {
    leads: LeadExportData[]
}

export function LeadsTableWithSearch({ leads }: LeadsTableProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Client-side filtering
    const filteredLeads = useMemo(() => {
        if (!searchQuery.trim()) return leads

        const query = searchQuery.toLowerCase()
        return leads.filter(lead =>
            lead.name.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query) ||
            lead.email?.toLowerCase().includes(query) ||
            lead.status.toLowerCase().includes(query) ||
            lead.propertyType?.toLowerCase().includes(query) ||
            lead.location?.toLowerCase().includes(query)
        )
    }, [leads, searchQuery])

    const handleExport = () => {
        exportLeadsToCSV(filteredLeads, `leads_${new Date().toISOString().split('T')[0]}.csv`)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
            NEW: { variant: 'secondary', label: 'New' },
            CONTACTED: { variant: 'outline', label: 'Contacted' },
            QUALIFIED: { variant: 'default', label: 'Qualified' },
            HOT: { variant: 'default', label: 'Hot' },
            WARM: { variant: 'secondary', label: 'Warm' },
            COLD: { variant: 'outline', label: 'Cold' },
            VIEWING_SCHEDULED: { variant: 'default', label: 'Viewing Scheduled' },
            OFFER_MADE: { variant: 'default', label: 'Offer Made' },
            NEGOTIATING: { variant: 'secondary', label: 'Negotiating' },
            CLOSED_WON: { variant: 'default', label: 'Closed Won' },
            CLOSED_LOST: { variant: 'destructive', label: 'Closed Lost' },
            UNRESPONSIVE: { variant: 'outline', label: 'Unresponsive' },
        }

        const config = statusConfig[status] || { variant: 'outline' as const, label: status }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <div className="space-y-4">
            {/* Search & Export */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, email, status, property type, or location..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export ({filteredLeads.length})
                </Button>
            </div>

            {/* Results count */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    Showing {filteredLeads.length} of {leads.length} leads
                </p>
            )}

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                        <span>{lead.phone}</span>
                                    </div>
                                    {lead.email && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate max-w-[150px]">{lead.email}</span>
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    {lead.propertyType && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <MapPin className="w-3 h-3 text-muted-foreground" />
                                            <span>{lead.propertyType}</span>
                                        </div>
                                    )}
                                    {lead.location && (
                                        <div className="text-xs text-muted-foreground">
                                            {lead.location}
                                        </div>
                                    )}
                                    {!lead.propertyType && !lead.location && (
                                        <span className="text-sm text-muted-foreground">Not specified</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm font-medium">
                                    {lead.budget || 'Not specified'}
                                </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(lead.status)}</TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {lead.agent?.fullName || (
                                        <span className="text-muted-foreground">Unassigned</span>
                                    )}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs">
                                    {lead.source || 'Direct'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(lead.createdAt).toLocaleDateString()}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}

                    {filteredLeads.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                                {searchQuery ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-12 h-12 text-muted-foreground/50" />
                                        <p className="text-lg font-medium">No leads found</p>
                                        <p className="text-sm">
                                            Try adjusting your search terms
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-lg font-medium">No leads yet</p>
                                        <p className="text-sm">
                                            Leads will appear here once they start coming in through WhatsApp or campaigns
                                        </p>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
