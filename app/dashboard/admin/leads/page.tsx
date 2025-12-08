import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Filter, 
  Download,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"

type LeadWithAgent = {
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

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      NEW: { variant: "secondary", label: "New" },
      CONTACTED: { variant: "outline", label: "Contacted" },
      QUALIFIED: { variant: "default", label: "Qualified" },
      HOT: { variant: "default", label: "Hot" },
      WARM: { variant: "secondary", label: "Warm" },
      COLD: { variant: "outline", label: "Cold" },
      VIEWING_SCHEDULED: { variant: "default", label: "Viewing Scheduled" },
      OFFER_MADE: { variant: "default", label: "Offer Made" },
      NEGOTIATING: { variant: "secondary", label: "Negotiating" },
      CLOSED_WON: { variant: "default", label: "Closed Won" },
      CLOSED_LOST: { variant: "destructive", label: "Closed Lost" },
      UNRESPONSIVE: { variant: "outline", label: "Unresponsive" },
    }

    const config = statusConfig[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

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
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Leads
          </Button>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find leads by name, phone, or status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or phone..." className="pl-8" />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Leads
            </CardTitle>
            <CardDescription>
              Showing {leads.length} most recent leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.propertyType && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{lead.propertyType}</span>
                          </div>
                        )}
                        {lead.location && (
                          <div className="text-xs text-muted-foreground">
                            {lead.location}
                          </div>
                        )}
                        {!lead.propertyType && !lead.location && (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {lead.budget || "Not specified"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {lead.agent?.fullName || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.source || "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}

                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No leads yet</p>
                        <p className="text-sm">
                          Leads will appear here once they start coming in through WhatsApp or campaigns
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common lead management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                Import Leads
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
              <Button variant="outline" className="justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
