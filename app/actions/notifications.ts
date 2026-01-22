/**
 * Notifications & Macros (Full Implementation) Server Actions
 * 
 * Complete notification system and macro management
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(filters?: {
    unreadOnly?: boolean
    page?: number
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const page = filters?.page || 1
        const perPage = 25
        const skip = (page - 1) * perPage

        const where: any = {
            userId: user.id,
            companyId: user.companyId
        }

        if (filters?.unreadOnly) {
            where.readAt = null
        }

        const [notifications, total, unreadCount] = await Promise.all([
            db.notification.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { createdAt: 'desc' }
            }),
            db.notification.count({ where }),
            db.notification.count({
                where: {
                    userId: user.id,
                    companyId: user.companyId,
                    readAt: null
                }
            })
        ])

        return {
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage)
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function markNotificationRead(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const updated = await db.notification.update({
            where: { id, userId: user.id },
            data: { readAt: new Date() }
        })

        revalidatePath('/notifications')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function markAllNotificationsRead() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await db.notification.updateMany({
            where: {
                userId: user.id,
                companyId: user.companyId,
                readAt: null
            },
            data: { readAt: new Date() }
        })

        revalidatePath('/notifications')
        return { success: true, message: 'All notifications marked as read' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function snoozeNotification(id: string, until: Date) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const updated = await db.notification.update({
            where: { id, userId: user.id },
            data: { snoozedUntil: until }
        })

        revalidatePath('/notifications')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteNotification(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await db.notification.delete({
            where: { id, userId: user.id }
        })

        revalidatePath('/notifications')
        return { success: true, message: 'Notification deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAllReadNotifications() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const result = await db.notification.deleteMany({
            where: {
                userId: user.id,
                companyId: user.companyId,
                readAt: { not: null }
            }
        })

        revalidatePath('/notifications')
        return { success: true, message: `Deleted ${result.count} notifications` }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getNotificationSettings() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const settings = await db.notificationSetting.findUnique({
            where: {
                userId_companyId: {
                    userId: user.id,
                    companyId: user.companyId
                }
            }
        })

        return { success: true, data: settings }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateNotificationSettings(data: {
    selectedEmailFlags?: string[]
    selectedPushFlags?: string[]
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const settings = await db.notificationSetting.upsert({
            where: {
                userId_companyId: {
                    userId: user.id,
                    companyId: user.companyId
                }
            },
            create: {
                userId: user.id,
                companyId: user.companyId,
                selectedEmailFlags: data.selectedEmailFlags || [],
                selectedPushFlags: data.selectedPushFlags || []
            },
            update: data
        })

        revalidatePath('/settings/notifications')
        return { success: true, data: settings }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// MACROS (FULL IMPLEMENTATION)
// ============================================

const macroSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    actions: z.any(),
    visibility: z.enum(['GLOBAL', 'PERSONAL', 'TEAM']).default('GLOBAL')
})

export async function getMacros(visibility?: 'GLOBAL' | 'PERSONAL' | 'TEAM') {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = {
            companyId: user.companyId
        }

        if (visibility) {
            where.visibility = visibility
        } else {
            // Show all macros user has access to
            where.OR = [
                { visibility: 'GLOBAL' },
                { visibility: 'PERSONAL', createdById: user.id }
            ]
        }

        const macros = await db.macro.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: macros }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createMacro(data: z.infer<typeof macroSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const validated = macroSchema.parse(data)

        const macro = await db.macro.create({
            data: {
                companyId: user.companyId,
                createdById: user.id,
                name: validated.name,
                description: validated.description,
                actions: validated.actions
            }
        })

        revalidatePath('/settings/macros')
        return { success: true, data: macro }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateMacro(id: string, data: Partial<z.infer<typeof macroSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const macro = await db.macro.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!macro) {
            return { success: false, error: 'Macro not found' }
        }

        // Personal macros can only be edited by creator
        if (macro.visibility === 'PERSONAL' && macro.createdById !== user.id) {
            return { success: false, error: 'Cannot edit personal macro of another user' }
        }

        const updated = await db.macro.update({
            where: { id },
            data: {
                ...data,
                updatedById: user.id
            }
        })

        revalidatePath('/settings/macros')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteMacro(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const macro = await db.macro.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!macro) {
            return { success: false, error: 'Macro not found' }
        }

        // Only creator can delete personal macros, admins can delete global
        if (macro.visibility === 'PERSONAL' && macro.createdById !== user.id) {
            return { success: false, error: 'Cannot delete personal macro of another user' }
        }

        if (macro.visibility === 'GLOBAL' && user.role === 'AGENT') {
            return { success: false, error: 'Only admins can delete global macros' }
        }

        await db.macro.delete({ where: { id } })

        revalidatePath('/settings/macros')
        return { success: true, message: 'Macro deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
