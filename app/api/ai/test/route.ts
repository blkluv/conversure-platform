import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getAiClient } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { provider } = await req.json()

    const aiClient = getAiClient(provider)
    const result = await aiClient.complete("Say 'AI connection successful' in one sentence.")

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] AI test error:", error)
    return NextResponse.json({ success: false, error: "Failed to connect to AI provider" }, { status: 500 })
  }
}
