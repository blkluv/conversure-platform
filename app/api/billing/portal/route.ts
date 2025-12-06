import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req)

    const company = await db.company.findUnique({
      where: { id: session.companyId },
      select: { stripeCustomerId: true },
    })

    if (!company || !company.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found. Please subscribe first." }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "http://localhost:3000"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[v0] Stripe portal error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create portal session" },
      { status: 500 },
    )
  }
}
