import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getGovernment, GOVERNMENTS } from "@optimitron/data";
import { getLatestAggregateScores } from "@/lib/aggregate-alignment.server";
import { ScoreboardDashboard } from "@/components/scoreboard/ScoreboardDashboard";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

interface PageProps {
  params: Promise<{ code: string }>;
}

export function generateStaticParams() {
  return GOVERNMENTS.map((g) => ({ code: g.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const gov = getGovernment(code.toUpperCase());
  return {
    title: `${gov?.name ?? code} Politicians | The Earth Optimization Game`,
    description: `How ${gov?.name ?? code}'s politicians vote: military spending vs clinical trial funding. The ratio reveals everything.`,
  };
}

/** Load generated scorecard data (if it exists) */
function loadScorecardData(): {
  scorecards: Array<{
    bioguideId: string;
    name: string;
    party: string;
    state: string;
    chamber: string;
    militaryDollarsVotedFor: number;
    clinicalTrialDollarsVotedFor: number;
    ratio: number;
    grade: string;
  }>;
  presidents: Array<{
    name: string;
    term: string;
    totalMilitarySigned: number;
    clinicalTrialPortion: number;
    ratio: number;
    grade: string;
    keyActions: string[];
  }>;
  systemWideRatio: number;
} | null {
  try {
    // Try generated data first
    const generatedPath = join(
      process.cwd(),
      "..",
      "data",
      "src",
      "datasets",
      "generated",
      "politician-scorecards.json",
    );
    if (existsSync(generatedPath)) {
      return JSON.parse(readFileSync(generatedPath, "utf8"));
    }
    return null;
  } catch {
    return null;
  }
}

function formatDollars(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  return `$${value.toLocaleString()}`;
}

export default async function GovernmentPoliticiansPage({ params }: PageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const gov = getGovernment(upperCode);
  if (!gov) notFound();

  const alignmentData = await getLatestAggregateScores(upperCode);
  const scorecardData = upperCode === "US" ? loadScorecardData() : null;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href={`/governments/${gov.code}`}
          className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
        >
          &larr; {gov.name}
        </Link>
      </div>

      {/* Military:Trials Scorecard */}
      {scorecardData && scorecardData.scorecards.length > 0 && (
        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container>
            <SectionHeader
              title="Military vs Clinical Trials"
              subtitle={`For every dollar of clinical trial funding each politician voted for, how many dollars of military spending did they also vote for? The system-wide ratio is ${scorecardData.systemWideRatio.toLocaleString()}:1.`}
              size="lg"
            />
            <PoliticianScorecardTable
              scorecards={scorecardData.scorecards}
              systemWideRatio={scorecardData.systemWideRatio}
            />
          </Container>
        </SectionContainer>
      )}

      {/* Presidential Scorecards */}
      {scorecardData && scorecardData.presidents.length > 0 && (
        <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
          <Container>
            <SectionHeader
              title="Presidential Scorecards"
              subtitle="Total military spending signed into law vs clinical trial funding. Every president gets an F."
              size="md"
              className="text-background [&_p]:text-muted-foreground"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scorecardData.presidents.map((p) => (
                <div
                  key={p.name}
                  className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <h3 className="text-lg font-black uppercase text-foreground mb-1">
                    {p.name}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground mb-3">
                    {p.term}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Military</div>
                      <div className="text-lg font-black text-brutal-red">
                        {formatDollars(p.totalMilitarySigned)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Trials</div>
                      <div className="text-lg font-black text-brutal-cyan">
                        {formatDollars(p.clinicalTrialPortion)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-muted-foreground">Ratio</div>
                      <div className="text-lg font-black text-foreground">
                        {p.ratio.toLocaleString()}:1
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {p.keyActions.map((action, i) => (
                      <li key={i} className="text-xs font-bold text-muted-foreground">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </SectionContainer>
      )}

      {/* Citizen Alignment Scoreboard (from Wishocracy data) */}
      {alignmentData && (
        <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
          <Container>
            <SectionHeader
              title="Citizen Alignment Scores"
              subtitle="How each politician's votes compare to what citizens actually want (from Wishocracy pairwise comparisons)."
              size="md"
            />
          </Container>
          <ScoreboardDashboard data={alignmentData} />
        </SectionContainer>
      )}

      {/* No data state */}
      {!scorecardData && !alignmentData && (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              {gov.flag} {gov.name} — No Data Yet
            </h1>
            <p className="mt-4 text-base font-bold text-foreground">
              No politician data available for {gov.name} yet.{" "}
              <Link
                href={ROUTES.wishocracy}
                className="font-black text-brutal-pink underline hover:text-foreground"
              >
                Vote on Wishocracy
              </Link>{" "}
              to help generate alignment data.
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <SectionContainer bgColor="cyan" borderPosition="none" padding="lg">
        <Container className="text-center">
          <h2 className="text-2xl font-black uppercase text-foreground mb-4">
            Make Your Voice Count
          </h2>
          <p className="text-lg font-bold text-foreground mb-6 max-w-2xl mx-auto">
            Express your budget preferences. The alignment scores update automatically
            when enough people vote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GameCTA href={ROUTES.wishocracy} variant="primary" size="lg">
              Express Preferences
            </GameCTA>
            <GameCTA href={`/governments/${gov.code}`} variant="secondary" size="lg">
              {gov.name} Scorecard
            </GameCTA>
          </div>
        </Container>
      </SectionContainer>
    </div>
  );
}
