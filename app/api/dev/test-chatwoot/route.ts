import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getWhatsappClientForCompany } from "@/lib/whatsapp-provider"

/**
 * Test Chatwoot connectivity (Development/Admin only)
 *
 * Sends a test message via Chatwoot to verify API credentials
 * and configuration are correct.
 *
 * Usage: POST /api/dev/test-chatwoot
 * Body: { testPhone: "+971501234567" }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow COMPANY_ADMIN or SUPER_ADMIN
    if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { testPhone } = body

    if (!testPhone) {
      return NextResponse.json({ error: "testPhone is required" }, { status: 400 })
    }

    const client = await getWhatsappClientForCompany(session.companyId)

    const result = await client.sendTextMessage({
      to: testPhone,
      from: "", // Will be determined by Chatwoot/provider
      body: "Test message from Conversure via Chatwoot. Your integration is working correctly!",
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test message sent successfully via Chatwoot",
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[Test Chatwoot] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
