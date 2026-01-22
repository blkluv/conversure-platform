/**
 * Contacts Enhanced Server Actions
 * 
 * Advanced contact operations including search, export, filters, and bulk actions
 * Ported from Rails Api::V1::Accounts::ContactsController
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const RESULTS_PER_PAGE = 15

/**
 * Search contacts with pagination
 */
export async function searchContacts(query: string, page: number = 1) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const skip = (page - 1) * RESULTS_PER_PAGE

        const where = {
            companyId: user.companyId,
            OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                { email: { contains: query, mode: 'insensitive' as const } },
                { phone: { contains: query, mode: 'insensitive' as const } },
                { bitrixLeadId: { contains: query, mode: 'insensitive' as const } }
            ]
        }

        const [contacts, total] = await Promise.all([
            db.lead.findMany({
                where,
                skip,
                take: RESULTS_PER_PAGE,
                orderBy: { createdAt: 'desc' },
                include: {
                    conversations: {
                        take: 1,
                        orderBy: { lastMessageAt: 'desc' }
                    }
                }
            }),
            db.lead.count({ where })
        ])

        return {
            success: true,
            data: contacts,
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
 * Export contacts to CSV
 */
export async function exportContacts(filters?: any) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const contacts = await db.lead.findMany({
            where: {
                companyId: user.companyId,
                ...filters
            },
            orderBy: { createdAt: 'desc' }
        })

        // Generate CSV
        const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Created At']
        const rows = contacts.map(c => [
            c.name || '',
            c.email || '',
            c.phone || '',
            c.source || '',
            c.status || '',
            c.createdAt.toISOString()
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

        return {
            success: true,
            data: csv,
            filename: `contacts-export-${new Date().toISOString().split('T')[0]}.csv`
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Filter contacts with advanced criteria
 */
export async function filterContacts(filters: {
    status?: string[]
    source?: string[]
    tags?: string[]
    dateFrom?: string
    dateTo?: string
    page?: number
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const page = filters.page || 1
        const skip = (page - 1) * RESULTS_PER_PAGE

        const where: any = {
            companyId: user.companyId
        }

        if (filters.status?.length) {
            where.status = { in: filters.status }
        }

        if (filters.source?.length) {
            where.source = { in: filters.source }
        }

        if (filters.tags?.length) {
            where.tags = { hasSome: filters.tags }
        }

        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {}
            if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
            if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
        }

        const [contacts, total] = await Promise.all([
            db.lead.findMany({
                where,
                skip,
                take: RESULTS_PER_PAGE,
                orderBy: { createdAt: 'desc' }
            }),
            db.lead.count({ where })
        ])

        return {
            success: true,
            data: contacts,
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
 * Get contact by ID with full details
 */
export async function getContact(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const contact = await db.lead.findFirst({
            where: {
                id,
                companyId: user.companyId
            },
            include: {
                conversations: {
                    include: {
                        messages: {
                            take: 10,
                            orderBy: { sentAt: 'desc' }
                        }
                    },
                    orderBy: { lastMessageAt: 'desc' }
                },
                agent: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        })

        if (!contact) {
            return { success: false, error: 'Contact not found' }
        }

        return { success: true, data: contact }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Update contact
 */
export async function updateContact(id: string, data: {
    name?: string
    email?: string
    phone?: string
    status?: string
    tags?: string[]
    notes?: string
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const contact = await db.lead.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!contact) {
            return { success: false, error: 'Contact not found' }
        }

        const updated = await db.lead.update({
            where: { id },
            data
        })

        revalidatePath(`/contacts/${id}`)
        revalidatePath('/contacts')

        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete contact
 */
export async function deleteContact(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') {
            throw new Error('Unauthorized: Admin access required')
        }

        const contact = await db.lead.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!contact) {
            return { success: false, error: 'Contact not found' }
        }

        await db.lead.delete({ where: { id } })

        revalidatePath('/contacts')

        return { success: true, message: 'Contact deleted successfully' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Bulk operations on contacts
 */
export async function bulkContactAction(action: string, contactIds: string[], params?: any) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const contacts = await db.lead.findMany({
            where: {
                id: { in: contactIds },
                companyId: user.companyId
            }
        })

        if (contacts.length !== contactIds.length) {
            throw new Error('Some contacts not found')
        }

        let result

        switch (action) {
            case 'assign':
                result = await db.lead.updateMany({
                    where: { id: { in: contactIds } },
                    data: { agentId: params.agentId }
                })
                break

            case 'add_tags':
                for (const id of contactIds) {
                    const contact = contacts.find(c => c.id === id)
                    await db.lead.update({
                        where: { id },
                        data: {
                            tags: [...(contact?.tags || []), ...(params.tags || [])]
                        }
                    })
                }
                result = { count: contactIds.length }
                break

            case 'update_status':
                result = await db.lead.updateMany({
                    where: { id: { in: contactIds } },
                    data: { status: params.status }
                })
                break

            case 'delete':
                if (user.role === 'AGENT') {
                    throw new Error('Unauthorized: Admin access required for deletion')
                }
                result = await db.lead.deleteMany({
                    where: { id: { in: contactIds } }
                })
                break

            default:
                throw new Error(`Unknown action: ${action}`)
        }

        revalidatePath('/contacts')

        return {
            success: true,
            message: `${action} completed for ${contactIds.length} contacts`,
            result
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
