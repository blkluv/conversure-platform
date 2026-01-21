import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processInboundMessage } from "@/lib/whatsapp"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[Chatwoot Webhook] Received:", JSON.stringify(body, null, 2))

    const companyId = request.nextUrl.searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 })
    }

    await db.webhookEvent.create({
      data: {
        companyId,
        source: "CHATWOOT",
        eventType: body.event || "unknown",
        payload: body,
      },
    })

    if (!body.event) {
      return NextResponse.json({ error: "No event type" }, { status: 400 })
    }

    // Only process incoming messages from customers (not from agents)
    // Chatwoot sends message_type: "incoming" for customer messages
    // and message_type: "outgoing" for agent replies
    if (body.event === "message_created" && body.message_type === "incoming") {
      const message = body
      const conversation = body.conversation

      if (!conversation || !message) {
        return NextResponse.json({ success: true })
      }

      // Additional safeguard: Verify sender is not an agent
      // Chatwoot sometimes sends incoming with sender_type: "agent_bot"
      const senderType = message.sender?.type || body.sender_type
      if (senderType === "agent" || senderType === "agent_bot") {
        console.log("[Chatwoot Webhook] Ignoring agent/bot message to prevent loops")
        return NextResponse.json({ success: true })
      }

      const phone = conversation.meta?.sender?.phone_number || message.sender?.phone_number
      const messageBody = message.content || ""
      const messageId = String(message.id)

      if (!phone) {
        console.warn("[Chatwoot Webhook] No phone number in message")
        return NextResponse.json({ success: true })
      }

      const company = await db.company.findUnique({
        where: { id: companyId },
      })

      if (!company || !company.whatsappBusinessNumber) {
        console.warn("[Chatwoot Webhook] Company or WhatsApp number not found")
        return NextResponse.json({ success: true })
      }

      await processInboundMessage({
        companyId,
        from: phone,
        to: company.whatsappBusinessNumber,
        body: messageBody,
        messageId: `chatwoot_${messageId}`,
        timestamp: message.created_at,
      })

      const conversation_id = String(conversation.id)
      await db.conversation.updateMany({
        where: {
          companyId,
          leadId: {
            in: (await db.lead.findMany({ where: { companyId, phone } })).map(
              (l: { id: string }) => l.id
            ),
          },
        },
        data: {
          chatwootConversationId: conversation_id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Chatwoot Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Chatwoot webhook endpoint active" })
}
