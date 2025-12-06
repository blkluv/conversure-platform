// WhatsApp onboarding setup API
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const whatsappSchema = z.object({
  companyId: z.string(),
  whatsappBusinessNumber: z.string(),
  wabaProvider: z.string(),
  wabaApiKey: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const data = whatsappSchema.parse(body)

    // Update company with WhatsApp details
    await prisma.company.update({
      where: { id: data.companyId },
      data: {
        whatsappBusinessNumber: data.whatsappBusinessNumber,
        wabaProvider: data.wabaProvider,
        wabaApiKey: data.wabaApiKey, // In production, encrypt this
        wabaStatus: "WARMING_UP",
      },
    })

    // Generate webhook URL for the company
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/whatsapp/${data.companyId}`

    return NextResponse.json({
      success: true,
      webhookUrl,
    })
  } catch (error) {
    console.error("[v0] WhatsApp onboarding error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
