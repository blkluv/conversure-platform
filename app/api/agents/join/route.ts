import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { z } from 'zod'

const agentJoinSchema = z.object({
    companyCode: z.string().min(6),
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = agentJoinSchema.parse(body)

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email: data.email },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: 'Email already registered' },
                { status: 400 }
            )
        }

        // Find company by code
        const company = await db.company.findFirst({
            where: {
                // For now, we'll match by name (in production, add a unique code field)
                name: {
                    contains: data.companyCode,
                    mode: 'insensitive',
                },
            },
        })

        if (!company) {
            return NextResponse.json(
                { message: 'Invalid company code. Please check with your admin.' },
                { status: 404 }
            )
        }

        // Create agent user (pending approval)
        const passwordHash = await hashPassword(data.password)
        const user = await db.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: 'AGENT',
                companyId: company.id,
                // In production, set isActive: false and require admin approval
            },
        })

        return NextResponse.json(
            {
                success: true,
                message: 'Your join request has been submitted. Please wait for admin approval.',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Agent Join API] Error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Invalid input data', errors: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: 'Join request failed' },
            { status: 500 }
        )
    }
}
