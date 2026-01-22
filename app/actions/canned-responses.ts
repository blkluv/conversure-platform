/**
 * Canned Responses Server Actions
 * 
 * Quick reply templates for agents
 * Ported from Rails Api::V1::Accounts::CannedResponsesController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const cannedResponseSchema = z.object({
    shortCode: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
    content: z.string().min(1, 'Content is required')
})

/**
 * Get all canned responses
 */
export async function getCannedResponses(search?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = { companyId: user.companyId }

        if (search) {
            where.OR = [
                { shortCode: { contains: search, mode: 'insensitive' as const } },
                { content: { contains: search, mode: 'insensitive' as const } }
            ]
        }

        const responses = await db.cannedResponse.findMany({
            where,
            orderBy: { shortCode: 'asc' },
            include: {
                createdBy: {
                    select: { id: true, fullName: true }
                }
            }
        })

        return { success: true, data: responses }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create canned response
 */
export async function createCannedResponse(data: z.infer<typeof cannedResponseSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const validated = cannedResponseSchema.parse(data)

        // Check if shortCode already exists
        const existing = await db.cannedResponse.findFirst({
            where: {
                companyId: user.companyId,
                shortCode: validated.shortCode
            }
        })

        if (existing) {
            return { success: false, error: 'Short code already exists' }
        }

        const response = await db.cannedResponse.create({
            data: {
                companyId: user.companyId,
                shortCode: validated.shortCode,
                content: validated.content,
                createdById: user.id
            }
        })

        revalidatePath('/settings/canned-responses')

        return { success: true, data: response }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

/**
 * Update canned response
 */
export async function updateCannedResponse(id: string, data: Partial<z.infer<typeof cannedResponseSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const response = await db.cannedResponse.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!response) {
            return { success: false, error: 'Canned response not found' }
        }

        // Check shortCode uniqueness if changing
        if (data.shortCode && data.shortCode !== response.shortCode) {
            const existing = await db.cannedResponse.findFirst({
                where: {
                    companyId: user.companyId,
                    shortCode: data.shortCode,
                    id: { not: id }
                }
            })

            if (existing) {
                return { success: false, error: 'Short code already exists' }
            }
        }

        const updated = await db.cannedResponse.update({
            where: { id },
            data: {
                shortCode: data.shortCode,
                content: data.content
            }
        })

        revalidatePath('/settings/canned-responses')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete canned response
 */
export async function deleteCannedResponse(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const response = await db.cannedResponse.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!response) {
            return { success: false, error: 'Canned response not found' }
        }

        await db.cannedResponse.delete({ where: { id } })

        revalidatePath('/settings/canned-responses')

        return { success: true, message: 'Canned response deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
