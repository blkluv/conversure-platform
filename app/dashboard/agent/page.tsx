import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ConversationInbox } from "@/components/agent/conversation-inbox"
import { ConversationPanel } from "@/components/agent/conversation-panel"

export default async function AgentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>
}) {
  const session = await getSession()
  const params = await searchParams

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "AGENT") {
    redirect("/dashboard/admin")
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  })

  // Fetch agent's conversations with filters
  const conversations = await prisma.conversation.findMany({
    where: {
      companyId: session.companyId,
      agentId: session.id,
      status: "ACTIVE",
    },
    include: {
      lead: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  })

  // Get active conversation if selected
  const activeConversation = params.conversation
    ? await prisma.conversation.findFirst({
        where: {
          id: params.conversation,
          agentId: session.id,
        },
        include: {
          lead: true,
          messages: {
            orderBy: { sentAt: "asc" },
            take: 50,
          },
        },
      })
    : null

  // Get agent quota
  const agentQuota = await prisma.agentQuota.findUnique({
    where: { agentId: session.id },
  })

  return (
    <DashboardLayout role="agent" companyName={company?.name || "Company"}>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Left: Conversation Inbox */}
        <div className="w-96 flex flex-col">
          <ConversationInbox
            conversations={conversations}
            activeConversationId={params.conversation}
            agentQuota={agentQuota}
          />
        </div>

        {/* Right: Active Conversation Panel */}
        <div className="flex-1">
          <ConversationPanel
            conversation={activeConversation}
            agentId={session.id}
            companyId={session.companyId}
            agentQuota={agentQuota}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
