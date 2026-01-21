// Company signup API route with Stripe trial automation
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword, createSession } from "@/lib/auth"
import { z } from "zod"

const signupSchema = z.object({
  companyName: z.string().min(2),
  domain: z.string().url().optional().or(z.literal("")),
  country: z.string().min(1),
  city: z.string().min(1),
  adminName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = signupSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create company with trial subscription
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

      const company = await tx.company.create({
        data: {
          name: data.companyName,
          domain: data.domain || undefined,
          country: data.country,
          city: data.city,
          wabaStatus: "PENDING",
          warmupStage: 1,
          plan: "STARTER", // Default plan
          seats: 5, // Starter plan seats
          subscriptionStatus: "trialing",
          trialEndsAt: trialEndDate,
          aiEnabled: true, // Enable AI by default
          aiTone: "professional", // Default tone
          aiLanguages: "en,ar", // Default languages
        },
      })

      // Create CompanySettings with safe defaults
      await tx.companySettings.create({
        data: {
          companyId: company.id,
          whatsappProvider: "WABA", // Default provider
          messageGenerationMode: "MANUAL_COPILOT", // Safe default - AI suggests, agent approves
        },
      })

      // Create admin user
      const passwordHash = await hashPassword(data.password)
      const user = await tx.user.create({
        data: {
          fullName: data.adminName,
          email: data.email,
          phone: data.phone,
          role: "COMPANY_ADMIN",
          passwordHash,
          companyId: company.id,
        },
      })

      // Create initial warm-up plans
      const warmupPlans = [
        { weekNumber: 1, maxMessagesPerDay: 20, isActive: true },
        { weekNumber: 2, maxMessagesPerDay: 50, isActive: false },
        { weekNumber: 3, maxMessagesPerDay: 100, isActive: false },
        { weekNumber: 4, maxMessagesPerDay: 1000, isActive: false },
      ]

      await tx.warmupPlan.createMany({
        data: warmupPlans.map((plan) => ({
          ...plan,
          companyId: company.id,
        })),
      })

      return { company, user }
    })

    // Create session
    await createSession(result.user)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          subscriptionStatus: result.company.subscriptionStatus,
          trialEndsAt: result.company.trialEndsAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Signup API] Error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
