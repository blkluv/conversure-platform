import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { AgentsList } from "@/components/dashboard/agents-list"
import { InviteAgentDialog } from "@/components/dashboard/invite-agent-dialog"

export default async function AgentsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard/agent")
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  })

  const agents = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      role: "AGENT",
    },
    include: {
      agentQuota: true,
      _count: {
        select: {
          assignedLeads: true,
          conversations: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <DashboardLayout role="admin" companyName={company?.name || "Company"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Management</h1>
            <p className="text-muted-foreground">Manage your team members and their permissions</p>
          </div>
          <InviteAgentDialog companyId={session.companyId}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Agent
            </Button>
          </InviteAgentDialog>
        </div>

        <AgentsList agents={agents} companyId={session.companyId} />
      </div>
    </DashboardLayout>
  )
}
