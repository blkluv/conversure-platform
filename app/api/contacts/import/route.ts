import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { normalizePhone } from '@/lib/messaging/PhoneNormalizer'
import { z } from 'zod'

const leadImportSchema = z.object({
    leads: z.array(
        z.object({
            name: z.string().min(2),
            phone: z.string().min(8),
            email: z.string().email().optional(),
            propertyType: z.string().optional(),
            location: z.string().optional(),
            bedrooms: z.number().optional(),
            budget: z.string().optional(),
            source: z.string().optional(),
            notes: z.string().optional(),
        })
    ),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { leads } = leadImportSchema.parse(body)

        // Fetch company settings to get default WhatsApp number
        const company = await db.company.findUnique({
            where: { id: session.companyId },
            include: { whatsappNumbers: true }
        })

        const defaultWhatsappNumber = company?.whatsappBusinessNumber ||
            company?.whatsappNumbers[0]?.number ||
            '+971500000000'

        const results = {
            imported: 0,
            skipped: 0,
            errors: [] as string[],
        }

        // Process each lead
        for (const leadData of leads) {
            try {
                // Normalize phone number
                let e164 = ''
                try {
                    e164 = normalizePhone(leadData.phone)
                } catch (e) {
                    results.errors.push(`Invalid phone: ${leadData.phone}`)
                    results.skipped++
                    continue
                }

                // Check if lead already exists for this company
                const existingLead = await db.lead.findFirst({
                    where: {
                        companyId: session.companyId,
                        phone: e164,
                    },
                })

                if (existingLead) {
                    // Update existing lead
                    await db.lead.update({
                        where: { id: existingLead.id },
                        data: {
                            name: leadData.name,
                            email: leadData.email,
                            propertyType: leadData.propertyType,
                            location: leadData.location,
                            bedrooms: leadData.bedrooms,
                            budget: leadData.budget,
                            // notes: leadData.notes, // Field does not exist in Lead model
                            // lastContactedAt: new Date(),
                        },
                    })
                    results.imported++
                } else {
                    // Create new lead
                    const newLead = await db.lead.create({
                        data: {
                            companyId: session.companyId,
                            name: leadData.name,
                            phone: e164,
                            email: leadData.email,
                            propertyType: leadData.propertyType,
                            location: leadData.location,
                            bedrooms: leadData.bedrooms,
                            budget: leadData.budget,
                            source: leadData.source || 'CSV Import',
                            // notes: leadData.notes, // Field does not exist in Lead model
                            status: 'NEW',
                            // lastContactedAt: new Date(),
                        },
                    })

                    // Create conversation for this lead
                    await db.conversation.create({
                        data: {
                            companyId: session.companyId,
                            leadId: newLead.id,
                            status: 'ACTIVE',
                            lastMessageAt: new Date(),
                            whatsappNumber: defaultWhatsappNumber,
                        },
                    })

                    results.imported++
                }
            } catch (error: any) {
                console.error('[Lead Import] Error processing lead:', error)
                results.errors.push(`${leadData.name}: ${error.message}`)
                results.skipped++
            }
        }

        return NextResponse.json({
            success: true,
            imported: results.imported,
            skipped: results.skipped,
            errors: results.errors,
            message: `Successfully imported ${results.imported} leads`,
        })
    } catch (error) {
        console.error('[Lead Import API] Error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Invalid data format', errors: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: 'Failed to import leads' },
            { status: 500 }
        )
    }
}
