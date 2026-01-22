/**
 * BaseEmailBuilder
 * 
 * Base class for email header builders
 * Ported from Rails Email::BaseBuilder
 */

import { db } from '@/lib/db'

export interface EmailBuilderParams {
    companyId: string
    messageId?: string
    conversationId?: string
}

export abstract class BaseEmailBuilder {
    protected companyId: string
    protected messageId?: string
    protected conversationId?: string

    constructor(params: EmailBuilderParams) {
        this.companyId = params.companyId
        this.messageId = params.messageId
        this.conversationId = params.conversationId
    }

    /**
     * Get company details
     */
    protected async getCompany() {
        return await db.company.findUnique({
            where: { id: this.companyId },
            include: { companySettings: true }
        })
    }

    /**
     * Get conversation details if conversationId is provided
     */
    protected async getConversation() {
        if (!this.conversationId) return null

        return await db.conversation.findUnique({
            where: { id: this.conversationId },
            include: {
                lead: true,
                agent: true
            }
        })
    }

    /**
     * Get message details if messageId is provided
     */
    protected async getMessage() {
        if (!this.messageId) return null

        return await db.message.findUnique({
            where: { id: this.messageId },
            include: {
                sender: true,
                conversation: {
                    include: {
                        lead: true
                    }
                }
            }
        })
    }

    /**
     * Get custom sender name (agent name or default)
     */
    protected async getCustomSenderName(): Promise<string> {
        const message = await this.getMessage()

        if (message?.sender?.fullName) {
            return message.sender.fullName
        }

        return 'Support Team'
    }

    /**
     * Get business/company name
     */
    protected async getBusinessName(): Promise<string> {
        const company = await this.getCompany()
        return company?.name || 'Conversure'
    }

    /**
     * Parse email address from string (handles "Name <email@domain.com>" format)
     */
    protected parseEmail(emailString: string): string {
        if (!emailString) return ''

        // Match email in angle brackets or standalone
        const match = emailString.match(/<(.+?)>/) || emailString.match(/([^\s]+@[^\s]+)/)
        return match ? match[1] : emailString
    }

    /**
     * Format sender name for email headers
     * Supports "Friendly" (Agent from Business) or "Professional" (Business only)
     */
    protected async formatSenderName(
        senderEmail: string,
        style: 'friendly' | 'professional' = 'professional'
    ): Promise<string> {
        const businessName = await this.getBusinessName()

        if (style === 'friendly') {
            const customSender = await this.getCustomSenderName()
            return `${customSender} from ${businessName} <${senderEmail}>`
        }

        return `${businessName} <${senderEmail}>`
    }

    /**
     * Abstract method to be implemented by subclasses
     */
    abstract build(): Promise<string>
}
