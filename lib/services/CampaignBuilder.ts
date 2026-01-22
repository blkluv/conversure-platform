/**
 * CampaignBuilder Service
 * 
 * Ported from Rails Campaigns::CampaignConversationBuilder
 * Handles creation of conversations for campaign messages
 */

import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

interface CampaignConversationParams {
    campaignId: string
    leadId: string
    companyId: string
    additionalAttributes?: Record<string, any>
    customAttributes?: Record<string, any>
}

export class CampaignConversationBuilder {
    private campaignId: string
    private leadId: string
    private companyId: string
    private additionalAttributes?: Record<string, any>
    private customAttributes?: Record<string, any>

    constructor(params: CampaignConversationParams) {
        this.campaignId = params.campaignId
        this.leadId = params.leadId
        this.companyId = params.companyId
        this.additionalAttributes = params.additionalAttributes
        this.customAttributes = params.customAttributes
    }

    async perform() {
        try {
            return await db.$transaction(async (tx) => {
                // Fetch campaign and lead
                const campaign = await tx.campaign.findUnique({
                    where: { id: this.campaignId },
                    include: { company: true }
                })

                if (!campaign) {
                    throw new Error('Campaign not found')
                }

                const lead = await tx.lead.findUnique({
                    where: { id: this.leadId }
                })

                if (!lead) {
                    throw new Error('Lead not found')
                }

                // Check if conversation already exists for this lead
                const existingConversation = await tx.conversation.findFirst({
                    where: {
                        leadId: this.leadId,
                        companyId: this.companyId,
                        status: { in: ['ACTIVE', 'PENDING'] }
                    }
                })

                if (existingConversation) {
                    throw new Error('Conversation already exists for this lead')
                }

                // Get company's WhatsApp number
                const whatsappNumber = await tx.whatsAppNumber.findFirst({
                    where: {
                        companyId: this.companyId,
                        isActive: true
                    }
                })

                if (!whatsappNumber) {
                    throw new Error('No active WhatsApp number found for company')
                }

                // Create conversation
                const conversation = await tx.conversation.create({
                    data: {
                        companyId: this.companyId,
                        leadId: this.leadId,
                        whatsappNumber: whatsappNumber.number,
                        status: 'ACTIVE',
                        lastMessageAt: new Date(),
                        lastDirection: 'OUTBOUND'
                    }
                })

                // Send campaign message via WhatsApp
                const messageResult = await sendWhatsAppMessage({
                    to: lead.phone,
                    from: whatsappNumber.number,
                    body: campaign.description || 'Campaign message',
                    companyId: this.companyId
                })

                if (!messageResult.success) {
                    throw new Error(`Failed to send message: ${messageResult.error}`)
                }

                // Create message record
                await tx.message.create({
                    data: {
                        conversationId: conversation.id,
                        direction: 'OUTBOUND',
                        contentType: 'TEXT',
                        body: campaign.description || 'Campaign message',
                        wabaMessageId: messageResult.messageId,
                        sentAt: new Date()
                    }
                })

                // Link recipient to campaign
                await tx.campaignRecipient.updateMany({
                    where: {
                        campaignId: this.campaignId,
                        leadId: this.leadId
                    },
                    data: {
                        status: 'sent',
                        sentAt: new Date()
                    }
                })

                return conversation
            })
        } catch (error: any) {
            console.error('[CampaignBuilder] Error:', error.message)
            return null
        }
    }
}
