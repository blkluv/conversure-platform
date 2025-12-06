import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req)

    const feedbacks = await db.feedback.findMany({
      where: {
        companyId: session.companyId,
        respondedAt: { not: null },
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        respondedAt: "desc",
      },
    })

    const agentStats = new Map<
      string,
      {
        agentId: string
        agentName: string
        agentEmail: string
        totalFeedback: number
        averageRating: number
        ratings: number[]
      }
    >()

    feedbacks.forEach((feedback) => {
      const agentId = feedback.agentId

      if (!agentStats.has(agentId)) {
        agentStats.set(agentId, {
          agentId: feedback.agent.id,
          agentName: feedback.agent.fullName,
          agentEmail: feedback.agent.email,
          totalFeedback: 0,
          averageRating: 0,
          ratings: [],
        })
      }

      const stats = agentStats.get(agentId)!
      stats.totalFeedback++
      stats.ratings.push(feedback.rating)
    })

    const agentSummaries = Array.from(agentStats.values()).map((stats) => {
      const sum = stats.ratings.reduce((a, b) => a + b, 0)
      stats.averageRating = sum / stats.ratings.length
      return stats
    })

    const negativeFeedback = feedbacks
      .filter((f) => f.rating <= 3)
      .slice(0, 10)
      .map((f) => ({
        id: f.id,
        agentName: f.agent.fullName,
        leadName: f.lead.name,
        leadPhone: f.lead.phone,
        rating: f.rating,
        comment: f.comment,
        respondedAt: f.respondedAt,
      }))

    return NextResponse.json({
      agentSummaries,
      negativeFeedback,
      totalFeedback: feedbacks.length,
    })
  } catch (error) {
    console.error("[v0] Feedback summary error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch feedback summary" },
      { status: 500 },
    )
  }
}
