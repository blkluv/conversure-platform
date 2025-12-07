import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

// Next.js 16 expects params to be a Promise in the type definition
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth()

    const { id } = await context.params
    const campaignId = id

    const campaign = await db.campaign.findFirst({
      where: {
        id: campaignId,
        companyId: session.companyId,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    const recipients: Array<{
      phone: string
      name?: string
      language?: string
      leadId?: string
    }> = []

    const dataLines = lines[0].toLowerCase().includes("phone") ? lines.slice(1) : lines

    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim())

      if (parts.length === 0 || !parts[0]) continue

      const phone = parts[0].replace(/[^0-9+]/g, "")

      if (phone) {
        recipients.push({
          phone,
          name: parts[1] || undefined,
          language: parts[2] || "en",
          leadId: parts[3] || undefined,
        })
      }
    }

    const created = await Promise.all(
      recipients.map((recipient) =>
        db.campaignRecipient.create({
          data: {
            campaignId,
            phone: recipient.phone,
            name: recipient.name,
            language: recipient.language,
            leadId: recipient.leadId,
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      uploadedCount: created.length,
    })
  } catch (error) {
    console.error("[v0] Upload recipients error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload recipients" },
      { status: 500 },
    )
  }
}
