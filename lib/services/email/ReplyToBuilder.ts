/**
 * ReplyToBuilder
 * 
 * Builds the "Reply-To" email header for outgoing emails
 * Ported from Rails Email::ReplyToBuilder
 */

import { BaseEmailBuilder, EmailBuilderParams } from './BaseEmailBuilder'

interface ReplyToBuilderParams extends EmailBuilderParams {
    supportEmail?: string
    enableConversationRouting?: boolean
}

export class ReplyToBuilder extends BaseEmailBuilder {
    private supportEmail: string
    private enableConversationRouting: boolean

    constructor(params: ReplyToBuilderParams) {
        super(params)
        this.supportEmail = params.supportEmail || process.env.SUPPORT_EMAIL || 'support@conversure.ae'
        this.enableConversationRouting = params.enableConversationRouting ?? false
    }

    /**
     * Build the "Reply-To" header for the email
     * 
     * Logic:
     * 1. If conversation routing enabled: reply+{conversationId}@domain
     * 2. Otherwise: support email
     */
    async build(): Promise<string> {
        const company = await this.getCompany()

        // Build reply-to address based on routing preference
        const replyToEmail = await this.determineReplyToEmail(company)

        // Format with business name
        return await this.formatSenderName(replyToEmail, 'professional')
    }

    /**
     * Determine the reply-to email address
     */
    private async determineReplyToEmail(company: any): Promise<string> {
        // Check if conversation routing is enabled and we have a conversation
        if (this.enableConversationRouting && this.conversationId && company?.domain) {
            return `reply+${this.conversationId}@${company.domain}`
        }

        // Otherwise use company domain or fallback to support
        if (company?.domain) {
            return `support@${company.domain}`
        }

        return this.parseEmail(this.supportEmail)
    }
}
