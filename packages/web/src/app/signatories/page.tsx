import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata } from "@/lib/metadata";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import {
  getReferendumSiteHomeData,
  getReferendumSiteSupportersData,
} from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

function parsePage(value: string | string[] | undefined) {
  const raw = Number.parseInt(
    Array.isArray(value) ? (value[0] ?? "1") : (value ?? "1"),
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

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

  const [supportersData, homeData] = await Promise.all([
    getReferendumSiteSupportersData(site),
    getReferendumSiteHomeData(site, {
      currentUserId: session?.user?.id ?? null,
      signersPage: parsePage(params.signersPage),
    }),
  ]);

  if (!site.primaryReferendumSlug || !supportersData || !homeData) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">
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
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Public record
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
          Signatories
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold text-muted-foreground">
          Organizations first. Humans underneath. A public list of who has put
          one percent less war and one percent more medicine on the record.
        </p>
      </header>

      <section id="organizations">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Organizations
            </p>
            <h2 className="text-2xl font-black uppercase text-foreground">
              Organizational Signatories
            </h2>
          </div>
          <Link
            href={ROUTES.endorse}
            className="border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase text-background hover:bg-background hover:text-foreground"
          >
            Sign as Organization
          </Link>
        </div>

        {supportersData.supporters.length === 0 ? (
          <div className="mx-auto max-w-xl border-2 border-foreground bg-background p-8 text-center">
            <p className="text-lg font-bold text-foreground">
              No organizational signatories yet.
            </p>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Be the first organization willing to put one percent less war and
              one percent more medicine on the record.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportersData.supporters.map((pos) => (
              <li
                key={pos.id}
                className="border-2 border-foreground bg-background p-6"
              >
                <div className="flex items-start gap-4">
                  {pos.organization.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pos.organization.logo}
                      alt={`${pos.organization.name} logo`}
                      className="h-16 w-16 flex-shrink-0 border border-foreground object-contain"
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center border border-foreground bg-muted text-xs font-black uppercase text-muted-foreground">
                      {pos.organization.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black uppercase text-foreground">
                      {pos.organization.website ? (
                        <a
                          href={pos.organization.website}
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {pos.organization.name}
                        </a>
                      ) : (
                        pos.organization.name
                      )}
                    </h3>
                    {pos.organization.description ? (
                      <p className="mt-1 line-clamp-3 text-sm font-bold text-muted-foreground">
                        {pos.organization.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                {pos.statement ? (
                  <p className="mt-4 border-t border-foreground pt-3 text-sm font-bold italic text-foreground">
                    &ldquo;{pos.statement}&rdquo;
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {homeData.publicSigners.totalCount > 0 ? (
        <SignatoriesLeaderboard
          pagePathname={ROUTES.signatories}
          publicSigners={homeData.publicSigners}
          voteCounterSplit={{
            liveVotes: homeData.individualCount,
            memorialVotes: homeData.memorialVoteCount,
            representedVotes: homeData.representedHumanCount,
          }}
        />
      ) : (
        <section className="mt-16 border-t-2 border-foreground pt-12">
          <div className="mx-auto max-w-xl border-2 border-foreground bg-background p-8 text-center">
            <p className="text-lg font-bold text-foreground">
              No public human signatories yet.
            </p>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              A treaty without humans is paperwork. Fix that.
            </p>
            <Link
              href={ROUTES.vote}
              className="mt-6 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
            >
              Sign Treaty
            </Link>
          </div>
        </section>
      )}
    </section>
  );
}
