import Papa from 'papaparse'

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
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV Parse Errors:', results.errors)
                }

                const leads: LeadImportRow[] = results.data.map((row: any) => ({
                    name: row['Name'] || row['name'] || '',
                    phone: row['Phone'] || row['phone'] || '',
                    email: row['Email'] || row['email'] || undefined,
                    propertyType: row['Property Type'] || row['propertyType'] || undefined,
                    location: row['Location'] || row['location'] || undefined,
                    bedrooms: (row['Bedrooms'] || row['bedrooms']) ? parseInt(row['Bedrooms'] || row['bedrooms']) : undefined,
                    budget: row['Budget'] || row['budget'] || undefined,
                    source: row['Source'] || row['source'] || 'CSV Import',
                    notes: row['Notes'] || row['notes'] || undefined,
                }))

                // Filter out completely empty rows that might have slipped through
                const validLeads = leads.filter(l => l.name || l.phone)

                resolve(validLeads)
            },
            error: (error) => {
                reject(new Error(`Failed to parse CSV: ${error.message}`))
            }
        })
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
