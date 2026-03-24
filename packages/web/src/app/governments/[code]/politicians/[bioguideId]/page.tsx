import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getGovernment } from "@optimitron/data";
import Image from "next/image";
import { BrutalCard } from "@/components/ui/brutal-card";
import { GameCTA } from "@/components/ui/game-cta";
import { MilitaryVsTrialsPie } from "@/components/shared/MilitaryVsTrialsPie";
import { ROUTES } from "@/lib/routes";

interface PageProps {
  params: Promise<{ code: string; bioguideId: string }>;
}

interface PoliticianVote {
  bill: string;
  vote: string;
  amount: number;
  category: string;
}

interface PoliticianScore {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
  grade: string;
  votes: PoliticianVote[];
}

interface ScorecardData {
  scorecards: PoliticianScore[];
  systemWideRatio: number;
}

function loadScorecardData(): ScorecardData | null {
  try {
    const generatedPath = join(
      process.cwd(), "..", "data", "src", "datasets", "generated", "politician-scorecards.json",
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
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

function formatRatio(ratio: number): string {
  if (ratio === 0) return "0:1";
  if (ratio === 1) return "1:1";
  if (ratio >= 999_999) return "∞";
  return `${ratio.toLocaleString()}:1`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code, bioguideId } = await params;
  const data = loadScorecardData();
  const politician = data?.scorecards.find((s) => s.bioguideId === bioguideId);
  const gov = getGovernment(code.toUpperCase());
  return {
    title: politician
      ? `${politician.name} — Military:Trials Ratio ${formatRatio(politician.ratio)} | ${gov?.name ?? code}`
      : `Politician | ${gov?.name ?? code}`,
    description: politician
      ? `${politician.name} voted for ${formatDollars(politician.militaryDollarsVotedFor)} in military spending and ${formatDollars(politician.clinicalTrialDollarsVotedFor)} in clinical trial funding. Ratio: ${formatRatio(politician.ratio)}.`
      : "Politician scorecard",
  };
}

export default async function PoliticianDetailPage({ params }: PageProps) {
  const { code, bioguideId } = await params;
  const upperCode = code.toUpperCase();
  const gov = getGovernment(upperCode);
  if (!gov) notFound();

  const data = loadScorecardData();
  const politician = data?.scorecards.find((s) => s.bioguideId === bioguideId);
  if (!politician) notFound();

  const systemRatio = data?.systemWideRatio ?? 1094;

  // Find rank among all members
  const allSorted = (data?.scorecards ?? [])
    .filter((s) => s.votes.length > 0)
    .sort((a, b) => a.ratio - b.ratio);
  const rank = allSorted.findIndex((s) => s.bioguideId === bioguideId) + 1;

  const yeaVotes = politician.votes.filter((v) => ["YEA", "AYE", "YES"].includes(v.vote));
  const nayVotes = politician.votes.filter((v) => v.vote === "NAY");
  const notVoting = politician.votes.filter((v) => !["YEA", "AYE", "YES", "NAY"].includes(v.vote));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/governments/${gov.code}/politicians`}
        className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
      >
        &larr; {gov.name} Politicians
      </Link>

      {/* Hero */}
      <section className="mt-4 mb-12 flex flex-col sm:flex-row gap-6 items-start">
        {/* Photo */}
        <div className="shrink-0 border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden w-32 h-40 sm:w-40 sm:h-48 bg-muted">
          <Image
            src={`https://bioguide.congress.gov/bioguide/photo/${politician.bioguideId[0]?.toUpperCase() ?? "X"}/${politician.bioguideId}.jpg`}
            alt={politician.name}
            width={160}
            height={192}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            {politician.name}
          </h1>
          <p className="text-lg font-bold text-muted-foreground mt-1">
            {politician.party} &middot; {politician.chamber} &middot; {politician.state}
            {rank > 0 && ` · Rank #${rank} of ${allSorted.length}`}
          </p>
          <p className="text-base font-bold text-foreground mt-2">
            <span className="text-brutal-red font-black">
              {politician.militaryDollarsVotedFor > 0 && politician.clinicalTrialDollarsVotedFor > 0
                ? `${(politician.militaryDollarsVotedFor / (politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor) * 100).toFixed(1)}% military`
                : politician.militaryDollarsVotedFor === 0
                  ? "0% military"
                  : "100% military"
              }
            </span>
            {" vs "}
            <span className="text-brutal-cyan font-black">
              {politician.militaryDollarsVotedFor > 0 && politician.clinicalTrialDollarsVotedFor > 0
                ? `${(politician.clinicalTrialDollarsVotedFor / (politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor) * 100).toFixed(2)}% clinical trials`
                : politician.clinicalTrialDollarsVotedFor === 0
                  ? "0% clinical trials"
                  : "100% clinical trials"
              }
            </span>
          </p>
        </div>
      </section>

      {/* Ratio hero card */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BrutalCard bgColor="red" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-brutal-red-foreground mb-1">
              Military $ Voted For
            </div>
            <div className="text-3xl sm:text-4xl font-black text-brutal-red-foreground">
              {formatDollars(politician.militaryDollarsVotedFor)}
            </div>
          </BrutalCard>

          <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-foreground mb-1">
              Clinical Trial $ Voted For
            </div>
            <div className="text-3xl sm:text-4xl font-black text-foreground">
              {formatDollars(politician.clinicalTrialDollarsVotedFor)}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              3.3% of NIH budget = actual clinical trials
            </p>
          </BrutalCard>

          <BrutalCard bgColor="background" shadowSize={8} padding="lg">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">
              Military : Trials Ratio
            </div>
            <div className={`text-3xl sm:text-4xl font-black ${
              politician.ratio >= 100 ? "text-brutal-red" : politician.ratio <= 1 ? "text-brutal-cyan" : "text-foreground"
            }`}>
              {formatRatio(politician.ratio)}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              System average: {systemRatio.toLocaleString()}:1
            </p>
          </BrutalCard>
        </div>
      </section>

      {/* Pie chart */}
      <section className="mb-12 flex justify-center">
        <MilitaryVsTrialsPie
          militaryPct={
            politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor > 0
              ? (politician.militaryDollarsVotedFor / (politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor)) * 100
              : 50
          }
          trialsPct={
            politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor > 0
              ? (politician.clinicalTrialDollarsVotedFor / (politician.militaryDollarsVotedFor + politician.clinicalTrialDollarsVotedFor)) * 100
              : 50
          }
          militaryDollars={politician.militaryDollarsVotedFor}
          trialsDollars={politician.clinicalTrialDollarsVotedFor}
          size={280}
        />
      </section>

      {/* Vote record */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground mb-4">
          Vote Record
        </h2>

        {yeaVotes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-black uppercase text-foreground mb-2">
              Voted YEA
            </h3>
            <div className="space-y-2">
              {yeaVotes.map((v) => (
                <div
                  key={v.bill}
                  className={`border-4 border-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    v.category === "military" || v.category === "enforcement"
                      ? "bg-brutal-red"
                      : "bg-brutal-cyan"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-black ${
                      v.category === "military" || v.category === "enforcement"
                        ? "text-brutal-red-foreground"
                        : "text-foreground"
                    }`}>
                      {v.bill}
                    </span>
                    <span className={`text-sm font-black ${
                      v.category === "military" || v.category === "enforcement"
                        ? "text-brutal-red-foreground"
                        : "text-foreground"
                    }`}>
                      {formatDollars(v.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nayVotes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-black uppercase text-foreground mb-2">
              Voted NAY
            </h3>
            <div className="space-y-2">
              {nayVotes.map((v) => (
                <div
                  key={v.bill}
                  className="border-4 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-foreground">
                      {v.bill}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground line-through">
                      {formatDollars(v.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notVoting.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-black uppercase text-muted-foreground mb-2">
              Not Voting / Absent
            </h3>
            <div className="space-y-2">
              {notVoting.map((v) => (
                <div
                  key={v.bill}
                  className="border-2 border-muted bg-muted p-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      {v.bill}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      {v.vote}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Context */}
      <section className="mb-12">
        <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
          <h3 className="text-base font-black uppercase text-foreground mb-2">
            What This Means
          </h3>
          <p className="text-base font-bold text-foreground leading-relaxed">
            {politician.militaryDollarsVotedFor === 0 && politician.clinicalTrialDollarsVotedFor === 0
              ? `${politician.name} voted against both military spending and health funding on the bills we tracked. Their ratio is 1:1 by default.`
              : politician.militaryDollarsVotedFor === 0
                ? `${politician.name} voted for clinical trial funding without voting for any military spending. This is the best possible outcome.`
                : politician.clinicalTrialDollarsVotedFor === 0
                  ? `${politician.name} voted for ${formatDollars(politician.militaryDollarsVotedFor)} in military spending but $0 in clinical trial funding. Their ratio is effectively infinite.`
                  : `For every $1 of clinical trial funding ${politician.name} voted for, they also voted for $${politician.ratio.toLocaleString()} in military spending. The system average is $${systemRatio.toLocaleString()}.`
            }
          </p>
        </BrutalCard>
      </section>

      {/* CTA */}
      <section className="border-4 border-primary bg-brutal-cyan p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase text-foreground">
          Does This Match Your Priorities?
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold text-foreground">
          Express your budget preferences and see how your priorities compare
          to {politician.name}&apos;s actual votes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <GameCTA href={ROUTES.wishocracy} variant="primary" size="lg">
            Express Preferences
          </GameCTA>
          <GameCTA href={`/governments/${gov.code}/politicians`} variant="secondary" size="lg">
            All Politicians
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
