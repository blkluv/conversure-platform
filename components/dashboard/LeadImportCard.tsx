'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
    Upload,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileSpreadsheet,
    Loader2
} from 'lucide-react'
import { downloadLeadTemplate, parseLeadCSV, validateLeadRow, type LeadImportRow } from '@/lib/utils/leadImport'

export function LeadImportCard() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState<{
        success: number
        failed: number
        errors: string[]
    } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResults(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setProgress(0)
        setResults(null)

        try {
            // Parse CSV
            const leads = await parseLeadCSV(file)
            setProgress(20)

            // Validate all rows
            const validatedLeads = leads.map(lead => ({
                lead,
                validation: validateLeadRow(lead),
            }))

            const validLeads = validatedLeads.filter(v => v.validation.valid)
            const invalidLeads = validatedLeads.filter(v => !v.validation.valid)

            setProgress(40)

            // Import valid leads
            if (validLeads.length > 0) {
                const response = await fetch('/api/contacts/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leads: validLeads.map(v => v.lead),
                    }),
                })

                setProgress(80)

                if (!response.ok) {
                    throw new Error('Failed to import leads')
                }

                const data = await response.json()

                setProgress(100)
                setResults({
                    success: data.imported || validLeads.length,
                    failed: invalidLeads.length,
                    errors: invalidLeads.map((v, i) =>
                        `Row ${i + 2}: ${v.validation.errors.join(', ')}`
                    ),
                })
            } else {
                setResults({
                    success: 0,
                    failed: leads.length,
                    errors: invalidLeads.map((v, i) =>
                        `Row ${i + 2}: ${v.validation.errors.join(', ')}`
                    ),
                })
            }
        } catch (error: any) {
            setResults({
                success: 0,
                failed: 0,
                errors: [error.message || 'Upload failed'],
            })
        } finally {
            setIsUploading(false)
            setFile(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Import Leads from Excel
                </CardTitle>
                <CardDescription>
                    Upload a CSV file with your leads. Don't have a file?{' '}
                    <button
                        type="button"
                        onClick={downloadLeadTemplate}
                        className="text-primary hover:underline font-medium"
                    >
                        Download template
                    </button>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Template Download */}
                <Alert>
                    <Download className="h-4 w-4" />
                    <AlertDescription>
                        <strong>New to Conversure?</strong> Download our Excel template with example leads to get started quickly.
                    </AlertDescription>
                </Alert>

                {/* File Upload */}
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="relative"
                            disabled={isUploading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose CSV File
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={isUploading}
                            />
                        </Button>
                        {file && (
                            <span className="text-sm text-muted-foreground">
                                {file.name}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Supported format: CSV (Comma-separated values)
                    </p>
                </div>

                {/* Upload Button */}
                {file && (
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Leads
                            </>
                        )}
                    </Button>
                )}

                {/* Progress */}
                {isUploading && (
                    <div className="space-y-2">
                        <Progress value={progress} />
                        <p className="text-sm text-center text-muted-foreground">
                            {progress}% complete
                        </p>
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div className="space-y-3">
                        {results.success > 0 && (
                            <Alert>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription>
                                    <strong>{results.success} leads imported successfully!</strong>
                                </AlertDescription>
                            </Alert>
                        )}

                        {results.failed > 0 && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>{results.failed} leads failed to import</strong>
                                    <div className="mt-2 space-y-1 text-xs">
                                        {results.errors.slice(0, 5).map((error, i) => (
                                            <div key={i}>• {error}</div>
                                        ))}
                                        {results.errors.length > 5 && (
                                            <div className="text-muted-foreground">
                                                ... and {results.errors.length - 5} more errors
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        <strong>Template Format:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>Name (Required)</li>
                            <li>Phone (Required, format: +971501234567)</li>
                            <li>Email, Property Type, Location (Optional)</li>
                            <li>Bedrooms, Budget, Source, Notes (Optional)</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}
