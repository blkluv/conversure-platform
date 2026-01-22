/**
 * CSAT (Customer Satisfaction) Server Actions
 * 
 * Survey management and response tracking
 * Uses existing SurveyResponseBuilder service
 */

'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Get CSAT survey responses
 */
export async function getCSATResponses(filters?: {
    rating?: number
    dateFrom?: string
    dateTo?: string
    page?: number
}) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const page = filters?.page || 1
        const skip = (page - 1) * 25

        const where: any = {
            companyId: user.companyId
        }

        if (filters?.rating) {
            where.rating = filters.rating
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.createdAt = {}
            if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
            if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
        }

        const [responses, total] = await Promise.all([
            db.feedback.findMany({
                where,
                skip,
                take: 25,
                include: {
                    lead: {
                        select: { id: true, name: true, phone: true }
                    },
                    agent: {
                        select: { id: true, fullName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            db.feedback.count({ where })
        ])

        return {
            success: true,
            data: responses,
            pagination: {
                page,
                perPage: 25,
                total,
                totalPages: Math.ceil(total / 25)
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Get CSAT metrics
 */
export async function getCSATMetrics(dateFrom?: string, dateTo?: string) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = {
            companyId: user.companyId
        }

        if (dateFrom || dateTo) {
            where.createdAt = {}
            if (dateFrom) where.createdAt.gte = new Date(dateFrom)
            if (dateTo) where.createdAt.lte = new Date(dateTo)
        }

        const [total, ratings] = await Promise.all([
            db.feedback.count({ where }),
            db.feedback.groupBy({
                by: ['rating'],
                where,
                _count: true
            })
        ])

        const ratingsCount = ratings.reduce((acc, r) => {
            acc[r.rating] = r._count
            return acc
        }, {} as Record<number, number>)

        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.rating * r._count), 0) / total
            : 0

        return {
            success: true,
            data: {
                total,
                ratings: ratingsCount,
                averageRating: Number(averageRating.toFixed(2))
            }
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Export CSAT data to CSV
 */
export async function exportCSATData(filters?: any) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('Unauthorized')

        const where: any = {
            companyId: user.companyId,
            ...filters
        }

        const responses = await db.feedback.findMany({
            where,
            include: {
                lead: true,
                agent: true
            },
            orderBy: { createdAt: 'desc' }
        })

        const headers = ['Date', 'Contact', 'Phone', 'Rating', 'Comment', 'Agent']
        const rows = responses.map(r => [
            r.createdAt.toISOString(),
            r.lead?.name || '',
            r.lead?.phone || '',
            r.rating.toString(),
            r.comment || '',
            r.agent?.fullName || ''
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

        return {
            success: true,
            data: csv,
            filename: `csat-export-${new Date().toISOString().split('T')[0]}.csv`
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
