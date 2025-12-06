import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getWarmupLimit } from "@/lib/whatsapp"

/**
 * Admin: Reset Daily Quotas
 *
 * This endpoint resets daily message quotas for all WhatsApp numbers and agents.
 * It also advances warm-up weeks as appropriate.
 *
 * In production, this should be triggered by a cron job at midnight UTC.
 * For now, company admins can trigger it manually from settings.
 *
 * POST /api/admin/reset-quotas
 */

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Verify user is admin
    const user = await db.user.findUnique({
      where: { id: session.id },
    })

    if (!user || (user.role !== "COMPANY_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const now = new Date()

    // Reset WhatsApp number quotas
    const whatsappNumbers = await db.whatsAppNumber.findMany({
      where: { companyId: session.companyId },
    })

    const resetResults = []

    for (const number of whatsappNumbers) {
      // Calculate new warm-up week
      const daysSinceCreation = Math.floor((now.getTime() - number.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const newWeek = Math.min(Math.floor(daysSinceCreation / 7) + 1, 4)
      const newLimit = getWarmupLimit(newWeek)

      await db.whatsAppNumber.update({
        where: { id: number.id },
        data: {
          messagesSentToday: 0,
          lastResetAt: now,
          warmupWeek: newWeek,
          dailyLimit: newLimit,
        },
      })

      resetResults.push({
        number: number.number,
        label: number.label,
        week: newWeek,
        newLimit,
        previousSent: number.messagesSentToday,
      })
    }

    // Reset agent quotas
    const agentQuotas = await db.agentQuota.findMany({
      where: { companyId: session.companyId },
    })

    for (const quota of agentQuotas) {
      await db.agentQuota.update({
        where: { id: quota.id },
        data: {
          messagesSentToday: 0,
          resetAt: now,
        },
      })
    }

    // Update company warm-up stage
    const company = await db.company.findUnique({
      where: { id: session.companyId },
    })

    if (company) {
      const daysSinceCreation = Math.floor((now.getTime() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const newStage = Math.min(Math.floor(daysSinceCreation / 7) + 1, 4)

      await db.company.update({
        where: { id: session.companyId },
        data: { warmupStage: newStage },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Quotas reset successfully",
      whatsappNumbers: resetResults,
      agentQuotas: agentQuotas.length,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error("[Reset Quotas] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
