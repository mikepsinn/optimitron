import { headers } from "next/headers";
import { getSiteMetadata } from "@/lib/metadata";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getSiteFromHeaders } from "@/lib/site";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  return getSiteMetadata(site, content.metadata.why, "/why");
}

export default async function WhyPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {content.why.eyebrow}
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.why.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base font-bold text-muted-foreground sm:text-lg">
          {content.why.intro}
        </p>
      </header>

      <ol className="space-y-10">
        {content.why.facts.map((f, i) => (
          <li
            key={f.label}
            className="border-l-4 border-foreground pl-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {String(i + 1).padStart(2, "0")} — {f.label}
            </p>
            <p className="mt-2 text-4xl font-black text-foreground sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
              {f.number}
            </p>
            <p className="mt-3 max-w-2xl text-base font-bold text-muted-foreground">
              {f.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-20 border-t-2 border-foreground pt-12 text-center">
        <p className="mx-auto max-w-xl text-lg font-bold text-foreground">
          {content.why.closingLead}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base font-bold text-muted-foreground">
          {content.why.closingBody}
        </p>
        <a
          href="/treaty"
          className="mt-10 inline-block border-2 border-foreground bg-foreground px-8 py-4 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
        >
          {content.why.ctaLabel}
        </a>
      </div>
    </section>
  );
}
