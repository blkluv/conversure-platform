/**
 * Automation Rules Server Actions
 * 
 * Workflow automation with conditions and actions
 * Ported from Rails Api::V1::Accounts::AutomationRulesController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const automationRuleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    eventName: z.string().min(1, 'Event name is required'),
    conditions: z.any(), // JSON conditions
    actions: z.any(), // JSON actions
    active: z.boolean().default(true)
})

/**
 * Get all automation rules
 */
export async function getAutomationRules() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const rules = await db.automationRule.findMany({
            where: { companyId: user.companyId },
            include: {
                createdBy: {
                    select: { id: true, fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: rules }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Create automation rule
 */
export async function createAutomationRule(data: z.infer<typeof automationRuleSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Admin access required')
        }

        const validated = automationRuleSchema.parse(data)

        const rule = await db.automationRule.create({
            data: {
                companyId: user.companyId,
                createdById: user.id,
                ...validated
            }
        })

        revalidatePath('/settings/automation')

        return { success: true, data: rule }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

/**
 * Update automation rule
 */
export async function updateAutomationRule(id: string, data: Partial<z.infer<typeof automationRuleSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const rule = await db.automationRule.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!rule) {
            return { success: false, error: 'Automation rule not found' }
        }

        const updated = await db.automationRule.update({
            where: { id },
            data
        })

        revalidatePath('/settings/automation')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete automation rule
 */
export async function deleteAutomationRule(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const rule = await db.automationRule.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!rule) {
            return { success: false, error: 'Automation rule not found' }
        }

        await db.automationRule.delete({ where: { id } })

        revalidatePath('/settings/automation')

        return { success: true, message: 'Automation rule deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Toggle automation rule active status
 */
export async function toggleAutomationRule(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized')
        }

        const rule = await db.automationRule.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!rule) {
            return { success: false, error: 'Automation rule not found' }
        }

        const updated = await db.automationRule.update({
            where: { id },
            data: { active: !rule.active }
        })

        revalidatePath('/settings/automation')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
