"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Brain, CreditCard, MessageSquare } from "lucide-react"

interface CompanySettings {
  aiProvider: "OPENAI" | "GEMINI"
  aiTone: string
  aiLanguages: string
  aiEnabled: boolean
  plan: string
  subscriptionStatus: string
  currentPeriodEnd: string | null
  whatsappProvider: "WABA" | "CHATWOOT" | "EVOLUTION" // Added WhatsApp provider
}

interface WhatsappCredentials {
  chatwootBaseUrl?: string | null
  chatwootApiToken?: string | null
  chatwootAccountId?: string | null
  chatwootInboxId?: string | null
  evolutionBaseUrl?: string | null
  evolutionInstanceId?: string | null
  evolutionApiToken?: string | null
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(false)
  const [testingAi, setTestingAi] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [settings, setSettings] = useState<CompanySettings>({
    aiProvider: "OPENAI",
    aiTone: "professional",
    aiLanguages: "en,ar",
    aiEnabled: true,
    plan: "starter",
    subscriptionStatus: "active",
    currentPeriodEnd: null,
    whatsappProvider: "WABA", // Default provider
  })

  const [whatsappCredentials, setWhatsappCredentials] = useState<WhatsappCredentials>({
    chatwootBaseUrl: "",
    chatwootApiToken: "",
    chatwootAccountId: "",
    chatwootInboxId: "",
    evolutionBaseUrl: "",
    evolutionInstanceId: "",
    evolutionApiToken: "",
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/company/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          if (data.chatwootBaseUrl)
            setWhatsappCredentials((prev) => ({ ...prev, chatwootBaseUrl: data.chatwootBaseUrl }))
          if (data.chatwootApiToken)
            setWhatsappCredentials((prev) => ({ ...prev, chatwootApiToken: data.chatwootApiToken }))
          if (data.chatwootAccountId)
            setWhatsappCredentials((prev) => ({ ...prev, chatwootAccountId: data.chatwootAccountId }))
          if (data.chatwootInboxId)
            setWhatsappCredentials((prev) => ({ ...prev, chatwootInboxId: data.chatwootInboxId }))
          if (data.evolutionBaseUrl)
            setWhatsappCredentials((prev) => ({ ...prev, evolutionBaseUrl: data.evolutionBaseUrl }))
          if (data.evolutionInstanceId)
            setWhatsappCredentials((prev) => ({ ...prev, evolutionInstanceId: data.evolutionInstanceId }))
          if (data.evolutionApiToken)
            setWhatsappCredentials((prev) => ({ ...prev, evolutionApiToken: data.evolutionApiToken }))
        }
      } catch (error) {
        console.error("[v0] Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  async function handleSaveAiSettings() {
    setLoading(true)
    try {
      const response = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: settings.aiProvider,
          aiTone: settings.aiTone,
          aiLanguages: settings.aiLanguages,
          aiEnabled: settings.aiEnabled,
        }),
      })

      if (response.ok) {
        alert("AI settings saved successfully!")
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("[v0] Save error:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveWhatsappSettings() {
    setLoading(true)
    try {
      const response = await fetch("/api/company/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappProvider: settings.whatsappProvider,
          ...whatsappCredentials,
        }),
      })

      if (response.ok) {
        alert("WhatsApp provider settings saved successfully!")
      } else {
        throw new Error("Failed to save WhatsApp settings")
      }
    } catch (error) {
      console.error("[v0] WhatsApp save error:", error)
      alert("Failed to save WhatsApp settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleTestAi() {
    setTestingAi(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: settings.aiProvider }),
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult(data.result)
      } else {
        throw new Error("AI test failed")
      }
    } catch (error) {
      console.error("[v0] AI test error:", error)
      setTestResult("Failed to connect to AI provider. Please check your API keys.")
    } finally {
      setTestingAi(false)
    }
  }

  async function handleManageBilling() {
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (error) {
      console.error("[v0] Billing portal error:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI & Integrations</h1>
        <p className="text-muted-foreground mt-2">Configure AI providers and integration settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <CardTitle>WhatsApp Provider Settings</CardTitle>
          </div>
          <CardDescription>
            Choose your WhatsApp integration: WABA (Meta/360dialog), Chatwoot, or Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>WhatsApp Provider</Label>
            <Select
              value={settings.whatsappProvider}
              onValueChange={(value: "WABA" | "CHATWOOT" | "EVOLUTION") =>
                setSettings({ ...settings, whatsappProvider: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WABA">WhatsApp Business API (Meta/360dialog/Twilio)</SelectItem>
                <SelectItem value="CHATWOOT">Chatwoot</SelectItem>
                <SelectItem value="EVOLUTION">Evolution API</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {settings.whatsappProvider === "WABA" && "Official WhatsApp Business API via Meta, 360dialog, or Twilio"}
              {settings.whatsappProvider === "CHATWOOT" && "Open-source customer engagement platform with WhatsApp"}
              {settings.whatsappProvider === "EVOLUTION" && "WhatsApp Web gateway for unofficial integration"}
            </p>
          </div>

          {settings.whatsappProvider === "CHATWOOT" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Chatwoot Configuration</h4>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://app.chatwoot.com"
                    value={whatsappCredentials.chatwootBaseUrl || ""}
                    onChange={(e) =>
                      setWhatsappCredentials({ ...whatsappCredentials, chatwootBaseUrl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input
                    type="password"
                    placeholder="Your Chatwoot API token"
                    value={whatsappCredentials.chatwootApiToken || ""}
                    onChange={(e) =>
                      setWhatsappCredentials({ ...whatsappCredentials, chatwootApiToken: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account ID</Label>
                    <Input
                      placeholder="1"
                      value={whatsappCredentials.chatwootAccountId || ""}
                      onChange={(e) =>
                        setWhatsappCredentials({ ...whatsappCredentials, chatwootAccountId: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inbox ID</Label>
                    <Input
                      placeholder="1"
                      value={whatsappCredentials.chatwootInboxId || ""}
                      onChange={(e) =>
                        setWhatsappCredentials({ ...whatsappCredentials, chatwootInboxId: e.target.value })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Webhook URL:{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    https://your-domain.com/api/webhooks/chatwoot?companyId=YOUR_COMPANY_ID
                  </code>
                </p>
              </div>
            </>
          )}

          {settings.whatsappProvider === "EVOLUTION" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Evolution API Configuration</h4>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://evolution.yourdomain.com"
                    value={whatsappCredentials.evolutionBaseUrl || ""}
                    onChange={(e) =>
                      setWhatsappCredentials({ ...whatsappCredentials, evolutionBaseUrl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instance ID</Label>
                  <Input
                    placeholder="my-instance"
                    value={whatsappCredentials.evolutionInstanceId || ""}
                    onChange={(e) =>
                      setWhatsappCredentials({ ...whatsappCredentials, evolutionInstanceId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input
                    type="password"
                    placeholder="Your Evolution API token"
                    value={whatsappCredentials.evolutionApiToken || ""}
                    onChange={(e) =>
                      setWhatsappCredentials({ ...whatsappCredentials, evolutionApiToken: e.target.value })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Webhook URL:{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    https://your-domain.com/api/webhooks/evolution?companyId=YOUR_COMPANY_ID&secret=YOUR_SECRET
                  </code>
                </p>
              </div>
            </>
          )}

          <Button onClick={handleSaveWhatsappSettings} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save WhatsApp Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <CardTitle>AI Provider Settings</CardTitle>
          </div>
          <CardDescription>Configure your AI assistant for smart replies and insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select
              value={settings.aiProvider}
              onValueChange={(value: "OPENAI" | "GEMINI") => setSettings({ ...settings, aiProvider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPENAI">ChatGPT (OpenAI)</SelectItem>
                <SelectItem value="GEMINI">Gemini (Google)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Choose which AI model to use for generating responses</p>
          </div>

          <div className="space-y-2">
            <Label>Response Tone</Label>
            <Select value={settings.aiTone} onValueChange={(value) => setSettings({ ...settings, aiTone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Supported Languages</Label>
            <Input
              id="languages"
              value={settings.aiLanguages}
              onChange={(e) => setSettings({ ...settings, aiLanguages: e.target.value })}
              placeholder="en,ar"
            />
            <p className="text-sm text-muted-foreground">Comma-separated language codes (e.g., en,ar)</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable AI Features</Label>
              <p className="text-sm text-muted-foreground">Turn AI-powered suggestions on or off</p>
            </div>
            <Switch
              checked={settings.aiEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, aiEnabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button onClick={handleTestAi} variant="outline" disabled={testingAi}>
              {testingAi ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Test Connection
            </Button>
            <Button onClick={handleSaveAiSettings} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>

          {testResult && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Test Result</p>
              <p className="text-sm text-muted-foreground">{testResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <CardTitle>WhatsApp Feedback Settings</CardTitle>
          </div>
          <CardDescription>Configure automatic feedback requests after viewings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automatic Feedback</Label>
              <p className="text-sm text-muted-foreground">Send feedback requests after property viewings</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label>Feedback Timing</Label>
            <Select defaultValue="1h">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediately</SelectItem>
                <SelectItem value="1h">1 hour after</SelectItem>
                <SelectItem value="4h">4 hours after</SelectItem>
                <SelectItem value="24h">Next day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Feedback Language</Label>
            <Select defaultValue="both">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English only</SelectItem>
                <SelectItem value="ar">Arabic only</SelectItem>
                <SelectItem value="both">Both (auto-detect)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Billing & Subscription</CardTitle>
          </div>
          <CardDescription>Manage your Conversure subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">Current Plan: {settings.plan}</p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                {settings.subscriptionStatus === "active" ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    {settings.subscriptionStatus}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {settings.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Next billing date: {new Date(settings.currentPeriodEnd).toLocaleDateString("en-AE")}
            </p>
          )}

          <Button onClick={handleManageBilling} variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
