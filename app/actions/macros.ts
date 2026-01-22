/**
 * Assignment Policies & Macros Server Actions
 * 
 * Assignment automation and macro (saved action sequences)
 * Ported from Rails Controllers
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Execute a macro on conversations
 */
export async function executeMacro(macroId: string, conversationIds: string[]) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        // Get automation rule (we're using automation rules as macros)
        const macro = await db.automationRule.findFirst({
            where: {
                id: macroId,
                companyId: user.companyId
            }
        })

        if (!macro) {
            return { success: false, error: 'Macro not found' }
        }

        // Execute actions on each conversation
        const actions = macro.actions as any
        const results = []

        for (const convId of conversationIds) {
            try {
                const conversation = await db.conversation.findFirst({
                    where: { id: convId, companyId: user.companyId }
                })

                if (!conversation) continue

                // Apply macro actions
                const updates: any = {}

                if (actions.assign_agent) updates.agentId = actions.assign_agent
                if (actions.change_status) updates.status = actions.change_status
                // if (actions.set_priority) updates.priority = actions.set_priority // Priority field doesn't exist

                if (Object.keys(updates).length > 0) {
                    await db.conversation.update({
                        where: { id: convId },
                        data: updates
                    })
                }

                results.push({ conversationId: convId, success: true })
            } catch (error) {
                results.push({ conversationId: convId, success: false, error: String(error) })
            }
        }

        revalidatePath('/conversations')

        return {
            success: true,
            message: `Macro executed on ${results.length} conversations`,
            results
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Get assignable agents for inbox
 */
export async function getAssignableAgents(inboxId?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        // For now, return all active agents in company
        const agents = await db.user.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
                role: { in: ['AGENT', 'COMPANY_ADMIN'] }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true
            },
            orderBy: { fullName: 'asc' }
        })

        return { success: true, data: agents }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Auto-assign conversation to available agent
 */
export async function autoAssignConversation(conversationId: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const conversation = await db.conversation.findFirst({
            where: { id: conversationId, companyId: user.companyId }
        })

        if (!conversation) {
            return { success: false, error: 'Conversation not found' }
        }

        // Find agent with least active conversations
        const agents = await db.user.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
                role: { in: ['AGENT', 'COMPANY_ADMIN'] }
            },
            include: {
                _count: {
                    select: {
                        conversations: {
                            where: {
                                status: { in: ['ACTIVE', 'PENDING'] }
                            }
                        }
                    }
                }
            }
        })

        if (agents.length === 0) {
            return { success: false, error: 'No agents available' }
        }

        // Sort by least active conversations
        agents.sort((a, b) => a._count.conversations - b._count.conversations)
        const selectedAgent = agents[0]

        // Assign
        await db.conversation.update({
            where: { id: conversationId },
            data: { agentId: selectedAgent.id }
        })

        revalidatePath(`/conversations/${conversationId}`)

        return {
            success: true,
            data: {
                conversationId,
                assignedAgent: {
                    id: selectedAgent.id,
                    name: selectedAgent.fullName
                }
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
