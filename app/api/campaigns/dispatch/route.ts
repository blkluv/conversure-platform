import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { canSendMessage, incrementMessageCount, sendWhatsAppMessage } from "@/lib/whatsapp"

export async function POST(req: NextRequest) {
  try {
    const now = new Date()

    // Find campaigns that should be running
    const campaigns = await db.campaign.findMany({
      where: {
        status: {
          in: ["scheduled", "running"],
        },
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        company: {
          include: {
            whatsappNumbers: {
              where: {
                isActive: true,
              },
              take: 1,
            },
          },
        },
        recipients: {
          where: {
            status: "pending",
          },
          take: 100,
        },
      },
    })

    let totalSent = 0
    let totalFailed = 0

    for (const campaign of campaigns) {
      // Update status to running if scheduled
      if (campaign.status === "scheduled") {
        await db.campaign.update({
          where: { id: campaign.id },
          data: { status: "running" },
        })
      }

      const whatsappNumber = campaign.company.whatsappNumbers[0]

      if (!whatsappNumber) {
        console.warn(`[v0] No WhatsApp number for company ${campaign.companyId}`)
        continue
      }

      // Check quota
      const quotaCheck = await canSendMessage(whatsappNumber.id)

      if (!quotaCheck.allowed) {
        console.log(`[v0] Quota limit reached for campaign ${campaign.id}: ${quotaCheck.reason}`)
        break
      }

      // Send messages to recipients
      for (const recipient of campaign.recipients) {
        // Double-check quota for each message
        const check = await canSendMessage(whatsappNumber.id)
        if (!check.allowed) {
          console.log(`[v0] Quota exhausted mid-campaign ${campaign.id}`)
          break
        }

        const template = await db.template.findFirst({
          where: {
            companyId: campaign.companyId,
            metaTemplateName: campaign.templateId,
          },
        })

        const messageBody = template?.bodyPreview || `Message from ${campaign.company.name}`

        const result = await sendWhatsAppMessage({
          to: recipient.phone,
          from: whatsappNumber.number,
          body: messageBody,
          companyId: campaign.companyId,
          templateName: campaign.templateId,
        })

        if (result.success) {
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "sent",
              sentAt: new Date(),
            },
          })

          // Find or create conversation
          let lead = await db.lead.findFirst({
            where: {
              companyId: campaign.companyId,
              phone: recipient.phone,
            },
          })

          if (!lead && recipient.leadId) {
            lead = await db.lead.findUnique({
              where: { id: recipient.leadId },
            })
          }

          if (lead) {
            const conversation = await db.conversation.findFirst({
              where: {
                companyId: campaign.companyId,
                leadId: lead.id,
                status: "ACTIVE",
              },
            })

            if (conversation) {
              await db.message.create({
                data: {
                  conversationId: conversation.id,
                  direction: "OUTBOUND",
                  contentType: "TEMPLATE",
                  body: messageBody,
                  templateName: campaign.templateId,
                  wabaMessageId: result.messageId,
                  sentAt: new Date(),
                },
              })
            }
          }

          await incrementMessageCount(whatsappNumber.id, campaign.companyId)
          totalSent++
        } else {
          await db.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "failed",
              lastError: result.error,
            },
          })
          totalFailed++
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Check if campaign is complete
      const remaining = await db.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          status: "pending",
        },
      })

      if (remaining === 0) {
        await db.campaign.update({
          where: { id: campaign.id },
          data: { status: "completed" },
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalSent,
      totalFailed,
    })
  } catch (error) {
    console.error("[v0] Campaign dispatch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to dispatch campaigns" },
      { status: 500 },
    )
  }
}
