// Agent registration form submission (creates a lead for internal follow-up)
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const agentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  currentCompany: z.string().optional(),
  city: z.string().min(1),
  experience: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = agentSchema.parse(body)

    // Create a lead with type AGENT_SIGNUP for internal follow-up
    // Using a placeholder company ID - in production, you'd have an internal company
    await prisma.lead.create({
      data: {
        name: data.fullName,
        phone: data.phone,
        email: data.email,
        source: "Agent Registration Form",
        status: "NEW",
        tags: ["Agent Signup", data.city],
        companyId: "demo-company-1", // Replace with your internal company ID
      },
    })

    // In production, send email notification to admin team

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[v0] Agent registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
