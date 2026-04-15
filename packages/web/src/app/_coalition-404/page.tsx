import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { getSiteFromHost } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function CoalitionNotFoundPage() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl [font-family:var(--v0-font-libre-baskerville)]">
        {content.notFound.title}
      </h1>
      <p className="max-w-md text-base font-bold text-muted-foreground">
        {content.notFound.description}
      </p>
      <Link
        href="/"
        className="inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
      >
        {content.notFound.ctaLabel}
      </Link>
    </section>
  );
}
