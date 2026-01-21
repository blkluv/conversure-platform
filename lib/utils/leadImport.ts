/**
 * Excel Lead Import Template Generator
 * Creates a downloadable Excel template for agents to import leads
 */

export interface LeadImportRow {
    name: string
    phone: string
    email?: string
    propertyType?: string
    location?: string
    bedrooms?: number
    budget?: string
    source?: string
    notes?: string
}

export const LEAD_TEMPLATE_HEADERS = [
    'Name',
    'Phone',
    'Email',
    'Property Type',
    'Location',
    'Bedrooms',
    'Budget',
    'Source',
    'Notes',
]

export const LEAD_TEMPLATE_EXAMPLE_ROWS: LeadImportRow[] = [
    {
        name: 'Ahmed Al Mansouri',
        phone: '+971501234567',
        email: 'ahmed@example.com',
        propertyType: 'Apartment',
        location: 'Dubai Marina',
        bedrooms: 2,
        budget: 'AED 1.5M - 2M',
        source: 'Website',
        notes: 'Interested in sea view properties',
    },
    {
        name: 'Fatima Hassan',
        phone: '+971507654321',
        email: 'fatima@example.com',
        propertyType: 'Villa',
        location: 'Arabian Ranches',
        bedrooms: 4,
        budget: 'AED 3M+',
        source: 'Referral',
        notes: 'Looking for family-friendly community',
    },
]

/**
 * Generate CSV template for lead import
 */
export function generateLeadTemplateCSV(): string {
    const rows = [
        LEAD_TEMPLATE_HEADERS,
        ...LEAD_TEMPLATE_EXAMPLE_ROWS.map(row => [
            row.name,
            row.phone,
            row.email || '',
            row.propertyType || '',
            row.location || '',
            row.bedrooms?.toString() || '',
            row.budget || '',
            row.source || '',
            row.notes || '',
        ])
    ]

    return rows
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
}

/**
 * Download CSV template
 */
export function downloadLeadTemplate() {
    const csv = generateLeadTemplateCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    const filename = `conversure_lead_import_template_${new Date().toISOString().split('T')[0]}.csv`

    if ((navigator as any).msSaveBlob) {
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

/**
 * Parse uploaded CSV file
 */
export async function parseLeadCSV(file: File): Promise<LeadImportRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                const rows = text.split('\n').map(row => {
                    // Simple CSV parsing (handles quoted fields)
                    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                    return matches ? matches.map(cell => cell.replace(/^"|"$/g, '')) : []
                })

                // Skip header row
                const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0])

                const leads: LeadImportRow[] = dataRows.map(row => ({
                    name: row[0] || '',
                    phone: row[1] || '',
                    email: row[2] || undefined,
                    propertyType: row[3] || undefined,
                    location: row[4] || undefined,
                    bedrooms: row[5] ? parseInt(row[5]) : undefined,
                    budget: row[6] || undefined,
                    source: row[7] || 'CSV Import',
                    notes: row[8] || undefined,
                }))

                resolve(leads)
            } catch (error) {
                reject(new Error('Failed to parse CSV file'))
            }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}

/**
 * Validate lead data before import
 */
export function validateLeadRow(row: LeadImportRow): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!row.name || row.name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters')
    }

    if (!row.phone || row.phone.trim().length < 10) {
        errors.push('Phone is required and must be at least 10 digits (including country code)')
    }

    // Phone normalization check (should start with +)
    if (row.phone && !row.phone.startsWith('+')) {
        errors.push('Phone should be in international format (e.g., +971...)')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}
