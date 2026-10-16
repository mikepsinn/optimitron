import { redirect } from "next/navigation"
import { ROUTES } from "@optimitron/site-kit/lib/routes"

/** Settings belongs on WoD campaign accounts — Wishocracy is allocations only. */
export default function WishocracySettingsRedirect() {
  redirect(ROUTES.wishocracyResults)
}
