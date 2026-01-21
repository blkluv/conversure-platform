"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Users, Download, TrendingUp, Upload, Loader2, FileDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseLeadCSV, validateLeadRow, downloadLeadTemplate, type LeadImportRow } from "@/lib/utils/leadImport"

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  source: string | null
  budget: string | null
  propertyType: string | null
  location: string | null
  bedrooms: number | null
  createdAt: Date
  agent: {
    fullName: string
  } | null
}

interface LeadsQuickActionsProps {
  leads: Lead[]
}

export function LeadsQuickActions({ leads }: LeadsQuickActionsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setIsUploading(true)

    try {
      const leads = await parseLeadCSV(file)

      if (leads.length === 0) {
        alert('No valid leads found in file')
        return
      }

      // Validate leads client-side
      const validLeads = leads.filter((lead: LeadImportRow) => {
        const { valid } = validateLeadRow(lead)
        return valid
      })

      if (validLeads.length === 0) {
        alert('All rows in the CSV appear to be invalid. Please check the format.')
        return
      }

      if (validLeads.length < leads.length) {
        const confirm = window.confirm(`Found ${leads.length - validLeads.length} invalid rows that will be skipped. Continue with ${validLeads.length} valid leads?`)
        if (!confirm) return
      }

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: validLeads }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Import failed')
      }

      const result = await response.json()

      // Show success message
      alert(`Successfully imported ${result.imported || 0} contacts!${result.skipped > 0 ? ` Skipped ${result.skipped} duplicates/errors.` : ''}`)

      // Refresh the page to show new leads
      router.refresh()
    } catch (error: any) {
      console.error('Import error:', error)
      alert(error.message || 'Failed to import contacts. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportToCSV = () => {
    setIsExporting(true)

    try {
      // Prepare CSV data
      const headers = ['Name', 'Phone', 'Email', 'Status', 'Property Type', 'Location', 'Budget', 'Assigned Agent', 'Source', 'Created Date']

      const rows = leads.map(lead => [
        lead.name,
        lead.phone,
        lead.email || '',
        lead.status,
        lead.propertyType || '',
        lead.location || '',
        lead.budget || '',
        lead.agent?.fullName || 'Unassigned',
        lead.source || 'Direct',
        new Date(lead.createdAt).toLocaleDateString(),
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export leads. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewAnalytics = () => {
    router.push('/dashboard/admin/analytics')
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label="CSV file input"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="justify-start flex-1"
          onClick={handleImportClick}
          disabled={isUploading}
          aria-label="Import leads from CSV"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          title="Download Template"
          onClick={downloadLeadTemplate}
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="outline"
        className="justify-start"
        onClick={handleExportToCSV}
        disabled={isExporting || leads.length === 0}
        aria-label="Export leads to CSV"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </>
        )}
      </Button>

      <Button
        variant="outline"
        className="justify-start"
        onClick={handleViewAnalytics}
        aria-label="View analytics dashboard"
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        View Analytics
      </Button>
    </div>
  )
}
