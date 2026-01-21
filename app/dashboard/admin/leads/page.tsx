import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadsTableWithSearch } from "@/components/dashboard/LeadsTableWithSearch"
import { LeadsQuickActions } from "@/components/dashboard/LeadsQuickActions"
import { Users, Clock, TrendingUp, CheckCircle2 } from "lucide-react"

export default async function AdminLeadsPage() {
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
  })

  // Fetch all leads with assigned agents
  const leads = await db.lead.findMany({
    where: { companyId: session.companyId },
    include: {
      agent: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to recent 100 leads
  })

  // Calculate statistics
  const totalLeads = leads.length
  const newLeads = leads.filter((l) => l.status === "NEW").length
  const qualifiedLeads = leads.filter((l) =>
    ["HOT", "VIEWING_SCHEDULED", "OFFER_MADE"].includes(l.status)
  ).length
  const closedWon = leads.filter((l) => l.status === "CLOSED_WON").length

  return (
    <DashboardLayout role="admin" companyName={company?.name || "Company"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Management</h1>
            <p className="text-muted-foreground">
              Manage and track all your real estate leads
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                All time leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newLeads}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting contact
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualifiedLeads}</div>
              <p className="text-xs text-muted-foreground">
                Hot & viewing scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedWon}</div>
              <p className="text-xs text-muted-foreground">
                Successful deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table with Search - All-in-one component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Leads
            </CardTitle>
            <CardDescription>
              Search, filter, and export your leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTableWithSearch leads={leads} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common lead management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsQuickActions leads={leads} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
