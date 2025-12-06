import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { processBitrixWebhook } from "@/lib/bitrix"

/**
 * Bitrix24 Webhook Handler
 *
 * This endpoint receives webhook events from Bitrix24 CRM.
 *
 * Setup in Bitrix24:
 * 1. Go to CRM > Settings > Webhooks
 * 2. Create new webhook for events: ONCRMLEADADD, ONCRMLEADUPDATE, ONCRMDEALUPDATE
 * 3. Set URL: https://your-domain.com/api/webhooks/bitrix?companyId=xxx&secret=xxx
 *
 * Events handled:
 * - ONCRMLEADADD: New lead created in Bitrix → sync to Conversure
 * - ONCRMLEADUPDATE: Lead updated in Bitrix → sync changes
 * - ONCRMDEALUPDATE: Deal status changed → update lead status
 */

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get("companyId")
    const secret = searchParams.get("secret")

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 })
    }

    // Verify company and secret
    const company = await db.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Verify webhook secret (basic security)
    const expectedSecret = process.env.BITRIX_WEBHOOK_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      console.warn("[Bitrix Webhook] Invalid secret for company:", companyId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    console.log("[Bitrix Webhook] Received:", JSON.stringify(body, null, 2))

    // Log webhook event
    await db.webhookEvent.create({
      data: {
        companyId,
        source: "BITRIX",
        eventType: body.event || "unknown",
        payload: body,
      },
    })

    // Extract event type (varies by Bitrix24 configuration)
    const event = body.event || body.EVENT

    if (!event) {
      return NextResponse.json({ error: "No event type provided" }, { status: 400 })
    }

    // Process the webhook
    const result = await processBitrixWebhook(companyId, event, body)

    if (!result.success) {
      console.error("[Bitrix Webhook] Processing failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Bitrix Webhook] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
