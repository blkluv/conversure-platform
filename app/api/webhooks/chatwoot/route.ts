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

    if (body.event === "message_created" && body.message_type === "incoming") {
      const message = body
      const conversation = body.conversation

      if (!conversation || !message) {
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
            in: (await db.lead.findMany({ where: { companyId, phone } })).map((l) => l.id),
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
