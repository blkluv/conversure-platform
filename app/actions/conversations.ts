/**
 * Conversations Enhanced Server Actions
 * 
 * Advanced conversation operations including status management, filters, and assignments
 * Ported from Rails Api::V1::Accounts::ConversationsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const RESULTS_PER_PAGE = 20

/**
 * Get conversations with filters
 */
export async function getConversations(filters?: {
    status?: string
    agentId?: string
    inboxId?: string
    page?: number
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const page = filters?.page || 1
        const skip = (page - 1) * RESULTS_PER_PAGE

        const where: any = {
            companyId: user.companyId
        }

        if (filters?.status) where.status = filters.status
        if (filters?.agentId) where.agentId = filters.agentId

        const [conversations, total] = await Promise.all([
            db.conversation.findMany({
                where,
                skip,
                take: RESULTS_PER_PAGE,
                include: {
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    },
                    messages: {
                        take: 1,
                        orderBy: { sentAt: 'desc' }
                    }
                },
                orderBy: { lastMessageAt: 'desc' }
            }),
            db.conversation.count({ where })
        ])

        return {
            success: true,
            data: conversations,
            pagination: {
                page,
                perPage: RESULTS_PER_PAGE,
                total,
                totalPages: Math.ceil(total / RESULTS_PER_PAGE)
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(id: string, status: 'OPEN' | 'PENDING' | 'RESOLVED') {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const conversation = await db.conversation.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!conversation) {
            return { success: false, error: 'Conversation not found' }
        }

        const updated = await db.conversation.update({
            where: { id },
            data: { status }
        })

        revalidatePath(`/conversations/${id}`)
        revalidatePath('/conversations')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Assign conversation to agent
 */
export async function assignConversation(conversationId: string, agentId: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify agent belongs to same company
        const agent = await db.user.findFirst({
            where: {
                id: agentId,
                companyId: user.companyId
            }
        })

        if (!agent) {
            return { success: false, error: 'Agent not found' }
        }

        const conversation = await db.conversation.findFirst({
            where: { id: conversationId, companyId: user.companyId }
        })

        if (!conversation) {
            return { success: false, error: 'Conversation not found' }
        }

        const updated = await db.conversation.update({
            where: { id: conversationId },
            data: { agentId }
        })

        revalidatePath(`/conversations/${conversationId}`)
        revalidatePath('/conversations')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Search conversations
 */
export async function searchConversations(query: string, page: number = 1) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const skip = (page - 1) * RESULTS_PER_PAGE

        const conversations = await db.conversation.findMany({
            where: {
                companyId: user.companyId,
                lead: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' as const } },
                        { phone: { contains: query, mode: 'insensitive' as const } }
                    ]
                }
            },
            skip,
            take: RESULTS_PER_PAGE,
            include: {
                lead: true,
                agent: {
                    select: { id: true, fullName: true }
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        })

        return { success: true, data: conversations }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Toggle conversation priority
 */
export async function toggleConversationPriority(id: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const conversation = await db.conversation.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!conversation) {
            return { success: false, error: 'Conversation not found' }
        }

        const updated = await db.conversation.update({
            where: { id },
            data: { priority }
        })

        revalidatePath(`/conversations/${id}`)

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Mute conversation
 */
export async function muteConversation(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const updated = await db.conversation.update({
            where: { id },
            data: { status: 'SNOOZED' }
        })

        revalidatePath(`/conversations/${id}`)

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Bulk conversation actions
 */
export async function bulkConversationAction(action: string, conversationIds: string[], params?: any) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const conversations = await db.conversation.findMany({
            where: {
                id: { in: conversationIds },
                companyId: user.companyId
            }
        })

        if (conversations.length !== conversationIds.length) {
            throw new Error('Some conversations not found')
        }

        let result

        switch (action) {
            case 'assign':
                result = await db.conversation.updateMany({
                    where: { id: { in: conversationIds } },
                    data: { agentId: params.agentId }
                })
                break

            case 'update_status':
                result = await db.conversation.updateMany({
                    where: { id: { in: conversationIds } },
                    data: { status: params.status }
                })
                break

            case 'set_priority':
                result = await db.conversation.updateMany({
                    where: { id: { in: conversationIds } },
                    data: { priority: params.priority }
                })
                break

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/conversations')

        return {
            success: true,
            message: `${action} completed for ${conversationIds.length} conversations`,
            result
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
