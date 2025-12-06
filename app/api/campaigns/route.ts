import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().min(1),
  scheduledAt: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)

    const body = await req.json()
    const validated = createCampaignSchema.parse(body)

    const campaign = await db.campaign.create({
      data: {
        companyId: session.companyId,
        name: validated.name,
        description: validated.description,
        templateId: validated.templateId,
        scheduledAt: new Date(validated.scheduledAt),
        createdBy: session.id,
      },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error("[v0] Create campaign error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)

    const campaigns = await db.campaign.findMany({
      where: {
        companyId: session.companyId,
      },
      include: {
        recipients: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const campaignsWithStats = campaigns.map((campaign) => ({
      ...campaign,
      totalRecipients: campaign.recipients.length,
      sentCount: campaign.recipients.filter((r) => r.status === "sent" || r.status === "delivered").length,
      pendingCount: campaign.recipients.filter((r) => r.status === "pending").length,
      failedCount: campaign.recipients.filter((r) => r.status === "failed").length,
      recipients: undefined,
    }))

    return NextResponse.json({ campaigns: campaignsWithStats })
  } catch (error) {
    console.error("[v0] Get campaigns error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch campaigns" },
      { status: 500 },
    )
  }
}
