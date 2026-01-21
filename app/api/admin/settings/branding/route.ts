import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const brandingSchema = z.object({
    logoUrl: z.string().url().optional().or(z.literal('')),
    faviconUrl: z.string().url().optional().or(z.literal('')),
    primaryBrandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryBrandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'COMPANY_ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = brandingSchema.parse(body)

        // Upsert company settings
        const settings = await db.companySettings.upsert({
            where: { companyId: session.companyId },
            update: {
                logoUrl: data.logoUrl || null,
                faviconUrl: data.faviconUrl || null,
                primaryBrandColor: data.primaryBrandColor || null,
                secondaryBrandColor: data.secondaryBrandColor || null,
            },
            create: {
                companyId: session.companyId,
                logoUrl: data.logoUrl || null,
                faviconUrl: data.faviconUrl || null,
                primaryBrandColor: data.primaryBrandColor || null,
                secondaryBrandColor: data.secondaryBrandColor || null,
            }
        })

        return NextResponse.json({
            success: true,
            settings
        })
    } catch (error) {
        console.error('[Branding Settings API] Error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Invalid data format', errors: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: 'Failed to save branding settings' },
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
                logoUrl: true,
                faviconUrl: true,
                primaryBrandColor: true,
                secondaryBrandColor: true,
            }
        })

        return NextResponse.json({
            success: true,
            settings: settings || {
                logoUrl: null,
                faviconUrl: null,
                primaryBrandColor: null,
                secondaryBrandColor: null,
            }
        })
    } catch (error) {
        console.error('[Branding Settings API] Error:', error)
        return NextResponse.json(
            { message: 'Failed to fetch branding settings' },
            { status: 500 }
        )
    }
}
