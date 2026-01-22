/**
 * Articles & Knowledge Base Server Actions
 * 
 * Complete portal, category, and article management
 * Ported from Rails Controllers
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// PORTALS
// ============================================

const portalSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    color: z.string().default('#1f93ff'),
    headerText: z.string().optional(),
    homepageLink: z.string().url().optional(),
    customDomain: z.string().optional()
})

export async function getPortals() {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const portals = await db.portal.findMany({
            where: { companyId: user.companyId },
            include: {
                _count: {
                    select: { articles: true, categories: true }
                }
            }
        })

        return { success: true, data: portals }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createPortal(data: z.infer<typeof portalSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = portalSchema.parse(data)

        const portal = await db.portal.create({
            data: {
                companyId: user.companyId,
                ...validated
            }
        })

        revalidatePath('/portals')
        return { success: true, data: portal }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updatePortal(id: string, data: Partial<z.infer<typeof portalSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const portal = await db.portal.findFirst({
            where: { id, companyId: user.companyId }
        })

        if (!portal) return { success: false, error: 'Portal not found' }

        const updated = await db.portal.update({
            where: { id },
            data
        })

        revalidatePath(`/portals/${id}`)
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deletePortal(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.portal.delete({ where: { id } })

        revalidatePath('/portals')
        return { success: true, message: 'Portal deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// CATEGORIES
// ============================================

const categorySchema = z.object({
    portalId: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    icon: z.string().optional(),
    position: z.number().default(0),
    locale: z.string().default('en'),
    parentCategoryId: z.string().optional()
})

export async function getCategories(portalId: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const categories = await db.category.findMany({
            where: { portal: { companyId: user.companyId }, portalId },
            include: {
                _count: { select: { articles: true } }
            },
            orderBy: { position: 'asc' }
        })

        return { success: true, data: categories }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = categorySchema.parse(data)

        const category = await db.category.create({
            data: validated
        })

        revalidatePath(`/portals/${data.portalId}`)
        return { success: true, data: category }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateCategory(id: string, data: Partial<z.infer<typeof categorySchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.category.update({
            where: { id },
            data
        })

        revalidatePath(`/portals`)
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteCategory(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.category.delete({ where: { id } })

        revalidatePath('/portals')
        return { success: true, message: 'Category deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// ARTICLES
// ============================================

const articleSchema = z.object({
    portalId: z.string(),
    categoryId: z.string().optional(),
    title: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    content: z.string(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    locale: z.string().default('en'),
    position: z.number().default(0),
    meta: z.any().optional()
})

export async function getArticles(portalId: string, filters?: {
    categoryId?: string
    status?: string
    locale?: string
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = {
            portal: { companyId: user.companyId },
            portalId
        }

        if (filters?.categoryId) where.categoryId = filters.categoryId
        if (filters?.status) where.status = filters.status
        if (filters?.locale) where.locale = filters.locale

        const articles = await db.article.findMany({
            where,
            include: {
                category: true,
                author: {
                    select: { id: true, fullName: true }
                }
            },
            orderBy: { position: 'asc' }
        })

        return { success: true, data: articles }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function createArticle(data: z.infer<typeof articleSchema>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const validated = articleSchema.parse(data)

        const article = await db.article.create({
            data: {
                ...validated,
                authorId: user.id,
                publishedAt: validated.status === 'PUBLISHED' ? new Date() : null
            }
        })

        revalidatePath(`/portals/${data.portalId}`)
        return { success: true, data: article }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Validation error', details: error.errors }
        }
        return { success: false, error: error.message }
    }
}

export async function updateArticle(id: string, data: Partial<z.infer<typeof articleSchema>>) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        const updated = await db.article.update({
            where: { id },
            data: {
                ...data,
                publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined
            }
        })

        revalidatePath(`/portals`)
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteArticle(id: string) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role === 'AGENT') throw new Error('Unauthorized')

        await db.article.delete({ where: { id } })

        revalidatePath('/portals')
        return { success: true, message: 'Article deleted' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function searchArticles(portalId: string, query: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const articles = await db.article.findMany({
            where: {
                portal: { companyId: user.companyId },
                portalId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' as const } },
                    { content: { contains: query, mode: 'insensitive' as const } },
                    { description: { contains: query, mode: 'insensitive' as const } }
                ]
            },
            include: {
                category: true
            },
            take: 20
        })

        return { success: true, data: articles }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
