"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

const pricingPlans = [
  {
    name: "Starter",
    price: "299",
    priceId: "STARTER",
    description: "Perfect for solo agents testing automation",
    bestFor: "1-2 agents, small property listings",
    features: [
      "Up to 5 agents",
      "1,000 messages/month",
      "WhatsApp Business API",
      "Basic AI suggestions (manual approval)",
      "Email support",
      "14-day free trial",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "699",
    priceId: "GROWTH",
    description: "For growing agencies scaling operations",
    bestFor: "Small teams (2-5 agents), active lead flow",
    features: [
      "Up to 15 agents",
      "5,000 messages/month",
      "WhatsApp + Chatwoot support",
      "Advanced AI automation",
      "Bitrix24 CRM sync",
      "Priority support",
      "14-day free trial",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: "1,199",
    priceId: "PRO",
    description: "For established agencies at scale",
    bestFor: "Large brokerages (10+ agents), high volume",
    features: [
      "Unlimited agents",
      "20,000 messages/month",
      "All integrations (WABA, Chatwoot, Evolution)",
      "AI Pilot mode (auto-send with approval)",
      "Custom workflows & automations",
      "Dedicated account manager",
      "14-day free trial",
    ],
    popular: false,
  },
]

export function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const router = useRouter()

  const handleStartTrial = async (priceId: string) => {
    setLoadingPlan(priceId)

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: priceId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again or contact support.")
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4" variant="secondary">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.priceId}
              className={`relative ${plan.popular
                ? "border-primary shadow-xl scale-105 md:scale-110"
                : "border-border"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                    <Sparkles className="w-3 h-3 mr-1 inline" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm mb-2">{plan.description}</CardDescription>
                {plan.bestFor && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {plan.bestFor}
                  </Badge>
                )}
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">AED</div>
                      <div className="text-xs text-muted-foreground">/month</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full h-12 text-base font-semibold"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleStartTrial(plan.priceId)}
                  disabled={loadingPlan !== null}
                  aria-label={`Start 14-day free trial for ${plan.name} plan`}
                  id={`pricing-cta-${plan.priceId.toLowerCase()}`}
                >
                  {loadingPlan === plan.priceId ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Start 14-Day Free Trial"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  No credit card required
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 14-day free trial • Cancel anytime • No hidden fees
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>UAE-based support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>GDPR compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
