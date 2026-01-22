import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanyProfileForm } from "@/components/dashboard/CompanyProfileForm"
import { WhatsAppSettingsForm } from "@/components/dashboard/WhatsAppSettingsForm"
import { Bitrix24SettingsForm } from "@/components/dashboard/Bitrix24SettingsForm"
import { AISettingsForm } from "@/components/dashboard/AISettingsForm"
import { CreditCard, Zap } from "lucide-react"

export default async function AdminSettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard/agent")
  }

  try {
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

          {/* Company Profile - Using new form component */}
          <CompanyProfileForm initialData={{
            name: company?.name,
            domain: company?.domain,
            city: company?.city
          }} />

          {/* WhatsApp Configuration - Using new form component */}
          <WhatsAppSettingsForm initialData={{
            whatsappBusinessNumber: company?.whatsappBusinessNumber,
            wabaProvider: company?.wabaProvider,
            wabaStatus: company?.wabaStatus,
            whatsappProvider: companySettings?.whatsappProvider
          }} />

          {/* Bitrix24 Integration - Using new form component */}
          <Bitrix24SettingsForm initialData={{
            bitrixDomain: company?.bitrixDomain,
            bitrixWebhookUrl: company?.bitrixWebhookUrl
          }} />

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure how AI assists your agents with message generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI automation settings can be configured in the AI Settings section below.
              </p>
            </CardContent>
          </Card>

          {/* AI Configuration - Using new form component */}
          <AISettingsForm initialData={{
            aiEnabled: company?.aiEnabled,
            aiTone: company?.aiTone,
            aiLanguages: company?.aiLanguages
          }} />

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
  } catch (error) {
    console.error("Admin Settings Page Error:", error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <pre className="mt-4 p-4 bg-muted rounded-lg overflow-auto text-sm">
          {error instanceof Error ? error.message : JSON.stringify(error)}
        </pre>
      </div>
    )
  }
}
