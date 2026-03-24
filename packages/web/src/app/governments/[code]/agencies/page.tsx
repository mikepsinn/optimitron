import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GOVERNMENTS,
  getGovernment,
  getAgencyPerformanceByCountry,
} from "@optimitron/data";
import { GameCTA } from "@/components/ui/game-cta";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { ROUTES } from "@/lib/routes";
import { AgencyGradeChart } from "@/components/shared/AgencyGradeChart";

interface PageProps {
  params: Promise<{ code: string }>;
}

export function generateStaticParams() {
  return GOVERNMENTS.map((g) => ({ code: g.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const gov = getGovernment(code.toUpperCase());
  if (!gov) return { title: "Country Not Found" };
  return {
    title: `${gov.name} Agency Report Cards | Optimitron`,
    description: `Performance grades for ${gov.name}'s government agencies — spending trends vs outcome trends. If the lines diverge, the agency is failing.`,
  };
}

export default async function AgenciesIndexPage({ params }: PageProps) {
  const { code } = await params;
  const gov = getGovernment(code.toUpperCase());
  if (!gov) notFound();

  const agencies = getAgencyPerformanceByCountry(gov.code);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/governments/${gov.code}`}
        className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
      >
        &larr; {gov.name}
      </Link>

      {/* Hero */}
      <section className="mt-4 mb-12">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{gov.flag}</span>
          <div>
            <ArcadeTag>Report Cards</ArcadeTag>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              {gov.name} Agency Report Cards
            </h1>
            <p className="text-lg font-bold text-muted-foreground mt-2">
              Spending over time vs. outcomes over time. If the lines diverge
              — spending up, outcomes flat or worse — the agency is failing
              its mission.
            </p>
          </div>
        </div>
      </section>

      {/* Agency grid */}
      {agencies.length > 0 ? (
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <Link
                key={agency.agencyId}
                href={`/governments/${gov.code}/agencies/${agency.agencyId}`}
                className="block hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              >
                <AgencyGradeChart agency={agency} />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12">
          <div className="border-4 border-primary bg-muted p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-xl font-black uppercase text-foreground mb-2">
              No agency performance data available for {gov.name} yet.
            </p>
            <p className="text-base font-bold text-muted-foreground">
              We are collecting spending and outcome data for more countries.
              Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-pink p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase text-brutal-pink-foreground">
          See How Wishonia Does It
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold text-brutal-pink-foreground">
          On a well-run planet, agencies are graded in real time and replaced
          when they fail. Here is what that looks like.
        </p>
        <GameCTA href={ROUTES.agencies} variant="secondary" size="lg">
          Optimized Governance
        </GameCTA>
      </section>
    </div>
  );
}
