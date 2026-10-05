import type { Metadata } from "next"
import Link from "next/link"
import Layout from "@/components/layout"
import { TreatyReminderComposer } from "@/components/landing/treaty-reminder-composer"
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard"
import { getSessionUser } from "@/lib/auth-utils"
import { parsePositivePageParam } from "@/lib/pagination"
import { ROUTES } from "@/lib/routes"
import { getPublicSignatoriesPage } from "@/lib/signatories.server"
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty"
import { HumanityManagerPromotion } from "@/lib/humanity-manager-promotion.web"

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
        {/* Same assignment as the dashboard. One human needs an account, so signed-out visitors start with Humanity. */}
        <div className="mx-auto mt-10 max-w-2xl">
          <HumanityManagerPromotion />
          <div className="mt-6">
            <TreatyReminderComposer
              defaultRecipientMode={sessionUser ? "one_human" : "humanity"}
              surface="signatories_page"
            />
          </div>
        </div>
      </section>
    </Layout>
  )
}
