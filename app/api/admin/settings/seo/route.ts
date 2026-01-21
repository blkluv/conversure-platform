import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const seoSchema = z.object({
    seoMetaTitle: z.string().max(60).optional().or(z.literal('')),
    seoMetaDescription: z.string().max(160).optional().or(z.literal('')),
    seoKeywords: z.array(z.string()).optional(),
    seoOgImageUrl: z.string().url().optional().or(z.literal('')),
    googleAnalyticsId: z.string().optional().or(z.literal('')),
    googleSearchConsoleCode: z.string().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'COMPANY_ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = seoSchema.parse(body)

        // Upsert company settings
        const settings = await db.companySettings.upsert({
            where: { companyId: session.companyId },
            update: {
                seoMetaTitle: data.seoMetaTitle || null,
                seoMetaDescription: data.seoMetaDescription || null,
                seoKeywords: data.seoKeywords || [],
                seoOgImageUrl: data.seoOgImageUrl || null,
                googleAnalyticsId: data.googleAnalyticsId || null,
                googleSearchConsoleCode: data.googleSearchConsoleCode || null,
            },
            create: {
                companyId: session.companyId,
                seoMetaTitle: data.seoMetaTitle || null,
                seoMetaDescription: data.seoMetaDescription || null,
                seoKeywords: data.seoKeywords || [],
                seoOgImageUrl: data.seoOgImageUrl || null,
                googleAnalyticsId: data.googleAnalyticsId || null,
                googleSearchConsoleCode: data.googleSearchConsoleCode || null,
            }
        })

        return NextResponse.json({
            success: true,
            settings
        })
    } catch (error) {
        console.error('[SEO Settings API] Error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Invalid data format', errors: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: 'Failed to save SEO settings' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const settings = await db.companySettings.findUnique({
            where: { companyId: session.companyId },
            select: {
                seoMetaTitle: true,
                seoMetaDescription: true,
                seoKeywords: true,
                seoOgImageUrl: true,
                googleAnalyticsId: true,
                googleSearchConsoleCode: true,
            }
        })

        return NextResponse.json({
            success: true,
            settings: settings || {
                seoMetaTitle: null,
                seoMetaDescription: null,
                seoKeywords: [],
                seoOgImageUrl: null,
                googleAnalyticsId: null,
                googleSearchConsoleCode: null,
            }
        })
    } catch (error) {
        console.error('[SEO Settings API] Error:', error)
        return NextResponse.json(
            { message: 'Failed to fetch SEO settings' },
            { status: 500 }
        )
    }
}
