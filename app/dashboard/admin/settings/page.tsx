import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Building2, 
  MessageSquare, 
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default async function AdminSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard/agent")
  }

  // Fetch company details
  const company = await db.company.findUnique({
    where: { id: session.companyId },
    include: {
      companySettings: true,
    },
  })

  const companySettings = company?.companySettings

  return (
    <DashboardLayout role="admin" companyName={company?.name || "Company"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company profile, integrations, and billing
          </p>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Profile
            </CardTitle>
            <CardDescription>
              Update your company information and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  defaultValue={company?.name} 
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-domain">Domain</Label>
                <Input 
                  id="company-domain" 
                  defaultValue={company?.domain || ""} 
                  placeholder="yourcompany.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  defaultValue={company?.country} 
                  placeholder="UAE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  defaultValue={company?.city || ""} 
                  placeholder="Dubai"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp Configuration
            </CardTitle>
            <CardDescription>
              Manage your WhatsApp Business API settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-4">
              <Label>WhatsApp Provider</Label>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">WhatsApp Business API (WABA)</h4>
                    <p className="text-sm text-muted-foreground">
                      Official Meta API - Best for high volume
                    </p>
                  </div>
                  <Badge variant={companySettings?.whatsappProvider === "WABA" ? "default" : "outline"}>
                    {companySettings?.whatsappProvider === "WABA" ? "Active" : "Available"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Chatwoot</h4>
                    <p className="text-sm text-muted-foreground">
                      Open-source customer engagement platform
                    </p>
                  </div>
                  <Badge variant={companySettings?.whatsappProvider === "CHATWOOT" ? "default" : "outline"}>
                    {companySettings?.whatsappProvider === "CHATWOOT" ? "Active" : "Available"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Evolution API</h4>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp Web gateway - Quick setup
                    </p>
                  </div>
                  <Badge variant={companySettings?.whatsappProvider === "EVOLUTION" ? "default" : "outline"}>
                    {companySettings?.whatsappProvider === "EVOLUTION" ? "Active" : "Available"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* WABA Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">WABA Credentials</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waba-number">Business Phone Number</Label>
                  <Input 
                    id="waba-number" 
                    defaultValue={company?.whatsappBusinessNumber || ""} 
                    placeholder="+971501234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waba-provider">Provider</Label>
                  <Input 
                    id="waba-provider" 
                    defaultValue={company?.wabaProvider || ""} 
                    placeholder="360dialog, Twilio, Meta Cloud"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {company?.wabaStatus === "ACTIVE" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <Badge variant={company?.wabaStatus === "ACTIVE" ? "default" : "secondary"}>
                    {company?.wabaStatus || "PENDING"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save WhatsApp Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bitrix24 Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Bitrix24 CRM Integration</CardTitle>
            <CardDescription>
              Connect your Bitrix24 CRM for automatic lead sync
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bitrix-domain">Bitrix24 Domain</Label>
                <Input 
                  id="bitrix-domain" 
                  defaultValue={company?.bitrixDomain || ""} 
                  placeholder="yourcompany.bitrix24.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bitrix-webhook">Webhook URL</Label>
                <Input 
                  id="bitrix-webhook" 
                  defaultValue={company?.bitrixWebhookUrl || ""} 
                  placeholder="https://yourcompany.bitrix24.com/rest/..."
                  type="password"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Bitrix24 Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Configure AI-powered features for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered reply suggestions for agents
                </p>
              </div>
              <Switch defaultChecked={company?.aiEnabled} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-tone">AI Tone</Label>
                <Input 
                  id="ai-tone" 
                  defaultValue={company?.aiTone || "professional"} 
                  placeholder="professional, friendly, luxury"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-languages">Supported Languages</Label>
                <Input 
                  id="ai-languages" 
                  defaultValue={company?.aiLanguages || "en,ar"} 
                  placeholder="en,ar"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save AI Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-lg">{company?.plan} Plan</h4>
                <p className="text-sm text-muted-foreground">
                  {company?.seats} seats included
                </p>
                {company?.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next billing: {new Date(company.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge variant="default" className="text-base px-4 py-2">
                {company?.subscriptionStatus || "Active"}
              </Badge>
            </div>

            <div className="flex gap-4 pt-4">
              <Button>
                Upgrade Plan
              </Button>
              <Button variant="outline">
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
