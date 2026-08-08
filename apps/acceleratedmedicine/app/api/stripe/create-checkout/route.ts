import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { STRIPE_CONFIG } from "@/lib/stripe-config"
import type { PresetAmount, DonationType } from "@/lib/stripe-config"
import { createLogger } from "@/lib/logger"
import { getBaseUrl } from "@/lib/url"

const log = createLogger("stripe-checkout")

interface CheckoutRequest {
  amount: number
  donationType: DonationType
  name: string
  email: string
  sourceUrl?: string
  sourceReferrer?: string
}

export async function POST(req: NextRequest) {
  log.info("Request received")

  try {
    const stripe = getStripe()
    const body: CheckoutRequest = await req.json()
    const { amount, donationType, name, email, sourceUrl, sourceReferrer } = body

    // Strip query/hash from URLs before storing (avoids PII leaks from query params).
    const cleanUrl =
      typeof sourceUrl === "string" ? sourceUrl.split(/[?#]/)[0].slice(0, 512) : ""
    const cleanReferrer =
      typeof sourceReferrer === "string"
        ? sourceReferrer.split(/[?#]/)[0].slice(0, 512)
        : ""

    log.debug("Request body", {
      amount,
      donationType,
      name,
      email: email ? `${email.substring(0, 3)}***` : "missing",
    })

    // Validate input
    if (!amount || amount < 1) {
      log.error("Invalid amount", { amount })
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!donationType || !["one-time", "monthly"].includes(donationType)) {
      log.error("Invalid donation type", { donationType })
      return NextResponse.json({ error: "Invalid donation type" }, { status: 400 })
    }

    if (!name || !email) {
      log.error("Missing name or email")
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      log.error("Invalid email format", { email })
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Get the appropriate price ID or create a dynamic price
    let priceId: string

    const isPresetAmount = [25, 50, 100, 250, 500, 1000].includes(amount)
    log.debug("Is preset amount", { isPresetAmount })

    if (isPresetAmount) {
      // Use preset price ID
      const priceType = donationType === "one-time" ? "oneTime" : "monthly"
      priceId = STRIPE_CONFIG.prices[priceType][amount as PresetAmount]
      log.info("Using preset price", { priceId, amount, donationType })
    } else {
      // Create a dynamic price for custom amounts
      const productId =
        donationType === "one-time" ? STRIPE_CONFIG.products.oneTime : STRIPE_CONFIG.products.monthly

      log.info("Creating dynamic price for custom amount", { amount, donationType })

      const priceData: any = {
        product: productId,
        unit_amount: amount * 100, // Convert to cents
        currency: "usd",
      }

      if (donationType === "monthly") {
        priceData.recurring = {
          interval: "month",
        }
      }

      const price = await stripe.prices.create(priceData)
      priceId = price.id
      log.info("Created dynamic price", { priceId })
    }

    // Get the base URL for success/cancel redirects
    const baseUrl = getBaseUrl()
    log.debug("Base URL", { baseUrl })

    // Create Stripe Checkout session
    log.info("Creating checkout session")
    const session = await stripe.checkout.sessions.create({
      mode: donationType === "one-time" ? "payment" : "subscription",
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        donorName: name,
        donorEmail: email,
        donationType,
        amount: amount.toString(),
        sourceUrl: cleanUrl,
        sourceReferrer: cleanReferrer,
      },
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate?canceled=true`,
      allow_promotion_codes: true,
    })

    log.info("Session created successfully", { sessionId: session.id, checkoutUrl: session.url })

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 })
  } catch (error) {
    log.error("Error creating checkout session", { error })

    if (error instanceof Error) {
      log.error("Error details", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    log.error("Unknown error type", { errorType: typeof error })
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
