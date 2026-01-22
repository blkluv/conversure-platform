/**
 * Email Service Utilities
 * 
 * Helper functions for sending emails via SMTP or email service providers
 */

import nodemailer from 'nodemailer'
import { FromBuilder } from './FromBuilder'
import { ReplyToBuilder } from './ReplyToBuilder'

export interface EmailParams {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    companyId: string
    conversationId?: string
    messageId?: string
    attachments?: Array<{
        filename: string
        path?: string
        content?: Buffer
    }>
}

/**
 * Send an email with automatic From/Reply-To header generation
 */
export async function sendEmail(params: EmailParams) {
    try {
        // Build From and Reply-To headers
        const fromBuilder = new FromBuilder({
            companyId: params.companyId,
            messageId: params.messageId,
            conversationId: params.conversationId,
            senderStyle: 'professional'
        })

        const replyToBuilder = new ReplyToBuilder({
            companyId: params.companyId,
            conversationId: params.conversationId,
            enableConversationRouting: !!params.conversationId
        })

        const from = await fromBuilder.build()
        const replyTo = await replyToBuilder.build()

        // Create SMTP transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        })

        // Send email
        const result = await transporter.sendMail({
            from,
            replyTo,
            to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
            attachments: params.attachments
        })

        console.log('[Email] Sent successfully:', result.messageId)
        return { success: true, messageId: result.messageId }
    } catch (error: any) {
        console.error('[Email] Send error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Send a notification email (helper wrapper)
 */
export async function sendNotificationEmail(params: {
    to: string
    subject: string
    message: string
    companyId: string
}) {
    return sendEmail({
        to: params.to,
        subject: params.subject,
        text: params.message,
        html: `<p>${params.message}</p>`,
        companyId: params.companyId
    })
}
