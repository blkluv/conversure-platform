import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || undefined
    const language = searchParams.get("language") || undefined
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || undefined

    const where: {
      companyId: string
      AND?: Array<{
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" }
          phone?: { contains: string }
          email?: { contains: string; mode: "insensitive" }
        }>
        language?: string
        tags?: { hasSome: string[] }
      }>
    } = {
      companyId: session.companyId,
    }

    const andConditions = []

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      })
    }

    if (language) {
      andConditions.push({ language })
    }

    if (tags && tags.length > 0) {
      andConditions.push({ tags: { hasSome: tags } })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const contacts = await db.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const total = await db.contact.count({ where })

    return NextResponse.json({
      success: true,
      contacts,
      total,
    })
  } catch (error) {
    console.error("[v0] Error fetching contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
