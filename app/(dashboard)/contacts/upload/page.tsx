"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, FileSpreadsheet, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function UploadContactsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<{ count: number; insights: string } | null>(null)

  async function handleUpload() {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/imports/contacts", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setUploadResult(data)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("Failed to upload contacts. Please check your CSV format and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload Contacts</h1>
          <p className="text-muted-foreground mt-1">Import contacts from CSV (no CRM required)</p>
        </div>
      </div>

      {!uploadResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Your CSV should include columns: phone, name, email, language, tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
              <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-lg mb-2">Drag and drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="max-w-sm mx-auto"
                />
              </div>
            </div>

            {file && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Selected File</p>
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">CSV Format Example:</p>
              <pre className="text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                {`phone,name,email,language,tags
+971501234567,Ahmed Ali,ahmed@example.com,en,"Palm Jumeirah,Investor"
+971509876543,Sara Mohammed,,ar,"Downtown Dubai,First-time buyer"`}
              </pre>
            </div>

            <Button onClick={handleUpload} disabled={!file || loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading and analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <CardTitle>Upload Successful!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <p className="text-4xl font-bold mb-2">{uploadResult.count}</p>
              <p className="text-muted-foreground">Contacts imported successfully</p>
            </div>

            {uploadResult.insights && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">AI Insights</p>
                <p className="text-sm text-muted-foreground">{uploadResult.insights}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => router.push("/campaigns/new")} className="flex-1">
                Create Campaign
              </Button>
              <Button onClick={() => router.push("/contacts")} variant="outline" className="flex-1">
                View Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
