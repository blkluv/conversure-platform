import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Send, Clock, CheckCircle, XCircle, Pause, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

async function getCampaigns(companyId: string) {
  const campaigns = await db.campaign.findMany({
    where: { companyId },
    include: {
      recipients: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return campaigns.map((campaign) => ({
    ...campaign,
    totalRecipients: campaign.recipients.length,
    sentCount: campaign.recipients.filter((r) => r.status === "sent" || r.status === "delivered").length,
    failedCount: campaign.recipients.filter((r) => r.status === "failed").length,
    pendingCount: campaign.recipients.filter((r) => r.status === "pending").length,
  }))
}

async function CampaignsContent() {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  const campaigns = await getCampaigns(session.companyId)

  const statusIcons = {
    scheduled: Clock,
    running: Send,
    completed: CheckCircle,
    paused: Pause,
    failed: XCircle,
  }

  const statusColors = {
    scheduled: "bg-blue-500",
    running: "bg-yellow-500",
    completed: "bg-green-500",
    paused: "bg-gray-500",
    failed: "bg-red-500",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-2">Manage your WhatsApp bulk messaging campaigns</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Send className="w-16 h-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">No campaigns yet</CardTitle>
          <CardDescription className="mb-6">Create your first bulk messaging campaign to get started</CardDescription>
          <Link href="/campaigns/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons] || Clock
            const statusColor = statusColors[campaign.status as keyof typeof statusColors] || "bg-gray-500"

            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <Badge className={statusColor}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {campaign.status}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Total Recipients</p>
                      <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Sent</p>
                      <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{campaign.pendingCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Scheduled: {new Date(campaign.scheduledAt).toLocaleString("en-AE")}
                    </div>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  )
}
