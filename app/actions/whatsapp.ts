/**
 * WhatsApp Authorization Server Actions
 * 
 * Handles WhatsApp Business API embedded signup flow
 * Ported from Rails Api::V1::Accounts::Whatsapp::AuthorizationsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const whatsappAuthSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    businessId: z.string().min(1, 'Business ID is required'),
    wabaId: z.string().min(1, 'WABA ID is required'),
    phoneNumberId: z.string().optional()
})

export type WhatsAppAuthInput = z.infer<typeof whatsappAuthSchema>

/**
 * Process WhatsApp embedded signup
 * 
 * This handles the OAuth callback from Meta Business Manager
 * and sets up the WhatsApp Business API connection
 */
export async function authorizeWhatsApp(data: WhatsAppAuthInput) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Admin access required')
        }

        // Validate input
        const validated = whatsappAuthSchema.parse(data)

        // Exchange code for access token with Meta Graph API
        const accessToken = await exchangeCodeForToken(validated.code)

        if (!accessToken) {
            throw new Error('Failed to exchange authorization code for access token')
        }

        // Get WABA details from Meta
        const wabaDetails = await getWABADetails(validated.wabaId, accessToken)

        // Get phone number details
        const phoneNumber = validated.phoneNumberId
            ? await getPhoneNumberDetails(validated.phoneNumberId, accessToken)
            : null

        // Update company with WhatsApp credentials
        const company = await db.company.update({
            where: { id: user.companyId },
            data: {
                wabaProvider: 'Meta Cloud',
                wabaApiKey: accessToken, // TODO: Encrypt this in production
                whatsappBusinessNumber: phoneNumber?.display_phone_number || null,
                wabaStatus: 'CONNECTED'
            }
        })

        // Update company settings
        await db.companySettings.upsert({
            where: { companyId: user.companyId },
            create: {
                companyId: user.companyId,
                whatsappProvider: 'WABA'
            },
            update: {
                whatsappProvider: 'WABA'
            }
        })

        revalidatePath('/settings/whatsapp')
        revalidatePath('/dashboard')

        return {
            success: true,
            data: {
                businessId: validated.businessId,
                wabaId: validated.wabaId,
                phoneNumber: phoneNumber?.display_phone_number,
                status: 'CONNECTED'
            }
        }

    } catch (error: any) {
        console.error('[WhatsApp Authorization] Error:', error)

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Validation error',
                details: error.errors
            }
        }

        return {
            success: false,
            error: error.message || 'Failed to authorize WhatsApp'
        }
    }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<string | null> {
    try {
        const appId = process.env.FACEBOOK_APP_ID
        const appSecret = process.env.FACEBOOK_APP_SECRET
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/callback`

        if (!appId || !appSecret) {
            throw new Error('Facebook app credentials not configured')
        }

        const response = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?` +
            `client_id=${appId}&` +
            `client_secret=${appSecret}&` +
            `code=${code}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}`,
            { method: 'GET' }
        )

        if (!response.ok) {
            const error = await response.text()
            console.error('[OAuth] Token exchange failed:', error)
            return null
        }

        const data = await response.json()
        return data.access_token
    } catch (error) {
        console.error('[OAuth] Token exchange error:', error)
        return null
    }
}

/**
 * Get WABA (WhatsApp Business Account) details from Meta
 */
async function getWABADetails(wabaId: string, accessToken: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name,currency,timezone_id&access_token=${accessToken}`,
            { method: 'GET' }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch WABA details')
        }

        return await response.json()
    } catch (error) {
        console.error('[WABA] Fetch details error:', error)
        return null
    }
}

/**
 * Get phone number details from Meta
 */
async function getPhoneNumberDetails(phoneNumberId: string, accessToken: string) {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating&access_token=${accessToken}`,
            { method: 'GET' }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch phone number details')
        }

        return await response.json()
    } catch (error) {
        console.error('[Phone Number] Fetch details error:', error)
        return null
    }
}

/**
 * Check WhatsApp connection status
 */
export async function checkWhatsAppStatus() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return { connected: false, error: 'Not authenticated' }
        }

        const company = await db.company.findUnique({
            where: { id: user.companyId },
            select: {
                wabaStatus: true,
                whatsappBusinessNumber: true,
                wabaProvider: true
            }
        })

        return {
            connected: company?.wabaStatus === 'CONNECTED' || company?.wabaStatus === 'ACTIVE',
            status: company?.wabaStatus,
            phoneNumber: company?.whatsappBusinessNumber,
            provider: company?.wabaProvider
        }
    } catch (error: any) {
        console.error('[WhatsApp Status] Error:', error)
        return { connected: false, error: error.message }
    }
}
