import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, CreditCard, Calendar, Users, MessageSquare, ArrowUpRight, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

async function getBillingData(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      seats: true,
      users: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  })

  if (!company) {
    return null
  }

  const messageCount = await db.message.count({
    where: {
      conversation: {
        companyId: companyId,
      },
      createdAt: {
        gte: new Date(new Date().setDate(1)),
      },
    },
  })

  const planLimits = {
    starter: { messages: 1000, seats: 5, price: 299 },
    growth: { messages: 5000, seats: 15, price: 699 },
    pro: { messages: 20000, seats: 50, price: 1499 },
    enterprise: { messages: 100000, seats: 999, price: 3999 },
  }

  const currentPlanKey = company.plan.toLowerCase() as keyof typeof planLimits
  const limits = planLimits[currentPlanKey] || planLimits.starter

  return {
    company,
    activeUsers: company.users.length,
    messageCount,
    limits,
  }
}

async function handleUpgrade(formData: FormData) {
  "use server"
  const session = await getCurrentUser()
  if (!session) {
    redirect("/login")
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId: process.env.STRIPE_PRICE_GROWTH }),
  })
  const data = await response.json()
  if (data.url) {
    redirect(data.url)
  }
}

async function handleManageBilling() {
  "use server"
  const session = await getCurrentUser()
  if (!session) {
    redirect("/login")
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: session.companyId }),
  })
  const data = await response.json()
  if (data.url) {
    redirect(data.url)
  }
}

async function BillingContent() {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  const data = await getBillingData(session.companyId)

  if (!data) {
    return <div>Company not found</div>
  }

  const { company, activeUsers, messageCount, limits } = data

  const messageUsagePercent = (messageCount / limits.messages) * 100
  const seatUsagePercent = (activeUsers / limits.seats) * 100

  const statusColors = {
    active: "bg-green-500",
    trialing: "bg-blue-500",
    past_due: "bg-yellow-500",
    canceled: "bg-red-500",
  }

  const statusLabels = {
    active: "Active",
    trialing: "Trial",
    past_due: "Payment Due",
    canceled: "Canceled",
  }

  const currentStatus = (company.subscriptionStatus as keyof typeof statusColors) || "active"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your Conversure subscription and billing details</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl capitalize">{company.plan} Plan</CardTitle>
                <CardDescription>
                  {company.currentPeriodEnd
                    ? `Renews on ${new Date(company.currentPeriodEnd).toLocaleDateString("en-AE", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : "No active subscription"}
                </CardDescription>
              </div>
              <Badge className={statusColors[currentStatus]}>{statusLabels[currentStatus]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Messages This Month</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {messageCount.toLocaleString()} / {limits.messages.toLocaleString()}
                </span>
              </div>
              <Progress value={messageUsagePercent} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activeUsers} / {limits.seats}
                </span>
              </div>
              <Progress value={seatUsagePercent} className="h-2" />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Plan Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Up to {limits.messages.toLocaleString()} messages/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Up to {limits.seats} team members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>WhatsApp Business API integration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Bitrix24 CRM sync</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>AI-powered insights & replies</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <form action={handleManageBilling}>
              <Button variant="outline" type="submit">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            </form>
            {company.plan !== "enterprise" && (
              <form action={handleUpgrade}>
                <Button type="submit">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">AED {limits.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">Current plan pricing</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Starter</span>
                  <span className="font-medium">AED 299/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Growth</span>
                  <span className="font-medium">AED 699/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pro</span>
                  <span className="font-medium">AED 1,499/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Enterprise</span>
                  <span className="font-medium">Custom</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {company.currentPeriodEnd
                      ? new Date(company.currentPeriodEnd).toLocaleDateString("en-AE", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No upcoming payment"}
                  </p>
                  <p className="text-sm text-muted-foreground">AED {limits.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
