import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
})

export function getPriceIdForPlan(plan: string): string {
  const normalizedPlan = plan.toUpperCase()

  const priceMap: Record<string, string> = {
    STARTER: process.env.STRIPE_PRICE_STARTER || "",
    GROWTH: process.env.STRIPE_PRICE_GROWTH || "",
    PRO: process.env.STRIPE_PRICE_PRO || "",
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || "",
  }

  const priceId = priceMap[normalizedPlan]

  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan}. Check your environment variables.`)
  }

  return priceId
}

export function getPlanFromStripePrice(priceId: string): "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE" {
  const reversePriceMap: Record<string, "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE"> = {
    [process.env.STRIPE_PRICE_STARTER || ""]: "STARTER",
    [process.env.STRIPE_PRICE_GROWTH || ""]: "GROWTH",
    [process.env.STRIPE_PRICE_PRO || ""]: "PRO",
    [process.env.STRIPE_PRICE_ENTERPRISE || ""]: "ENTERPRISE",
  }

  return reversePriceMap[priceId] || "STARTER"
}
