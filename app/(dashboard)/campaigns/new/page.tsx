"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Upload, Loader2, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    templateId: "welcome_template",
    scheduledAt: new Date(),
  })
  const [file, setFile] = useState<File | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)

  async function handleCreateCampaign() {
    setLoading(true)
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) throw new Error("Failed to create campaign")

      const data = await response.json()
      setCampaignId(data.id)
      setStep(2)
    } catch (error) {
      console.error("[v0] Campaign creation error:", error)
      alert("Failed to create campaign. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload() {
    if (!file || !campaignId) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/campaigns/${campaignId}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload contacts")

      const data = await response.json()
      alert(`Successfully uploaded ${data.count} contacts!`)
      router.push("/campaigns")
    } catch (error) {
      console.error("[v0] File upload error:", error)
      alert("Failed to upload contacts. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Campaign</h1>
          <p className="text-muted-foreground mt-1">Set up a bulk WhatsApp messaging campaign</p>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Provide basic information about your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 Property Launch"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this campaign"
                value={campaignData.description}
                onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">WhatsApp Template</Label>
              <Select
                value={campaignData.templateId}
                onValueChange={(value) => setCampaignData({ ...campaignData, templateId: value })}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome_template">Welcome Template</SelectItem>
                  <SelectItem value="property_update">Property Update</SelectItem>
                  <SelectItem value="viewing_invitation">Viewing Invitation</SelectItem>
                  <SelectItem value="feedback_after_viewing">Feedback Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Schedule Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(campaignData.scheduledAt, "PPP p")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={campaignData.scheduledAt}
                    onSelect={(date) => date && setCampaignData({ ...campaignData, scheduledAt: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleCreateCampaign} disabled={!campaignData.name || loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue to Upload Contacts
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Recipients</CardTitle>
            <CardDescription>Upload a CSV file with contact details (phone, name, language)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium mb-1">Upload CSV File</p>
                <p className="text-sm text-muted-foreground">
                  Required columns: phone, name (optional), language (optional)
                </p>
              </div>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="max-w-sm mx-auto"
              />
            </div>

            {file && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Selected File</p>
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleFileUpload} disabled={!file || loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Upload & Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
