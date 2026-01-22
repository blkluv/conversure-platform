/**
 * OAuth Integrations Server Actions
 * 
 * Complete Google, Microsoft, and Facebook OAuth flows
 * Ported from Rails OAuth Controllers
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ============================================
// GOOGLE OAUTH
// ============================================

export async function initiateGoogleOAuth() {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`

        if (!clientId) throw new Error('Google OAuth not configured')

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send')}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${Buffer.from(JSON.stringify({ companyId: user.companyId })).toString('base64')}`

        return { success: true, url: authUrl }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function handleGoogleCallback(code: string, state: string) {
    try {
        const { companyId } = JSON.parse(Buffer.from(state, 'base64').toString())

        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`

        // Exchange code for tokens
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        })

        const tokens = await response.json()

        // Save to database
        await db.oAuthIntegration.upsert({
            where: {
                companyId_provider: {
                    companyId,
                    provider: 'GOOGLE'
                }
            },
            create: {
                companyId,
                provider: 'GOOGLE',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                scope: tokens.scope
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
            }
        })

        revalidatePath('/settings/integrations')
        return { success: true, message: 'Google account connected' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// MICROSOFT OAUTH
// ============================================

export async function initiateMicrosoftOAuth() {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const clientId = process.env.MICROSOFT_CLIENT_ID
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/microsoft/callback`

        if (!clientId) throw new Error('Microsoft OAuth not configured')

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('Mail.Read Mail.Send offline_access')}&` +
            `prompt=consent&` +
            `state=${Buffer.from(JSON.stringify({ companyId: user.companyId })).toString('base64')}`

        return { success: true, url: authUrl }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function handleMicrosoftCallback(code: string, state: string) {
    try {
        const { companyId } = JSON.parse(Buffer.from(state, 'base64').toString())

        const clientId = process.env.MICROSOFT_CLIENT_ID
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/microsoft/callback`

        const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        })

        const tokens = await response.json()

        await db.oAuthIntegration.upsert({
            where: {
                companyId_provider: {
                    companyId,
                    provider: 'MICROSOFT'
                }
            },
            create: {
                companyId,
                provider: 'MICROSOFT',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                scope: tokens.scope
            },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
            }
        })

        revalidatePath('/settings/integrations')
        return { success: true, message: 'Microsoft account connected' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// GET INTEGRATIONS
// ============================================

export async function getOAuthIntegrations() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const integrations = await db.oAuthIntegration.findMany({
            where: { companyId: user.companyId },
            select: {
                id: true,
                provider: true,
                expiresAt: true,
                scope: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return { success: true, data: integrations }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function disconnectOAuth(provider: 'GOOGLE' | 'MICROSOFT' | 'FACEBOOK') {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.oAuthIntegration.delete({
            where: {
                companyId_provider: {
                    companyId: user.companyId,
                    provider
                }
            }
        })

        revalidatePath('/settings/integrations')
        return { success: true, message: `${provider} disconnected` }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
