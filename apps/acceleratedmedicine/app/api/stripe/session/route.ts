import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createLogger } from "@/lib/logger"

const log = createLogger("stripe-session")

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      log.error("No session_id provided")
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    log.info("Retrieving session", { sessionId })

    // Retrieve the checkout session from Stripe
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    log.info("Session retrieved successfully", { sessionId, paymentStatus: session.payment_status })

    // Return relevant session data
    return NextResponse.json(
      {
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email || session.customer_details?.email,
        payment_status: session.payment_status,
        mode: session.mode,
        metadata: session.metadata,
        customer_details: session.customer_details,
      },
      { status: 200 }
    )
  } catch (error) {
    log.error("Error retrieving session", { error })

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 })
  }
}
