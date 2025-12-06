// Update agent status API
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { z } from "zod"

const statusSchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"])

    const { agentId } = await params
    const body = await request.json()
    const data = statusSchema.parse(body)

    await prisma.user.update({
      where: { id: agentId },
      data: { isActive: data.isActive },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Agent status update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
