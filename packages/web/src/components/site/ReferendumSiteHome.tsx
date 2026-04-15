import Link from "next/link";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";

interface Props {
  data: ReferendumSiteHomeData;
}

export function ReferendumSiteHome({ data }: Props) {
  const { content, individualCount, organizationCount, site } = data;
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {content.home.eyebrow}
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.home.titleLines[0]}
          {content.home.titleLines[1] ? (
            <>
              <br />
              {content.home.titleLines[1]}
            </>
          ) : null}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base font-bold text-muted-foreground sm:text-lg">
          {content.home.intro}
        </p>
      </header>

      <div className="mb-16 grid gap-6 sm:grid-cols-2">
        <div className="border-2 border-foreground bg-background p-8 text-center">
          <p className="text-5xl font-black text-foreground sm:text-6xl [font-family:var(--v0-font-libre-baskerville)]">
            {individualCount.toLocaleString()}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {content.home.individualCountLabel}
          </p>
        </div>
        <div className="border-2 border-foreground bg-background p-8 text-center">
          <p className="text-5xl font-black text-foreground sm:text-6xl [font-family:var(--v0-font-libre-baskerville)]">
            {organizationCount.toLocaleString()}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {content.home.organizationCountLabel}
          </p>
        </div>
      </div>

      <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/treaty"
          className="inline-block w-full border-2 border-foreground bg-foreground px-8 py-4 text-center text-sm font-black uppercase text-background hover:bg-background hover:text-foreground sm:w-auto"
        >
          {content.home.primaryCtaLabel}
        </Link>
        <Link
          href="/endorse"
          className="inline-block w-full border-2 border-foreground bg-background px-8 py-4 text-center text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background sm:w-auto"
        >
          {content.home.secondaryCtaLabel}
        </Link>
      </div>

      <div className="border-t-2 border-foreground pt-12 text-center">
        <p className="text-lg font-bold text-foreground">
          {content.home.closingLead}
        </p>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          {content.home.closingBody}
        </p>
        <Link
          href="/why"
          className="mt-6 inline-block text-sm font-bold uppercase underline"
        >
          {content.home.closingCtaLabel}
        </Link>
      </div>
    </div>
  );
}
