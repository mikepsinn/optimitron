import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegislationMarkdown } from "@/components/legislation/LegislationMarkdown";
import { getLegislationBySlug, getLegislationEntries } from "@/lib/legislation";
import { ROUTES } from "@/lib/routes";

export async function generateStaticParams() {
  return getLegislationEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getLegislationBySlug(slug);

  if (!entry) {
    return {
      title: "Legislation not found",
    };
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function LegislationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getLegislationBySlug(slug);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href={ROUTES.legislation} className="text-xs font-black uppercase tracking-[0.2em] text-foreground underline underline-offset-4">
          ← All legislation
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={entry.status} />
          {entry.categoryName ? (
            <span className="border-2 border-primary px-2 py-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
              {entry.categoryName}
            </span>
          ) : null}
          {entry.modelCountry ? (
            <span className="border-2 border-primary px-2 py-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
              Model: {entry.modelCountry}
            </span>
          ) : null}
          {entry.overspendRatio ? (
            <span className="border-2 border-primary px-2 py-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
              Overspend {entry.overspendRatio}
            </span>
          ) : null}
          {entry.usRank ? (
            <span className="border-2 border-primary px-2 py-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
              US rank {entry.usRank}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          {entry.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">{entry.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-wide text-muted-foreground">
          <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
          {entry.generatedAt ? <span>Drafted {new Date(entry.generatedAt).toLocaleDateString()}</span> : null}
          {entry.potentialSavings ? <span>Potential savings {entry.potentialSavings}</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={entry.editUrl}
            target="_blank"
            rel="noreferrer"
            className="border-4 border-primary bg-background px-4 py-2 text-xs font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            Edit on GitHub
          </a>
          <a
            href={entry.historyUrl}
            target="_blank"
            rel="noreferrer"
            className="border-4 border-primary bg-background px-4 py-2 text-xs font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            View history
          </a>
        </div>
      </div>

      <LegislationMarkdown markdown={entry.markdown} />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <FooterCard href={ROUTES.obg} title="Budget analysis" description="Inspect the spending diagnosis behind this draft." />
        <FooterCard href={ROUTES.efficiency} title="Efficiency rankings" description="See the comparator countries and overspend ratios." />
        <FooterCard href={ROUTES.dividend} title="Optimization Dividend" description="See what the savings would pay back to households." />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "reviewed" }) {
  const className =
    status === "reviewed"
      ? "bg-background text-foreground"
      : "bg-background text-foreground";

  return (
    <span className={`border-2 border-primary px-2 py-1 text-xs font-black uppercase tracking-wide ${className}`}>
      {status === "reviewed" ? "Reviewed" : "Draft"}
    </span>
  );
}

function FooterCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <p className="text-lg font-black uppercase text-foreground">{title}</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{description}</p>
    </Link>
  );
}
