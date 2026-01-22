/**
 * Global Search Server Actions
 * 
 * Unified search across contacts, conversations, and messages
 * Ported from Rails Api::V1::Accounts::SearchController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * Global search across all entities
 */
export async function globalSearch(query: string, type: 'all' | 'contacts' | 'conversations' | 'messages' = 'all') {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const results: any = {}

        // Search contacts
        if (type === 'all' || type === 'contacts') {
            results.contacts = await db.lead.findMany({
                where: {
                    companyId: user.companyId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' as const } },
                        { email: { contains: query, mode: 'insensitive' as const } },
                        { phone: { contains: query, mode: 'insensitive' as const } }
                    ]
                },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    source: true
                }
            })
        }

        // Search conversations
        if (type === 'all' || type === 'conversations') {
            results.conversations = await db.conversation.findMany({
                where: {
                    companyId: user.companyId,
                    lead: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' as const } },
                            { phone: { contains: query, mode: 'insensitive' as const } }
                        ]
                    }
                },
                take: 10,
                include: {
                    lead: {
                        select: { id: true, name: true, phone: true }
                    }
                }
            })
        }

        // Search messages
        if (type === 'all' || type === 'messages') {
            results.messages = await db.message.findMany({
                where: {
                    conversation: {
                        companyId: user.companyId
                    },
                    body: {
                        contains: query,
                        mode: 'insensitive' as const
                    }
                },
                take: 10,
                include: {
                    conversation: {
                        include: {
                            lead: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            })
        }

        return { success: true, data: results }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
