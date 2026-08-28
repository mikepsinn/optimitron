import { redirect } from "next/navigation"

/**
 * All donation Payment Links redirect to acceleratedmedicine.org/donate/success
 * (every donation goes to Accelerated Medicine Foundation Inc), so this page
 * only forwards stale bookmarks there, keeping the session reference intact.
 */
export default async function DonateSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  redirect(
    `https://acceleratedmedicine.org/donate/success${
      sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""
    }`,
  )
}
