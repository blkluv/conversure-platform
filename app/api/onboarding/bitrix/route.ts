// Bitrix24 onboarding setup API
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const bitrixSchema = z.object({
  companyId: z.string(),
  bitrixDomain: z.string(),
  bitrixWebhookUrl: z.string().url(),
  bitrixAccessToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const data = bitrixSchema.parse(body)

    // Update company with Bitrix24 details
    await prisma.company.update({
      where: { id: data.companyId },
      data: {
        bitrixDomain: data.bitrixDomain,
        bitrixWebhookUrl: data.bitrixWebhookUrl,
        bitrixAccessToken: data.bitrixAccessToken || undefined, // In production, encrypt this
      },
    })

    // Generate Conversure webhook URL for Bitrix24
    const conversureWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/bitrix/${data.companyId}`

    return NextResponse.json({
      success: true,
      conversureWebhookUrl,
    })
  } catch (error) {
    console.error("[v0] Bitrix onboarding error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
