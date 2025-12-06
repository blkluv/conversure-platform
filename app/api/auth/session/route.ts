// Get current session API route
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ session: null }, { status: 401 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
