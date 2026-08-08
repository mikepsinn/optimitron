import { redirect } from "next/navigation"

/** Settings belongs on WoD campaign accounts — Wishocracy is allocations only. */
export default function WishocracySettingsRedirect() {
  redirect("/dashboard")
}
