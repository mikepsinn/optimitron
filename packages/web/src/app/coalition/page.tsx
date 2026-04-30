import { headers } from "next/headers";
import Link from "next/link";
import { getSiteMetadata } from "@/lib/metadata";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getReferendumSiteSupportersData } from "@/lib/referendum-site.server";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  return getSiteMetadata(
    site,
    content.metadata.supporters,
    "/coalition",
    { robots: { index: true, follow: true } },
  );
}

export default async function CoalitionPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);

  const data = await getReferendumSiteSupportersData(site);

  if (!site.primaryReferendumSlug || !data) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">
          {content.supporters.title}
        </h1>
        <p className="mt-4 font-bold text-muted-foreground">
          No referendum is configured for this site.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {data.supporters.length === 0 ? (
        <div className="mx-auto max-w-xl border-2 border-foreground bg-background p-8 text-center">
          <p className="text-lg font-bold text-foreground">
            {data.content.supporters.emptyTitle}
          </p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {data.content.supporters.emptyBody}
          </p>
          <Link
            href="/endorse"
            className="mt-6 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          >
            {data.content.supporters.ctaLabel}
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.supporters.map((pos) => (
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
                  <h2 className="truncate text-lg font-black uppercase text-foreground">
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
                  </h2>
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

      <div className="mt-16 text-center">
        <Link
          href="/endorse"
          className="inline-block border-2 border-foreground bg-foreground px-8 py-4 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
        >
          {data.content.supporters.ctaLabel}
        </Link>
      </div>
    </section>
  );
}
