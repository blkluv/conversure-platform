import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"
import { canSendMessage, incrementMessageCount } from "@/lib/whatsapp"
import { getWhatsappClientForCompany } from "@/lib/whatsapp-provider"

const sendMessageSchema = z.object({
  conversationId: z.string(),
  body: z.string().min(1),
  templateId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.id
    const companyId = session.companyId

    const body = await request.json()
    const data = sendMessageSchema.parse(body)

    const conversation = await db.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        lead: true,
        company: true,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    if (conversation.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const whatsappNumber = await db.whatsAppNumber.findFirst({
      where: {
        companyId,
        number: conversation.whatsappNumber,
      },
    })

    if (!whatsappNumber) {
      return NextResponse.json({ error: "WhatsApp number not configured" }, { status: 400 })
    }

    const quotaCheck = await canSendMessage(whatsappNumber.id)

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.reason,
          current: quotaCheck.current,
          limit: quotaCheck.limit,
        },
        { status: 429 },
      )
    }

    let template = null
    if (data.templateId) {
      template = await db.template.findUnique({
        where: { id: data.templateId },
      })

      if (!template || template.status !== "APPROVED") {
        return NextResponse.json({ error: "Template not available" }, { status: 400 })
      }
    }

    const client = await getWhatsappClientForCompany(companyId)

    const result = template
      ? client.sendTemplateMessage
        ? await client.sendTemplateMessage({
            to: conversation.lead.phone,
            from: whatsappNumber.number,
            body: data.body,
            templateName: template.metaTemplateName,
          })
        : await client.sendTextMessage({
            to: conversation.lead.phone,
            from: whatsappNumber.number,
            body: data.body,
          })
      : await client.sendTextMessage({
          to: conversation.lead.phone,
          from: whatsappNumber.number,
          body: data.body,
        })

    if (!result.success) {
      await db.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: userId,
          direction: "OUTBOUND",
          contentType: template ? "TEMPLATE" : "TEXT",
          body: data.body,
          templateName: template?.metaTemplateName,
          wabaMessageId: result.messageId,
          sentAt: new Date(),
          failedAt: new Date(),
          errorMessage: result.error,
        },
      })

      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const message = await db.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        direction: "OUTBOUND",
        contentType: template ? "TEMPLATE" : "TEXT",
        body: data.body,
        templateName: template?.metaTemplateName,
        wabaMessageId: result.messageId,
        sentAt: new Date(),
      },
    })

    await db.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessageAt: new Date(),
        lastDirection: "OUTBOUND",
      },
    })

    await incrementMessageCount(whatsappNumber.id, companyId)

    const agentQuota = await db.agentQuota.findUnique({
      where: { agentId: userId },
    })

    if (agentQuota) {
      await db.agentQuota.update({
        where: { agentId: userId },
        data: {
          messagesSentToday: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        sentAt: message.sentAt,
        wabaMessageId: result.messageId,
      },
      quota: {
        current: quotaCheck.current + 1,
        limit: quotaCheck.limit,
      },
    })
  } catch (error: any) {
    console.error("[Send Message] Error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
