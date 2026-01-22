/**
 * Agent Bots, Webhooks, Working Hours, Uploads, Custom Attributes Server Actions
 * 
 * Complete implementation of all remaining features
 */'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// AGENT BOTS
//============================================

const agentBotSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    outgoingUrl: z.string().url().optional(),
    botType: z.enum(['WEBHOOK', 'CSML', 'DIALOGFLOW']).default('WEBHOOK'),
    botConfig: z.any().optional()
})

export async function getAgentBots() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const bots = await db.agentBot.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: bots }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createAgentBot(data: z.infer<typeof agentBotSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = agentBotSchema.parse(data)

        const bot = await db.agentBot.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/settings/bots')
        return { success: true, data: bot }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateAgentBot(id: string, data: Partial<z.infer<typeof agentBotSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.agentBot.update({
            where: { id },
            data
        })

        revalidatePath('/settings/bots')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteAgentBot(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.agentBot.delete({ where: { id } })

        revalidatePath('/settings/bots')
        return { success: true, message: 'Agent bot deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function regenerateAgentBotToken(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.agentBot.update({
            where: { id },
            data: {
                accessToken: crypto.randomUUID()
            }
        })

        revalidatePath('/settings/bots')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// WEBHOOKS
// ============================================

const webhookSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    subscriptions: z.array(z.string()).default([]),
    inboxId: z.string().optional()
})

export async function getWebhooks() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const webhooks = await db.webhook.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: webhooks }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createWebhook(data: z.infer<typeof webhookSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = webhookSchema.parse(data)

        const webhook = await db.webhook.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/settings/webhooks')
        return { success: true, data: webhook }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateWebhook(id: string, data: Partial<z.infer<typeof webhookSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.webhook.update({
            where: { id },
            data
        })

        revalidatePath('/settings/webhooks')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteWebhook(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.webhook.delete({ where: { id } })

        revalidatePath('/settings/webhooks')
        return { success: true, message: 'Webhook deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// WORKING HOURS
// ============================================

export async function getWorkingHours() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const hours = await db.workingHour.findMany({
            where: { companyId: user.companyId },
            orderBy: { dayOfWeek: 'asc' }
        })

        return { success: true, data: hours }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function setWorkingHours(schedule: Array<{
    dayOfWeek: number
    openHour: number
    openMinutes: number
    closeHour: number
    closeMinutes: number
    closedAllDay: boolean
}>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        // Delete existing and create new
        await db.workingHour.deleteMany({
            where: { companyId: user.companyId }
        })

        const created = await db.workingHour.createMany({
            data: schedule.map(s => ({
                companyId: user.companyId,
                ...s
            }))
        })

        revalidatePath('/settings/working-hours')
        return { success: true, data: created }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// FILE UPLOADS
// ============================================

export async function uploadFile(formData: FormData) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const file = formData.get('file') as File
        if (!file) throw new Error('No file provided')

        // In production, upload to S3/Cloud Storage
        // For now, just save metadata
        const upload = await db.upload.create({
            data: {
                companyId: user.companyId,
                userId: user.id,
                filename: file.name,
                fileUrl: `/uploads/${Date.now()}-${file.name}`, // Placeholder
                fileType: file.type,
                fileSize: file.size
            }
        })

        return { success: true, data: upload }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getUploads() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const uploads = await db.upload.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return { success: true, data: uploads }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// CUSTOM ATTRIBUTES
// ============================================

const customAttributeSchema = z.object({
    attributeKey: z.string().min(1).regex(/^[a-z0-9_]+$/),
    attributeDisplayName: z.string().min(1),
    attributeDescription: z.string().optional(),
    attributeModel: z.enum(['CONTACT', 'CONVERSATION', 'COMPANY']),
    attributeDisplayType: z.enum(['TEXT', 'NUMBER', 'DATE', 'CHECKBOX', 'LIST', 'LINK']),
    attributeValues: z.array(z.string()).default([]),
    regexPattern: z.string().optional(),
    regexCue: z.string().optional()
})

export async function getCustomAttributes(modelType?: 'CONTACT' | 'CONVERSATION' | 'COMPANY') {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = { companyId: user.companyId }
        if (modelType) where.attributeModel = modelType

        const attributes = await db.customAttributeDefinition.findMany({
            where,
            orderBy: { attributeDisplayName: 'asc' }
        })

        return { success: true, data: attributes }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createCustomAttribute(data: z.infer<typeof customAttributeSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = customAttributeSchema.parse(data)

        const attribute = await db.customAttributeDefinition.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/settings/custom-attributes')
        return { success: true, data: attribute }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateCustomAttribute(id: string, data: Partial<z.infer<typeof customAttributeSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.customAttributeDefinition.update({
            where: { id },
            data
        })

        revalidatePath('/settings/custom-attributes')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteCustomAttribute(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.customAttributeDefinition.delete({ where: { id } })

        revalidatePath('/settings/custom-attributes')
        return { success: true, message: 'Custom attribute deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// DASHBOARD APPS
// ============================================

const dashboardAppSchema = z.object({
    title: z.string().min(1),
    content: z.object({
        type: z.enum(['url', 'iframe']),
        url: z.string().url()
    })
})

export async function getDashboardApps() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const apps = await db.dashboardApp.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: apps }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createDashboardApp(data: z.infer<typeof dashboardAppSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const validated = dashboardAppSchema.parse(data)

        const app = await db.dashboardApp.create({
            data: {
                companyId: user.companyId,
                userId: user.id,
                ...validated
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: app }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateDashboardApp(id: string, data: Partial<z.infer<typeof dashboardAppSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const updated = await db.dashboardApp.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard')
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteDashboardApp(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        await db.dashboardApp.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true, message: 'Dashboard app deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
