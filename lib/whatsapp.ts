import { db } from "@/lib/db"
import { getWhatsappClientForCompany } from "@/lib/whatsapp-provider"
import { LeadIdentifyAction } from "@/lib/services/LeadActions"

// WhatsApp warm-up schedule (weeks 1-4+)
const WARMUP_LIMITS = {
  1: 20,
  2: 50,
  3: 100,
  4: 1000,
}

/**
 * Get the daily message limit for a WhatsApp number based on warm-up week
 */
export function getWarmupLimit(week: number): number {
  if (week >= 4) return WARMUP_LIMITS[4]
  return WARMUP_LIMITS[week as keyof typeof WARMUP_LIMITS] || WARMUP_LIMITS[1]
}

/**
 * Check if a WhatsApp number can send a message (quota enforcement)
 */
export async function canSendMessage(whatsappNumberId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const whatsappNumber = await db.whatsAppNumber.findUnique({
    where: { id: whatsappNumberId },
  })

  if (!whatsappNumber) {
    return { allowed: false, reason: "WhatsApp number not found", current: 0, limit: 0 }
  }

  if (!whatsappNumber.isActive) {
    return { allowed: false, reason: "WhatsApp number is inactive", current: 0, limit: 0 }
  }

  // Check if we need to reset the daily counter (new day)
  const now = new Date()
  const lastReset = new Date(whatsappNumber.lastResetAt)
  const isNewDay = now.toDateString() !== lastReset.toDateString()

  if (isNewDay) {
    // Reset counter and potentially increment warm-up week
    const daysSinceCreation = Math.floor((now.getTime() - whatsappNumber.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const newWeek = Math.min(Math.floor(daysSinceCreation / 7) + 1, 4)
    const newLimit = getWarmupLimit(newWeek)

    await db.whatsAppNumber.update({
      where: { id: whatsappNumberId },
      data: {
        messagesSentToday: 0,
        lastResetAt: now,
        warmupWeek: newWeek,
        dailyLimit: newLimit,
      },
    })

    return { allowed: true, current: 0, limit: newLimit }
  }

  // Check against current limit
  if (whatsappNumber.messagesSentToday >= whatsappNumber.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit reached (${whatsappNumber.dailyLimit} messages)`,
      current: whatsappNumber.messagesSentToday,
      limit: whatsappNumber.dailyLimit,
    }
  }

  return {
    allowed: true,
    current: whatsappNumber.messagesSentToday,
    limit: whatsappNumber.dailyLimit,
  }
}

/**
 * Increment the message sent counter for a WhatsApp number
 */
export async function incrementMessageCount(whatsappNumberId: string, companyId: string) {
  const whatsappNumber = await db.whatsAppNumber.findUnique({
    where: { id: whatsappNumberId },
  })

  if (!whatsappNumber) return

  // Increment today's count
  await db.whatsAppNumber.update({
    where: { id: whatsappNumberId },
    data: {
      messagesSentToday: { increment: 1 },
    },
  })

  // Log in QuotaLog for analytics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await db.quotaLog.upsert({
    where: {
      whatsappNumberId_date: {
        whatsappNumberId,
        date: today,
      },
    },
    create: {
      companyId,
      whatsappNumberId,
      date: today,
      sentCount: 1,
      dailyLimit: whatsappNumber.dailyLimit,
    },
    update: {
      sentCount: { increment: 1 },
    },
  })
}

/**
 * Send a WhatsApp message via provider API
 * Supports multiple providers: Meta Cloud API, Twilio, 360dialog, etc.
 */
export async function sendWhatsAppMessage({
  to,
  from,
  body,
  companyId,
  provider = "meta",
  templateName,
  mediaUrl,
  templateId,
}: {
  to: string
  from: string
  body?: string
  companyId: string
  provider?: string
  templateName?: string
  mediaUrl?: string
  templateId?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const client = await getWhatsappClientForCompany(companyId)

    if (templateName) {
      if (client.sendTemplateMessage) {
        return await client.sendTemplateMessage({
          to,
          from,
          body,
          templateName,
        })
      } else {
        return await client.sendTextMessage({
          to,
          from,
          body: body || `Template: ${templateName}`,
        })
      }
    }

    return await client.sendTextMessage({
      to,
      from,
      body: body || "",
      mediaUrl,
    })
  } catch (error: any) {
    console.error("[WhatsApp] Send error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Process inbound WhatsApp webhook event
 */
export async function processInboundMessage({
  companyId,
  from,
  to,
  body,
  messageId,
  mediaUrl,
  timestamp,
}: {
  companyId: string
  from: string // Lead's phone number
  to: string // Business number
  body: string
  messageId: string
  mediaUrl?: string
  timestamp?: string
}) {
  try {
    // Find or identify lead using robust logic (handles merging/deduplication)
    const lead = await new LeadIdentifyAction({
      companyId,
      params: {
        phone: from,
        name: from, // Initial name is phone number
      },
    }).perform()

    const pendingFeedback = await db.feedback.findFirst({
      where: {
        companyId,
        leadId: lead.id,
        respondedAt: null,
        requestedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    })

    if (pendingFeedback) {
      await processFeedbackResponse(pendingFeedback.id, body)
    }

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: {
        companyId,
        leadId: lead.id,
        status: "ACTIVE",
      },
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          companyId,
          leadId: lead.id,
          whatsappNumber: to,
          lastMessageAt: new Date(),
          lastDirection: "INBOUND",
          status: "ACTIVE",
        },
      })
    }

    // Create message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        contentType: mediaUrl ? "IMAGE" : "TEXT",
        body,
        wabaMessageId: messageId,
        sentAt: timestamp ? new Date(timestamp) : new Date(),
      },
    })

    // Update conversation
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastDirection: "INBOUND",
      },
    })

    return { success: true, leadId: lead.id, conversationId: conversation.id }
  } catch (error: any) {
    console.error("[WhatsApp] Process inbound error:", error)
    return { success: false, error: error.message }
  }
}

async function processFeedbackResponse(feedbackId: string, messageBody: string) {
  try {
    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback || feedback.respondedAt) {
      return // Already processed
    }

    // Extract rating from message (look for 1-5)
    const ratingMatch = messageBody.match(/[1-5]/)
    const rating = ratingMatch ? Number.parseInt(ratingMatch[0]) : null

    if (!rating) {
      // No valid rating, treat as comment
      if (feedback.rating > 0) {
        // Already have rating, this is a comment
        await db.feedback.update({
          where: { id: feedbackId },
          data: {
            comment: messageBody,
            respondedAt: new Date(),
          },
        })
      }
      return
    }

    // Update feedback with rating
    await db.feedback.update({
      where: { id: feedbackId },
      data: {
        rating,
        comment: messageBody.replace(/[1-5]/, "").trim() || null,
        respondedAt: new Date(),
      },
    })

    console.log(`[v0] Feedback processed: rating=${rating} for feedback ${feedbackId}`)
  } catch (error) {
    console.error("[v0] Error processing feedback response:", error)
  }
}

/**
 * Process WhatsApp message status update (delivered, read, failed)
 */
export async function processStatusUpdate({
  messageId,
  status,
  timestamp,
  error,
}: {
  messageId: string
  status: "delivered" | "read" | "failed"
  timestamp?: string
  error?: string
}) {
  try {
    const message = await db.message.findUnique({
      where: { wabaMessageId: messageId },
    })

    if (!message) {
      console.warn("[WhatsApp] Message not found for status update:", messageId)
      return { success: false, error: "Message not found" }
    }

    const updateData: any = {}

    if (status === "delivered") {
      updateData.deliveredAt = timestamp ? new Date(timestamp) : new Date()
    } else if (status === "read") {
      updateData.readAt = timestamp ? new Date(timestamp) : new Date()
      if (!message.deliveredAt) {
        updateData.deliveredAt = timestamp ? new Date(timestamp) : new Date()
      }
    } else if (status === "failed") {
      updateData.failedAt = timestamp ? new Date(timestamp) : new Date()
      updateData.errorMessage = error || "Message delivery failed"
    }

    await db.message.update({
      where: { id: message.id },
      data: updateData,
    })

    return { success: true }
  } catch (error: any) {
    console.error("[WhatsApp] Process status error:", error)
    return { success: false, error: error.message }
  }
}
