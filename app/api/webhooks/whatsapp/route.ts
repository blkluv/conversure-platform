import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processInboundMessage, processStatusUpdate } from "@/lib/whatsapp"

/**
 * WhatsApp Webhook Handler
 *
 * This endpoint receives webhook events from WhatsApp Business API providers.
 *
 * Handles:
 * - Inbound messages from leads
 * - Message status updates (delivered, read, failed)
 *
 * Provider format examples:
 * - Meta Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 * - Twilio: https://www.twilio.com/docs/whatsapp/api#monitor-the-status-of-your-message
 * - 360dialog: Similar to Meta format
 *
 * Environment variables required:
 * - WABA_VERIFY_TOKEN: Token for webhook verification (Meta)
 */

// Webhook verification (Meta Cloud API)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WABA_VERIFY_TOKEN

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verified")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

// Webhook event handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2))

    // Log webhook event
    await db.webhookEvent.create({
      data: {
        source: "WHATSAPP",
        eventType: body.type || "unknown",
        payload: body,
      },
    })

    // Determine provider format and extract relevant data
    const provider = detectProvider(body)

    if (provider === "meta") {
      await handleMetaWebhook(body)
    } else if (provider === "twilio") {
      await handleTwilioWebhook(body)
    } else if (provider === "360dialog") {
      await handle360DialogWebhook(body)
    } else {
      // Generic format
      await handleGenericWebhook(body)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[WhatsApp Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Detect WhatsApp provider from webhook payload structure
 */
function detectProvider(body: any): string {
  if (body.object === "whatsapp_business_account") return "meta"
  if (body.MessagingServiceSid || body.AccountSid) return "twilio"
  if (body.messages && Array.isArray(body.messages)) return "360dialog"
  return "generic"
}

/**
 * Handle Meta Cloud API webhook format
 */
async function handleMetaWebhook(body: any) {
  const entries = body.entry || []

  for (const entry of entries) {
    const changes = entry.changes || []

    for (const change of changes) {
      const value = change.value

      if (!value) continue

      // Handle inbound messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          const companyNumber = value.metadata?.display_phone_number
          const company = await findCompanyByNumber(companyNumber)

          if (!company) {
            console.warn("[WhatsApp] Company not found for number:", companyNumber)
            continue
          }

          await processInboundMessage({
            companyId: company.id,
            from: message.from,
            to: companyNumber,
            body: message.text?.body || message.caption || "",
            messageId: message.id,
            mediaUrl: message.image?.link || message.video?.link || message.document?.link,
            timestamp: message.timestamp,
          })
        }
      }

      // Handle status updates
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await processStatusUpdate({
            messageId: status.id,
            status: status.status,
            timestamp: status.timestamp,
            error: status.errors?.[0]?.message,
          })
        }
      }
    }
  }
}

/**
 * Handle Twilio webhook format
 */
async function handleTwilioWebhook(body: any) {
  const from = body.From?.replace("whatsapp:", "")
  const to = body.To?.replace("whatsapp:", "")
  const messageBody = body.Body
  const messageSid = body.MessageSid
  const status = body.MessageStatus

  if (!from || !to) return

  const company = await findCompanyByNumber(to)
  if (!company) return

  if (messageBody) {
    // Inbound message
    await processInboundMessage({
      companyId: company.id,
      from,
      to,
      body: messageBody,
      messageId: messageSid,
    })
  } else if (status) {
    // Status update
    await processStatusUpdate({
      messageId: messageSid,
      status: status as any,
    })
  }
}

/**
 * Handle 360dialog webhook format (similar to Meta)
 */
async function handle360DialogWebhook(body: any) {
  // Similar structure to Meta
  await handleMetaWebhook(body)
}

/**
 * Handle generic webhook format
 */
async function handleGenericWebhook(body: any) {
  const { number, from, body: messageBody, messageId, status, type } = body

  const company = await findCompanyByNumber(number)
  if (!company) return

  if (type === "message") {
    await processInboundMessage({
      companyId: company.id,
      from,
      to: number,
      body: messageBody,
      messageId,
    })
  } else if (type === "status") {
    await processStatusUpdate({
      messageId,
      status,
    })
  }
}

/**
 * Find company by WhatsApp business number
 */
async function findCompanyByNumber(number: string) {
  if (!number) return null

  // Try multiple formats
  const normalized = number.replace(/[^0-9]/g, "")

  return await db.company.findFirst({
    where: {
      OR: [
        { whatsappBusinessNumber: number },
        { whatsappBusinessNumber: `+${normalized}` },
        { whatsappBusinessNumber: normalized },
      ],
    },
  })
}
