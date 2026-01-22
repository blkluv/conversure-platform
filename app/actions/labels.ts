/**
 * Labels Server Actions
 * 
 * Tag management for contacts and conversations
 * Ported from Rails Api::V1::Accounts::LabelsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const labelSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#1f93ff'),
    showOnSidebar: z.boolean().default(true)
})

/**
 * Get all labels
 */
export async function getLabels() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const labels = await db.label.findMany({
            where: { companyId: user.companyId },
            orderBy: { title: 'asc' }
        })

        return { success: true, data: labels }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create label
 */
export async function createLabel(data: z.infer<typeof labelSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const validated = labelSchema.parse(data)

        const label = await db.label.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/settings/labels')

        return { success: true, data: label }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

/**
 * Update label
 */
export async function updateLabel(id: string, data: Partial<z.infer<typeof labelSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const label = await db.label.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!label) {
            return { success: false, error: 'Label not found' }
        }

        const updated = await db.label.update({
            where: { id },
            data
        })

        revalidatePath('/settings/labels')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete label
 */
export async function deleteLabel(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const label = await db.label.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!label) {
            return { success: false, error: 'Label not found' }
        }

        await db.label.delete({ where: { id } })

        revalidatePath('/settings/labels')

        return { success: true, message: 'Label deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
