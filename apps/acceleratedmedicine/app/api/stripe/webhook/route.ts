import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { createLogger } from "@/lib/logger"
import { env } from "@/lib/env"

export const runtime = "nodejs"

const log = createLogger("stripe-webhook")

/**
 * Stripe webhook for campaign apps.
 *
 * Crowdfunding (Campaign*) is retired — use Task + TaskFunding* on optimitron web
 * for funded tasks. This handler verifies signatures and acknowledges events so
 * Stripe does not disable the endpoint. Wire TaskFundingPayment here when donate
 * checkout is reconnected to @optimitron/db task targets.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    log.warn("Stripe env not configured; ignoring webhook")
    return NextResponse.json({ received: true, ignored: true })
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    log.error("Webhook signature verification failed", { err })
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  log.info("Stripe event received (no campaign tables)", {
    type: event.type,
    id: event.id,
  })

  // TODO: map checkout.session.completed → TaskFundingPayment when donate
  // sessions include taskId / fundingTargetId metadata.

  return NextResponse.json({ received: true })
}
