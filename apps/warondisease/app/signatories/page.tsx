import type { Metadata } from "next"
import Link from "next/link"
import Layout from "@/components/layout"
import { DashboardShareCard } from "@/components/dashboard/DashboardShareCard"
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard"
import { getSessionUser } from "@/lib/auth-utils"
import { parsePositivePageParam } from "@/lib/pagination"
import { ROUTES } from "@/lib/routes"
import { getPublicSignatoriesPage } from "@/lib/signatories.server"
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty"
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "People Who Ended War and Disease",
  description:
    "The humans and organizations who signed the 1% Treaty and got humanity to agree to end war and disease.",
}

/**
 * `/signatories` — the ranked list of humans and organizations who signed.
 *
 * Optimitron resolves the referendum from the request host because one app
 * serves several variants. warondisease is single-variant, so the treaty slug
 * is passed directly and the whole site-resolution layer drops out. The
 * referral URL falls back to the plain vote page for signed-out readers, which
 * is what the Optimitron page did with its request origin.
 */
export default async function SignatoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const sessionUser = await getSessionUser()

  const publicSignatories = await getPublicSignatoriesPage({
    currentUserId: sessionUser?.id ?? null,
    referendumSlug: TREATY_REFERENDUM_SLUG,
    signersPage: parsePositivePageParam(params.signersPage),
  })

  // buildUserReferralUrl defaults to getBaseUrl(), which resolves this
  // deployment's own origin from env. That is what the Optimitron page got out
  // of the request headers, and it keeps referral links correct on previews
  // instead of hardcoding the production domain.
  const referralUrl = sessionUser
    ? buildUserReferralUrl(sessionUser)
    : `${getBaseUrl()}${ROUTES.vote}`

  const hasSignatorySurface =
    (publicSignatories?.totalCount ?? 0) > 0 ||
    Boolean(publicSignatories?.currentUserStatus)

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:pt-8 [&>#signatories]:mt-0 [&>#signatories]:pt-0">
        {hasSignatorySurface ? (
          <SignatoriesLeaderboard
            pagePathname={ROUTES.signatories}
            publicSignatories={publicSignatories}
          />
        ) : (
          <section className="border-t-2 border-foreground pt-12">
            <div className="mx-auto max-w-xl border-2 border-foreground bg-background p-8 text-center">
              <p className="text-lg font-bold text-foreground">
                No public signatories yet.
              </p>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                A treaty without signatories is paperwork. Fix that.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href={ROUTES.vote}
                  className="inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                >
                  Sign Treaty
                </Link>
                <Link
                  href={ROUTES.join}
                  className="inline-block border-2 border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
                >
                  Join as Organization
                </Link>
              </div>
            </div>
          </section>
        )}
        <div className="mx-auto mt-10 max-w-3xl">
          <DashboardShareCard referralUrl={referralUrl} />
        </div>
      </section>
    </Layout>
  )
}
