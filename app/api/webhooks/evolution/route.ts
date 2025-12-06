import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processInboundMessage } from "@/lib/whatsapp"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[Evolution Webhook] Received:", JSON.stringify(body, null, 2))

    const companyId = request.nextUrl.searchParams.get("companyId")
    const secret = request.nextUrl.searchParams.get("secret")

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 })
    }

    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      console.warn("[Evolution Webhook] Invalid secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.webhookEvent.create({
      data: {
        companyId,
        source: "EVOLUTION",
        eventType: body.event || "unknown",
        payload: body,
      },
    })

    const event = body.event || body.type

    if (event === "messages.upsert" || event === "message.received") {
      const message = body.data?.message || body.message

      if (!message) {
        return NextResponse.json({ success: true })
      }

      const remoteJid = message.key?.remoteJid || message.remoteJid
      const messageBody =
        message.message?.conversation || message.message?.extendedTextMessage?.text || message.body || ""
      const messageId = message.key?.id || message.messageId || String(Date.now())

      if (!remoteJid) {
        return NextResponse.json({ success: true })
      }

      const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "")

      const company = await db.company.findUnique({
        where: { id: companyId },
      })

      if (!company || !company.whatsappBusinessNumber) {
        console.warn("[Evolution Webhook] Company or WhatsApp number not found")
        return NextResponse.json({ success: true })
      }

      await processInboundMessage({
        companyId,
        from: phone,
        to: company.whatsappBusinessNumber,
        body: messageBody,
        messageId: `evolution_${messageId}`,
        timestamp: message.messageTimestamp ? new Date(message.messageTimestamp * 1000).toISOString() : undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Evolution Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Evolution webhook endpoint active" })
}
