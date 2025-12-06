import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Users, MessageSquare, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"

async function getFeedbackData(companyId: string) {
  const feedbacks = await db.feedback.findMany({
    where: { companyId },
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
          name: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const agentStats = new Map<
    string,
    {
      agentId: string
      agentName: string
      totalFeedback: number
      avgRating: number
      ratings: number[]
    }
  >()

  feedbacks.forEach((feedback) => {
    const existing = agentStats.get(feedback.agentId)
    if (existing) {
      existing.totalFeedback++
      existing.ratings.push(feedback.rating)
      existing.avgRating = existing.ratings.reduce((a, b) => a + b, 0) / existing.ratings.length
    } else {
      agentStats.set(feedback.agentId, {
        agentId: feedback.agentId,
        agentName: feedback.agent.fullName,
        totalFeedback: 1,
        avgRating: feedback.rating,
        ratings: [feedback.rating],
      })
    }
  })

  const agentStatsArray = Array.from(agentStats.values()).sort((a, b) => b.avgRating - a.avgRating)

  const negativeFeedback = feedbacks.filter((f) => f.rating <= 3 && f.respondedAt).slice(0, 10)

  const totalFeedback = feedbacks.filter((f) => f.respondedAt).length
  const avgRatingOverall =
    totalFeedback > 0 ? feedbacks.filter((f) => f.respondedAt).reduce((sum, f) => sum + f.rating, 0) / totalFeedback : 0

  const promoters = feedbacks.filter((f) => f.respondedAt && f.rating >= 4).length
  const detractors = feedbacks.filter((f) => f.respondedAt && f.rating <= 2).length
  const nps = totalFeedback > 0 ? ((promoters - detractors) / totalFeedback) * 100 : 0

  return {
    feedbacks,
    agentStatsArray,
    negativeFeedback,
    totalFeedback,
    avgRatingOverall,
    nps,
  }
}

async function FeedbackContent() {
  const session = await getCurrentUser()

  if (!session) {
    redirect("/login")
  }

  const data = await getFeedbackData(session.companyId)

  function StarRating({ rating }: { rating: number }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback Intelligence</h1>
        <p className="text-muted-foreground mt-2">Track agent performance and customer satisfaction</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.totalFeedback}</p>
                <p className="text-sm text-muted-foreground">Responses collected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.avgRatingOverall.toFixed(1)}</p>
                <StarRating rating={Math.round(data.avgRatingOverall)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">NPS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{data.nps.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Net Promoter Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Feedback breakdown by agent</CardDescription>
        </CardHeader>
        <CardContent>
          {data.agentStatsArray.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No feedback data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.agentStatsArray.map((agent) => (
                <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{agent.agentName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{agent.totalFeedback} responses</span>
                      <StarRating rating={Math.round(agent.avgRating)} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{agent.avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Negative Feedback</CardTitle>
          <CardDescription>Ratings of 3 or below requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {data.negativeFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No negative feedback - great work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.negativeFeedback.map((feedback) => (
                <div key={feedback.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{feedback.lead.name}</p>
                      <p className="text-sm text-muted-foreground">{feedback.agent.fullName}</p>
                    </div>
                    <Badge variant={feedback.rating <= 2 ? "destructive" : "secondary"}>
                      <Star className="w-3 h-3 mr-1" />
                      {feedback.rating}/5
                    </Badge>
                  </div>
                  {feedback.comment && <p className="text-sm">{feedback.comment}</p>}
                  <p className="text-xs text-muted-foreground">
                    {feedback.respondedAt ? new Date(feedback.respondedAt).toLocaleString("en-AE") : "Pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  )
}
