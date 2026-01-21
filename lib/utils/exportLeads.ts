/**
 * Export Leads Utility
 * 
 * Converts lead data to CSV and triggers download
 */

export interface LeadExportData {
    id: string
    name: string
    phone: string
    email?: string | null
    status: string
    source?: string | null
    budget?: string | null
    propertyType?: string | null
    location?: string | null
    bedrooms?: number | null
    createdAt: Date
    agent?: {
        fullName: string
    } | null
}

export function exportLeadsToCSV(leads: LeadExportData[], filename = 'leads.csv') {
    // Define CSV headers
    const headers = [
        'ID',
        'Name',
        'Phone',
        'Email',
        'Status',
        'Source',
        'Budget',
        'Property Type',
        'Location',
        'Bedrooms',
        'Assigned Agent',
        'Created At'
    ]

    // Convert leads to CSV rows
    const rows = leads.map(lead => [
        lead.id,
        lead.name,
        lead.phone,
        lead.email || '',
        lead.status,
        lead.source || '',
        lead.budget || '',
        lead.propertyType || '',
        lead.location || '',
        lead.bedrooms?.toString() || '',
        lead.agent?.fullName || 'Unassigned',
        new Date(lead.createdAt).toLocaleDateString()
    ])

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if ((navigator as any).msSaveBlob) {
        // IE 10+
        (navigator as any).msSaveBlob(blob, filename)
    } else {
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = filename
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
}
