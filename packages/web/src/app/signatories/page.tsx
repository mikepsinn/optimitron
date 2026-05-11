import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata } from "@/lib/metadata";
import { parsePositivePageParam } from "@/lib/pagination";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  return getSiteMetadata(
    site,
    content.metadata.signatories,
    ROUTES.signatories,
    {
      robots: { index: true, follow: true },
    },
  );
}

export default async function SignatoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  const session = await getServerSession(authOptions);
  const params = (await searchParams) ?? {};

  const homeData = await getReferendumSiteHomeData(site, {
    currentUserId: session?.user?.id ?? null,
    signersPage: parsePositivePageParam(params.signersPage),
  });

  if (!site.primaryReferendumSlug || !homeData) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-black uppercase sm:text-5xl md:text-6xl">
          {content.metadata.signatories.title}
        </h1>
        <p className="mt-4 font-bold text-muted-foreground">
          No referendum is configured for this site.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {homeData.publicSignatories.totalCount > 0 ? (
        <SignatoriesLeaderboard
          pagePathname={ROUTES.signatories}
          publicSignatories={homeData.publicSignatories}
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
                href={ROUTES.endorse}
                className="inline-block border-2 border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
              >
                Join as Organization
              </Link>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
