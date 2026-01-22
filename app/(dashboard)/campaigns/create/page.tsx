"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react"

interface Template {
  id: string
  metaTemplateName: string
  displayName: string
  language: string
  status: string
  bodyPreview: string
}

interface ContactTag {
  name: string
  count: number
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [tags, setTags] = useState<ContactTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [messagePreview, setMessagePreview] = useState<string>("")
  const [isLaunching, setIsLaunching] = useState(false)
  const [launchSuccess, setLaunchSuccess] = useState(false)

  // Fetch templates and tags
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch templates
        const templatesRes = await fetch("/api/templates")
        if (templatesRes.ok) {
          const data = await templatesRes.json()
          setTemplates(data.templates || mockTemplates)
        } else {
          setTemplates(mockTemplates)
        }

        // Fetch contact tags (mock for now)
        setTags(mockTags)
      } catch (err) {
        console.error("Error fetching data:", err)
        setTemplates(mockTemplates)
        setTags(mockTags)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update preview when template changes
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplate)
    if (template) {
      setMessagePreview(template.bodyPreview)
    } else {
      setMessagePreview("")
    }
  }, [selectedTemplate, templates])

  async function handleLaunchCampaign() {
    if (!selectedTag || !selectedTemplate) {
      setError("Please select both audience and template")
      return
    }

    setIsLaunching(true)
    setError(null)

    try {
      // Simulate campaign creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setLaunchSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/campaigns")
      }, 2000)
    } catch (err) {
      console.error("Error launching campaign:", err)
      setError("Failed to launch campaign. Please try again.")
    } finally {
      setIsLaunching(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (launchSuccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Campaign Launched!</CardTitle>
            <CardDescription className="mb-6 text-base">
              Your campaign is now live and messages will be sent to all contacts tagged with "{selectedTag}"
            </CardDescription>
            <Button onClick={() => router.push("/campaigns")}>
              View Campaign Details
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">Send WhatsApp messages to your audience</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Builder */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration Panel */}
        <div className="md:col-span-1 space-y-6">
          {/* Audience Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audience</CardTitle>
              <CardDescription>Select contacts to send to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.name} value={tag.name}>
                        {tag.name} ({tag.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTag && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium">{selectedTag}</p>
                  <p className="text-muted-foreground">
                    {tags.find((t) => t.name === selectedTag)?.count} contacts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template</CardTitle>
              <CardDescription>Choose message template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Message Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-xs text-muted-foreground mb-1">TEMPLATE</p>
                  <p className="text-sm">{messagePreview}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Launch Button */}
          <Button
            onClick={handleLaunchCampaign}
            disabled={!selectedTag || !selectedTemplate || isLaunching}
            className="w-full h-10"
            size="lg"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Launch Campaign
              </>
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Phone Mockup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Message Preview
              </CardTitle>
              <CardDescription>How your message will appear</CardDescription>
            </CardHeader>
            <CardContent>
              {messagePreview ? (
                <div className="flex justify-center">
                  <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-8 border-gray-900 shadow-2xl p-2">
                    <div className="bg-white rounded-2xl h-96 overflow-hidden flex flex-col">
                      {/* Phone Header */}
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sm">Conversure Bot</h3>
                          <p className="text-xs opacity-90">Today 10:30 AM</p>
                        </div>
                        <MessageSquare className="w-4 h-4" />
                      </div>

                      {/* Phone Messages */}
                      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <div className="space-y-3">
                          {/* User message */}
                          <div className="flex justify-end">
                            <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm max-w-xs">
                              Hi, can you help me?
                            </div>
                          </div>

                          {/* Bot response */}
                          <div className="flex justify-start">
                            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-none text-sm max-w-xs break-words">
                              {messagePreview}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phone Footer */}
                      <div className="border-t p-3">
                        <div className="text-xs text-muted-foreground text-center">
                          Input area
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a template to see preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedTag && selectedTemplate && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Ready to launch!
                    </p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      Will send to {tags.find((t) => t.name === selectedTag)?.count || 0} contacts tagged
                      with "{selectedTag}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Mock data for demo
const mockTemplates: Template[] = [
  {
    id: "1",
    metaTemplateName: "property_viewing",
    displayName: "Property Viewing Confirmation",
    language: "en",
    status: "APPROVED",
    bodyPreview: "Hi {{1}}, your property viewing is confirmed for {{2}} at {{3}}. Please bring your ID and any questions.",
  },
  {
    id: "2",
    metaTemplateName: "new_listing",
    displayName: "New Listing Alert",
    language: "en",
    status: "APPROVED",
    bodyPreview: "New property just listed! {{1}} in {{2}}. Price: {{3}} AED. Interested in viewing?",
  },
  {
    id: "3",
    metaTemplateName: "price_drop",
    displayName: "Price Drop Notification",
    language: "en",
    status: "APPROVED",
    bodyPreview: "Great news! {{1}} price dropped from {{2}} to {{3}} AED. Reply to schedule a viewing.",
  },
  {
    id: "4",
    metaTemplateName: "welcome",
    displayName: "Welcome Message",
    language: "en",
    status: "APPROVED",
    bodyPreview: "Welcome to {{1}}! We help you find your dream property. How can we assist you today?",
  },
]

const mockTags: ContactTag[] = [
  { name: "First Time Buyer", count: 145 },
  { name: "Investor", count: 87 },
  { name: "Dubai Marina", count: 92 },
  { name: "Downtown Dubai", count: 156 },
  { name: "Palm Jumeirah", count: 64 },
  { name: "Recent Inquiry", count: 203 },
  { name: "High Budget", count: 78 },
]

