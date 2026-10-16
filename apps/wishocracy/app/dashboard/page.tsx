import { redirect } from "next/navigation"
import { ROUTES } from "@optimitron/site-kit/lib/routes"

/** Your answers live on the results page, next to everyone's. Sign-in callbacks still land here. */
export default function WishocracyDashboardRedirect() {
  redirect(ROUTES.wishocracyResults)
}
