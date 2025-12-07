import { type NextRequest, NextResponse } from "next/server"
import { stripe, getPlanFromStripePrice } from "@/lib/stripe"
import { db } from "@/lib/db"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature provided" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    const companyId = await getCompanyIdFromEvent(event)

    if (companyId) {
      await db.paymentEvent.create({
        data: {
          companyId,
          stripeEventId: event.id,
          type: event.type,
          rawPayload: event as any,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const companyId = session.metadata?.companyId

  if (!companyId) {
    console.error("[Stripe Webhook] No companyId in checkout session metadata")
    return
  }

  const subscriptionData = (await stripe.subscriptions.retrieve(session.subscription as string)) as any
  const priceId = subscriptionData.items.data[0]?.price.id
  const plan = priceId ? getPlanFromStripePrice(priceId) : "STARTER"
  
  // Extract current_period_end safely
  const currentPeriodEnd = subscriptionData.current_period_end 
    ? new Date((subscriptionData.current_period_end as number) * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now

  await db.company.update({
    where: { id: companyId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      subscriptionStatus: "trialing",
      plan,
      currentPeriodEnd,
    },
  })

  console.log(`[Stripe Webhook] Checkout completed for company ${companyId}, plan: ${plan}`)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const company = await db.company.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!company) {
    console.error("[Stripe Webhook] Company not found for Stripe customer:", customerId)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanFromStripePrice(priceId) : company.plan
  
  // Extract current_period_end safely
  const currentPeriodEnd = (subscription as any).current_period_end
    ? new Date(((subscription as any).current_period_end as number) * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now

  await db.company.update({
    where: { id: company.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      plan,
      currentPeriodEnd,
    },
  })

  console.log(
    `[Stripe Webhook] Subscription updated for company ${company.id}: status=${subscription.status}, plan=${plan}`,
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const company = await db.company.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!company) {
    console.error("[Stripe Webhook] Company not found for Stripe customer:", customerId)
    return
  }

  await db.company.update({
    where: { id: company.id },
    data: {
      subscriptionStatus: "canceled",
      plan: "STARTER",
    },
  })

  console.log(`[Stripe Webhook] Subscription canceled for company ${company.id}, downgraded to STARTER`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const company = await db.company.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!company) {
    console.error("[Stripe Webhook] Company not found for Stripe customer:", customerId)
    return
  }

  await db.company.update({
    where: { id: company.id },
    data: {
      subscriptionStatus: "past_due",
    },
  })

  console.log(`[Stripe Webhook] Payment failed for company ${company.id}`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const company = await db.company.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!company) {
    console.error("[Stripe Webhook] Company not found for Stripe customer:", customerId)
    return
  }

  await db.company.update({
    where: { id: company.id },
    data: {
      subscriptionStatus: "active",
    },
  })

  console.log(`[Stripe Webhook] Invoice paid for company ${company.id}, status set to active`)
}

async function getCompanyIdFromEvent(event: Stripe.Event): Promise<string | null> {
  const obj = event.data.object as any

  if (obj.metadata?.companyId) {
    return obj.metadata.companyId
  }

  if (obj.customer) {
    const company = await db.company.findFirst({
      where: { stripeCustomerId: obj.customer as string },
      select: { id: true },
    })
    return company?.id || null
  }

  return null
}
