/**
 * FromBuilder
 * 
 * Builds the "From" email header for outgoing emails
 * Ported from Rails Email::FromBuilder
 */

import { BaseEmailBuilder, EmailBuilderParams } from './BaseEmailBuilder'

interface FromBuilderParams extends EmailBuilderParams {
    supportEmail?: string // Fallback support email
    senderStyle?: 'friendly' | 'professional'
}

export class FromBuilder extends BaseEmailBuilder {
    private supportEmail: string
    private senderStyle: 'friendly' | 'professional'

    constructor(params: FromBuilderParams) {
        super(params)
        this.supportEmail = params.supportEmail || process.env.SUPPORT_EMAIL || 'support@conversure.ae'
        this.senderStyle = params.senderStyle || 'professional'
    }

    /**
     * Build the "From" header for the email
     * 
     * Logic:
     * 1. For WhatsApp-based messages, use company's configured email
     * 2. Fallback to support email if no company email
     * 3. Format with sender name (friendly or professional style)
     */
    async build(): Promise<string> {
        const company = await this.getCompany()

        // Determine the email address to use
        const fromEmail = await this.determineFromEmail(company)

        // Format with appropriate sender name
        return await this.formatSenderName(fromEmail, this.senderStyle)
    }

    /**
     * Determine which email address to use for "From" header
     */
    private async determineFromEmail(company: any): Promise<string> {
        // If company has a configured domain email, use it
        if (company?.domain) {
            return `noreply@${company.domain}`
        }

        // Parse and return support email
        return this.parseEmail(this.supportEmail)
    }
}
