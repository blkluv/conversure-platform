/**
 * SurveyResponseBuilder Service
 * 
 * Ported from Rails CsatSurveys::ResponseBuilder
 * Handles processing of CSAT/Feedback survey responses from WhatsApp
 */

import { db } from '@/lib/db'

interface SurveyResponseParams {
    conversationId: string
    leadId: string
    companyId: string
    rating: number // 1-5
    feedbackMessage?: string
    agentId?: string
}

export class SurveyResponseBuilder {
    private params: SurveyResponseParams

    constructor(params: SurveyResponseParams) {
        this.params = params
    }

    async perform() {
        try {
            // Validate rating
            if (this.params.rating < 1 || this.params.rating > 5) {
                throw new Error('Invalid rating: must be between 1 and 5')
            }

            return await db.$transaction(async (tx) => {
                // Verify conversation exists
                const conversation = await tx.conversation.findUnique({
                    where: { id: this.params.conversationId },
                    include: {
                        lead: true,
                        agent: true
                    }
                })

                if (!conversation) {
                    throw new Error('Conversation not found')
                }

                // Check if feedback request exists
                const feedbackRequest = await tx.feedbackRequest.findFirst({
                    where: {
                        leadId: this.params.leadId,
                        companyId: this.params.companyId,
                        status: 'pending'
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                })

                if (feedbackRequest) {
                    // Update existing feedback request
                    await tx.feedbackRequest.update({
                        where: { id: feedbackRequest.id },
                        data: {
                            rating: this.params.rating,
                            comment: this.params.feedbackMessage,
                            status: 'answered',
                            respondedAt: new Date()
                        }
                    })
                }

                // Create feedback record
                const feedback = await tx.feedback.create({
                    data: {
                        companyId: this.params.companyId,
                        leadId: this.params.leadId,
                        agentId: this.params.agentId || conversation.agentId || '',
                        rating: this.params.rating,
                        comment: this.params.feedbackMessage,
                        source: 'whatsapp',
                        requestedAt: feedbackRequest?.requestedAt || new Date(),
                        respondedAt: new Date()
                    }
                })

                console.log(`[SurveyResponse] Processed feedback: rating=${this.params.rating} for lead ${this.params.leadId}`)

                return feedback
            })
        } catch (error: any) {
            console.error('[SurveyResponseBuilder] Error:', error.message)
            throw error
        }
    }

    /**
     * Parse rating from message text
     * Looks for numbers 1-5 in the message
     */
    static extractRatingFromMessage(message: string): number | null {
        const ratingMatch = message.match(/[1-5]/)
        return ratingMatch ? parseInt(ratingMatch[0]) : null
    }

    /**
     * Check if a message looks like a survey response
     */
    static isSurveyResponse(message: string): boolean {
        const lowerMessage = message.toLowerCase()
        return (
            /[1-5]/.test(message) ||
            lowerMessage.includes('rating') ||
            lowerMessage.includes('feedback') ||
            lowerMessage.includes('review')
        )
    }
}
