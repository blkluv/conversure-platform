import Stripe from "stripe"

// Gracefully handle missing Stripe key - allow build to succeed
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build_only"
const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
})

// Helper to check if Stripe is properly configured
export function isStripeEnabled(): boolean {
  return isStripeConfigured
}

// Helper to ensure Stripe is configured before operations
export function requireStripeConfig(): void {
  if (!isStripeConfigured) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.")
  }
}

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
