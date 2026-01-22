/**
 * Campaigns Server Actions
 * 
 * CRUD operations for WhatsApp broadcast campaigns
 * Ported from Rails Api::V1::Accounts::CampaignsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const campaignSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    scheduledAt: z.string().optional(),
    audienceType: z.enum(['ALL', 'FILTERED', 'SPECIFIC']).default('ALL'),
    audienceIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
})

export type CampaignInput = z.infer<typeof campaignSchema>

/**
 * Get all campaigns
 */
export async function getCampaigns() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const campaigns = await db.campaign.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            // No _count needed - Campaign has no direct relations to count
        })

        return { success: true, data: campaigns }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create campaign
 */
export async function createCampaign(data: CampaignInput) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Admin access required')
        }

        const validated = campaignSchema.parse(data)

        const campaign = await db.campaign.create({
            data: {
                companyId: user.companyId,
                name: validated.title,
                description: validated.description,
                messageTemplate: validated.message,
                scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
                status: validated.scheduledAt ? 'SCHEDULED' : 'DRAFT',
                targetAudience: validated.audienceType,
                targetLeadIds: validated.audienceIds || [],
                filterTags: validated.tags || []
            }
        })

        revalidatePath('/campaigns')

        return { success: true, data: campaign }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

/**
 * Update campaign
 */
export async function updateCampaign(id: string, data: Partial<CampaignInput>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const campaign = await db.campaign.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!campaign) {
            return { success: false, error: 'Campaign not found' }
        }

        if (campaign.status === 'SENT') {
            return { success: false, error: 'Cannot update sent campaign' }
        }

        const updated = await db.campaign.update({
            where: { id },
            data: {
                name: data.title,
                description: data.description,
                messageTemplate: data.message,
                scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
                targetAudience: data.audienceType,
                targetLeadIds: data.audienceIds,
                filterTags: data.tags
            }
        })

        revalidatePath(`/campaigns/${id}`)
        revalidatePath('/campaigns')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const campaign = await db.campaign.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!campaign) {
            return { success: false, error: 'Campaign not found' }
        }

        if (campaign.status === 'SENDING') {
            return { success: false, error: 'Cannot delete campaign in progress' }
        }

        await db.campaign.delete({ where: { id } })

        revalidatePath('/campaigns')

        return { success: true, message: 'Campaign deleted successfully' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Send campaign immediately
 */
export async function sendCampaign(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const campaign = await db.campaign.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!campaign) {
            return { success: false, error: 'Campaign not found' }
        }

        if (campaign.status === 'SENT') {
            return { success: false, error: 'Campaign already sent' }
        }

        // Update status to sending
        await db.campaign.update({
            where: { id },
            data: { status: 'SENDING' }
        })

        // TODO: Trigger actual WhatsApp sending via job queue
        console.log(`[Campaign] Triggering send for campaign ${id}`)

        revalidatePath(`/campaigns/${id}`)
        revalidatePath('/campaigns')

        return { success: true, message: 'Campaign sending initiated' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
