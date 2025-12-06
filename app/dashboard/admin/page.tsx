import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatCard } from "@/components/dashboard/stat-card"
import { MessageSquare, Users, TrendingUp, Clock, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default async function AdminDashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard/agent")
  }

  // Fetch dashboard statistics
  const company = await prisma.company.findUnique({
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

  const [totalAgents, activeConversations, todayMessages, todayLeads, weekLeads, topAgents] = await Promise.all([
    prisma.user.count({
      where: { companyId: session.companyId, role: "AGENT", isActive: true },
    }),
    prisma.conversation.count({
      where: { companyId: session.companyId, status: "ACTIVE" },
    }),
    prisma.message.count({
      where: {
        conversation: { companyId: session.companyId },
        direction: "OUTBOUND",
        sentAt: { gte: today },
      },
    }),
    prisma.lead.count({
      where: {
        companyId: session.companyId,
        createdAt: { gte: today },
      },
    }),
    prisma.lead.count({
      where: {
        companyId: session.companyId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.findMany({
      where: {
        companyId: session.companyId,
        role: "AGENT",
        isActive: true,
      },
      include: {
        _count: {
          select: { assignedLeads: true, conversations: true },
        },
      },
      take: 5,
      orderBy: {
        assignedLeads: {
          _count: "desc",
        },
      },
    }),
  ])

  const activeWarmupPlan = company?.warmupPlans[0]
  const warmupProgress = activeWarmupPlan ? (todayMessages / activeWarmupPlan.maxMessagesPerDay) * 100 : 0

  return (
    <DashboardLayout role="admin" companyName={company?.name || "Company"}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your team today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Messages Today"
            value={todayMessages}
            description="Outbound messages sent"
            icon={MessageSquare}
            trend={+12}
          />
          <StatCard
            title="Active Conversations"
            value={activeConversations}
            description="Ongoing discussions"
            icon={Users}
            trend={+5}
          />
          <StatCard
            title="New Leads Today"
            value={todayLeads}
            description={`${weekLeads} this week`}
            icon={TrendingUp}
            trend={+8}
          />
          <StatCard title="Active Agents" value={totalAgents} description="Team members online" icon={Users} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Warmup Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Warm-up Progress
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

              {warmupProgress >= 90 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  You're approaching your daily limit. Pace your remaining messages.
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

          {/* Top Performing Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Performing Agents
              </CardTitle>
              <CardDescription>Based on active leads and conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div key={agent.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent._count.assignedLeads} leads · {agent._count.conversations} conversations
                      </p>
                    </div>
                  </div>
                ))}

                {topAgents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No agents yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest conversations and lead updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Activity feed coming soon. Manage your agents to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
