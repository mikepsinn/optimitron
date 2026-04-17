import { headers } from "next/headers";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHost } from "@/lib/site";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);
  return getSiteMetadata(site, content.metadata.legal, "/legal");
}

export default async function LegalPage() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 [font-family:var(--v0-font-source-serif-4)]">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {content.legal.eyebrow}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {content.legal.title}
        </h1>
      </header>

      <section className="prose prose-neutral max-w-none text-base font-bold text-foreground">
        {content.legal.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="mt-8 text-xl font-black uppercase">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets?.length ? (
              <ul className="ml-6 list-disc space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </section>
    </article>
  );
}
