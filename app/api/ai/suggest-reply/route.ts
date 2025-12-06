import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateWhatsAppReply } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { conversationId } = body

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { sender: { select: { fullName: true } } },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.companyId !== session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const company = await db.company.findUnique({
      where: { id: session.companyId },
      select: { aiProvider: true, aiTone: true, aiEnabled: true },
    })

    if (!company?.aiEnabled) {
      return NextResponse.json({ error: "AI features are disabled for this company" }, { status: 403 })
    }

    const conversationHistory = conversation.messages
      .reverse()
      .map((msg) => {
        const sender = msg.direction === "OUTBOUND" ? msg.sender?.fullName || "Agent" : conversation.lead.name
        return `${sender}: ${msg.body}`
      })
      .join("\n")

    const leadContext = `Lead: ${conversation.lead.name}
Phone: ${conversation.lead.phone}
Status: ${conversation.lead.status}
${conversation.lead.propertyType ? `Interest: ${conversation.lead.propertyType}` : ""}
${conversation.lead.location ? `Location: ${conversation.lead.location}` : ""}
${conversation.lead.budget ? `Budget: ${conversation.lead.budget}` : ""}`

    const suggestions = await generateWhatsAppReply(
      company.aiProvider,
      conversationHistory,
      leadContext,
      company.aiTone || undefined,
    )

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error("[v0] Error generating AI reply suggestions:", error)
    return NextResponse.json({ error: "Failed to generate reply suggestions" }, { status: 500 })
  }
}
