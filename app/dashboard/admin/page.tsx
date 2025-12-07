import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatCard } from "@/components/dashboard/stat-card"
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Star,
  Send,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  PhoneCall
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
type AgentWithStats = {
  id: string
  fullName: string
  email: string
  role: string
  _count: {
    assignedLeads: number
    conversations: number
    feedbacks: number
  }
  feedbacks: Array<{ rating: number }>
}

type CampaignWithRecipients = {
  id: string
  name: string
  status: string
  recipients: Array<{
    id: string
    status: string
  }>
}

type FeedbackWithRelations = {
  id: string
  rating: number
  comment: string | null
  agent: { fullName: string }
  lead: { name: string }
}

type LeadStatusGroup = {
  status: string
  _count: number
}

export default async function AdminDashboardPage() {
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
      warmupPlans: {
        where: { isActive: true },
        orderBy: { weekNumber: "desc" },
        take: 1,
      },
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Parallel fetch all dashboard data
  const [
    totalLeads,
    newLeadsToday,
    newLeadsWeek,
    totalConversations,
    activeConversations,
    openConversations,
    totalCampaigns,
    todayMessages,
    totalAgents,
    activeAgentsToday,
    avgFeedbackRating,
    totalFeedback,
    positiveFeedback,
    recentCampaigns,
    topAgents,
    recentFeedback,
    leadsByStatus,
    overdueFollowups,
  ] = await Promise.all([
    // Total active leads
    db.lead.count({
      where: { companyId: session.companyId },
    }),
    
    // New leads today
    db.lead.count({
      where: {
        companyId: session.companyId,
        createdAt: { gte: today },
      },
    }),
    
    // New leads this week
    db.lead.count({
      where: {
        companyId: session.companyId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    
    // Total conversations
    db.conversation.count({
      where: { companyId: session.companyId },
    }),
    
    // Active conversations
    db.conversation.count({
      where: { 
        companyId: session.companyId, 
        status: "ACTIVE" 
      },
    }),
    
    // Open conversations (no agent response in last 24h)
    db.conversation.count({
      where: {
        companyId: session.companyId,
        status: "ACTIVE",
        lastMessageAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        lastDirection: "INBOUND",
      },
    }),
    
    // Total campaigns
    db.campaign.count({
      where: { companyId: session.companyId },
    }),
    
    // Messages sent today
    db.message.count({
      where: {
        conversation: { companyId: session.companyId },
        direction: "OUTBOUND",
        sentAt: { gte: today },
      },
    }),
    
    // Total agents
    db.user.count({
      where: { 
        companyId: session.companyId, 
        role: "AGENT", 
        isActive: true 
      },
    }),
    
    // Active agents today (sent at least one message)
    db.user.count({
      where: {
        companyId: session.companyId,
        role: "AGENT",
        isActive: true,
        messages: {
          some: {
            sentAt: { gte: today },
          },
        },
      },
    }),
    
    // Average feedback rating
    db.feedback.aggregate({
      where: { companyId: session.companyId },
      _avg: { rating: true },
    }),
    
    // Total feedback count
    db.feedback.count({
      where: { companyId: session.companyId },
    }),
    
    // Positive feedback (rating >= 4)
    db.feedback.count({
      where: {
        companyId: session.companyId,
        rating: { gte: 4 },
      },
    }),
    
    // Recent campaigns
    db.campaign.findMany({
      where: { companyId: session.companyId },
      include: {
        recipients: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    
    // Top performing agents
    db.user.findMany({
      where: {
        companyId: session.companyId,
        role: "AGENT",
        isActive: true,
      },
      include: {
        _count: {
          select: { 
            assignedLeads: true, 
            conversations: true,
            feedbacks: true,
          },
        },
        feedbacks: {
          select: { rating: true },
        },
      },
      take: 5,
      orderBy: {
        assignedLeads: {
          _count: "desc",
        },
      },
    }),
    
    // Recent feedback
    db.feedback.findMany({
      where: { companyId: session.companyId },
      include: {
        agent: { select: { fullName: true } },
        lead: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    
    // Leads by status
    db.lead.groupBy({
      by: ["status"],
      where: { companyId: session.companyId },
      _count: true,
    }).then((results: Array<{ status: string; _count: number }>) => 
      results.map((r: { status: string; _count: number }) => ({
        status: r.status,
        _count: r._count
      }))
    ) as Promise<LeadStatusGroup[]>,
    
    // Overdue follow-ups (placeholder - would need follow-up date field)
    Promise.resolve(0),
  ])

  // Calculate metrics
  const activeWarmupPlan = company?.warmupPlans[0]
  const warmupProgress = activeWarmupPlan ? (todayMessages / activeWarmupPlan.maxMessagesPerDay) * 100 : 0
  const avgRating = avgFeedbackRating._avg.rating || 0
  const positivePercentage = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0
  
  // Calculate conversion rate (HOT + VIEWING_SCHEDULED + OFFER_MADE + CLOSED_WON / Total)
  const qualifiedLeads = leadsByStatus
    .filter((l: LeadStatusGroup) => ["HOT", "VIEWING_SCHEDULED", "OFFER_MADE", "CLOSED_WON"].includes(l.status))
    .reduce((sum: number, l: LeadStatusGroup) => sum + l._count, 0)
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

  return (
    <DashboardLayout role="admin" companyName={company?.name || "Company"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your real estate CRM overview for today.
          </p>
        </div>

        {/* High-Level KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Active Leads"
            value={totalLeads}
            description={`+${newLeadsWeek} this week`}
            icon={Users}
            trend={newLeadsWeek > 0 ? +Math.round((newLeadsWeek / Math.max(totalLeads - newLeadsWeek, 1)) * 100) : 0}
          />
          <StatCard
            title="New Leads Today"
            value={newLeadsToday}
            description={`${newLeadsWeek} in last 7 days`}
            icon={TrendingUp}
            trend={newLeadsToday > 0 ? +15 : 0}
          />
          <StatCard
            title="Active Conversations"
            value={activeConversations}
            description={`${totalConversations} total`}
            icon={MessageSquare}
            trend={+8}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            description="Leads to qualified"
            icon={CheckCircle2}
            trend={conversionRate > 20 ? +5 : -2}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Campaigns"
            value={totalCampaigns}
            description="WhatsApp campaigns"
            icon={Send}
            trend={0}
          />
          <StatCard
            title="Active Agents"
            value={`${activeAgentsToday}/${totalAgents}`}
            description="Online today"
            icon={UserCheck}
            trend={0}
          />
          <StatCard
            title="Avg Feedback Score"
            value={avgRating.toFixed(1)}
            description={`${positivePercentage}% positive`}
            icon={Star}
            trend={avgRating >= 4 ? +10 : -5}
          />
          <StatCard
            title="Open Conversations"
            value={openConversations}
            description="Awaiting response"
            icon={AlertCircle}
            trend={0}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Warm-up Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                WhatsApp Warm-up Progress
              </CardTitle>
              <CardDescription>
                {activeWarmupPlan
                  ? `Week ${activeWarmupPlan.weekNumber} - ${activeWarmupPlan.maxMessagesPerDay} messages/day limit`
                  : "No active warm-up plan"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's Usage</span>
                  <span className="font-medium">
                    {todayMessages} / {activeWarmupPlan?.maxMessagesPerDay || 0}
                  </span>
                </div>
                <Progress value={Math.min(warmupProgress, 100)} className="h-2" />
              </div>

              {warmupProgress >= 90 && warmupProgress < 100 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  ⚠️ Approaching daily limit. Pace your remaining messages.
                </div>
              )}

              {warmupProgress >= 100 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                  🚫 Daily limit reached. Messages will resume tomorrow.
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Warm-up Schedule</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Week 1</span>
                    <span>20 messages/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 2</span>
                    <span>50 messages/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 3</span>
                    <span>100 messages/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 4+</span>
                    <span>1,000+ messages/day</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback & Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Customer Satisfaction
              </CardTitle>
              <CardDescription>Feedback from your clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{avgRating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{totalFeedback}</div>
                  <div className="text-xs text-muted-foreground">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{positivePercentage}%</div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Recent Feedback</h4>
                <div className="space-y-3">
                  {recentFeedback.map((feedback: FeedbackWithRelations) => (
                    <div key={feedback.id} className="flex items-start gap-3 text-sm">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < feedback.rating ? "fill-current" : ""}`}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground truncate">
                          {feedback.comment || "No comment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feedback.lead.name} · {feedback.agent.fullName}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentFeedback.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No feedback yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>WhatsApp campaign performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign: CampaignWithRecipients) => {
                  const totalRecipients = campaign.recipients.length
                  const sent = campaign.recipients.filter((r: { status: string }) => r.status === "sent" || r.status === "delivered").length
                  const delivered = campaign.recipients.filter((r: { status: string }) => r.status === "delivered").length
                  const engagementRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === "completed"
                              ? "default"
                              : campaign.status === "running"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{totalRecipients}</TableCell>
                      <TableCell className="text-right">{sent}</TableCell>
                      <TableCell className="text-right">{delivered}</TableCell>
                      <TableCell className="text-right">{engagementRate}%</TableCell>
                    </TableRow>
                  )
                })}

                {recentCampaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No campaigns yet. Create your first campaign to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Agent Performance
            </CardTitle>
            <CardDescription>Top performing team members</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Name</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversations</TableHead>
                  <TableHead className="text-right">Avg Rating</TableHead>
                  <TableHead className="text-right">Feedback Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAgents.map((agent: AgentWithStats, index: number) => {
                  const avgAgentRating =
                    agent.feedbacks.length > 0
                      ? agent.feedbacks.reduce((sum: number, f: { rating: number }) => sum + f.rating, 0) / agent.feedbacks.length
                      : 0

                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{agent.fullName}</TableCell>
                      <TableCell className="text-right">{agent._count.assignedLeads}</TableCell>
                      <TableCell className="text-right">{agent._count.conversations}</TableCell>
                      <TableCell className="text-right">
                        {avgAgentRating > 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span>{avgAgentRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{agent._count.feedbacks}</TableCell>
                    </TableRow>
                  )
                })}

                {topAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No agents yet. Invite team members to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Conversation Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5" />
              Conversation Health
            </CardTitle>
            <CardDescription>Monitor response times and follow-ups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Open Conversations</span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold">{openConversations}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No agent response in 24h
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overdue Follow-ups</span>
                  <Clock className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold">{overdueFollowups}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Past due date
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Avg Response Time</span>
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold">~2h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  First response time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
