// Agent invitation API
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole, hashPassword } from "@/lib/auth"
import { z } from "zod"

const inviteSchema = z.object({
  companyId: z.string(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  dailyQuota: z.number().min(1).max(1000),
})

// Generate random password
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])

    const body = await request.json()
    const data = inviteSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    // Create agent and quota in transaction
    await prisma.$transaction(async (tx) => {
      const agent = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: "AGENT",
          passwordHash,
          companyId: data.companyId,
        },
      })

      // Create agent quota
      const resetAt = new Date()
      resetAt.setHours(24, 0, 0, 0) // Reset at midnight

      await tx.agentQuota.create({
        data: {
          agentId: agent.id,
          companyId: data.companyId,
          dailyLimit: data.dailyQuota,
          messagesSentToday: 0,
          resetAt,
        },
      })
    })

    // In production, send email with credentials

    return NextResponse.json({
      success: true,
      tempPassword,
    })
  } catch (error) {
    console.error("[v0] Agent invite error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
