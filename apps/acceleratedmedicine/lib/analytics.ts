/**
 * Google Analytics events. The root layout loads GA when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * Copied from the donation events in packages/site-kit/src/lib/analytics.ts, so the event names stay the same.
 */
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: "event" | "config" | "set", targetId: string, config?: Record<string, unknown>) => void
  }
}

function getGtag(): Window["gtag"] {
  if (typeof window === "undefined") return undefined
  if (!window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) {
    // Queue events sent before the layout's GA script loads.
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      // gtag reads the arguments object, not an array.
      window.dataLayer!.push(arguments)
    }
  }
  return window.gtag
}

/** A donor chose an amount and left for Stripe checkout. */
export function trackDonationStarted(params: { amount: number; type: "one_time" | "monthly" }): void {
  try {
    getGtag()?.("event", "donation_started", {
      value: params.amount,
      donation_type: params.type,
      currency: "USD",
    })
  } catch {
    // Analytics must not stop the donation.
  }
}
