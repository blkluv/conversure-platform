import { type NextRequest, NextResponse } from "next/server"
import { stripe, getPriceIdForPlan } from "@/lib/stripe"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { plan } = body

    if (!plan || typeof plan !== "string") {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 })
    }

    const company = await db.company.findUnique({
      where: { id: session.companyId },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    let stripeCustomerId = company.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        name: company.name,
        metadata: {
          companyId: company.id,
        },
      })

      stripeCustomerId = customer.id

      await db.company.update({
        where: { id: company.id },
        data: { stripeCustomerId },
      })
    }

    const priceId = getPriceIdForPlan(plan)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?status=cancel`,
      metadata: {
        companyId: company.id,
        plan: plan.toUpperCase(), // Store Plan enum value
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[Billing Checkout] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 },
    )
  }
}
