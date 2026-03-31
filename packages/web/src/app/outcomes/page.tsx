import Link from "next/link";

import { ProvenanceBlock } from "@/components/analysis/provenance-block";
import { OutcomeExplorerTeaser } from "@/components/landing/OutcomeExplorerTeaser";
import { WarVsCuresChart } from "@/components/landing/WarVsCuresChart";
import { NaturalExperimentsChart } from "@/components/landing/NaturalExperimentsChart";
import { PersonalIncomeChart } from "@/components/landing/PersonalIncomeChart";
import {
  getExplorerFreshness,
  getExplorerPrecomputeIndex,
  getOutcomeMegaStudy,
  listExplorerOutcomes,
  listExplorerPairSummaries,
} from "@/lib/analysis-explorer-data";
import { getOutcomeHubPath, getPairStudyPath } from "@/lib/analysis-explorer-routes";
import { studiesLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(studiesLink);

export default function OutcomesIndexPage() {
  const outcomes = listExplorerOutcomes();
  const pairSummaries = listExplorerPairSummaries();
  const freshness = getExplorerFreshness();
  const precomputeIndex = getExplorerPrecomputeIndex();

  const outcomeCards = outcomes.slice(0, 3).map((outcome) => {
    const ranking = getOutcomeMegaStudy(outcome.id);
    const pairsForOutcome = pairSummaries.filter(
      (p) => p.outcomeId === outcome.id,
    ).length;
    return { outcome, ranking, pairCount: pairsForOutcome };
  });

  return (
    <div>
      <OutcomeExplorerTeaser outcomes={outcomeCards} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-2">
          Outcome Hubs
        </h1>
        <p className="text-muted-foreground font-bold">
          Pick something you care about. I&apos;ll tell you what actually causes it. No opinions. No vibes. Just data.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {outcomes.map(outcome => {
          const ranking = getOutcomeMegaStudy(outcome.id);
          const top = ranking?.rows[0];
          const pairCount = pairSummaries.filter(pair => pair.outcomeId === outcome.id).length;

          return (
            <div
              key={outcome.id}
              className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-xl font-black text-foreground">{outcome.label}</h2>
                  <p className="text-xs font-bold uppercase text-muted-foreground">{outcome.unit}</p>
                </div>
                <span className="text-xs font-black border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground px-2 py-1 uppercase">
                  {pairCount} predictor{pairCount === 1 ? "" : "s"}
                </span>
              </div>

              {top ? (
                <div className="border border-primary bg-brutal-yellow text-brutal-yellow-foreground px-3 py-2 mb-4">
                  <p className="text-xs font-black uppercase">Top Predictor</p>
                  <p className="text-sm font-bold">{top.predictorLabel ?? top.predictorId}</p>
                  <p className="text-xs text-muted-foreground">
                    Score {(top.score * 100).toFixed(1)} • q={(top.adjustedPValue * 100).toFixed(2)}%
                  </p>
                  <Link
                    href={getPairStudyPath(outcome.id, top.predictorId)}
                    className="text-xs font-black text-brutal-pink hover:text-brutal-pink uppercase"
                  >
                    Open Pair Study →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">Ranking not available yet for this outcome.</p>
              )}

              <Link
                href={getOutcomeHubPath(outcome.id)}
                className="inline-block text-sm font-black uppercase px-3 py-2 border-4 border-primary bg-background hover:bg-brutal-pink transition-colors"
              >
                Open Outcome Hub
              </Link>
            </div>
          );
        })}
      </section>

      {/* Visualizations */}
      <WarVsCuresChart />
      <NaturalExperimentsChart />
      <PersonalIncomeChart />

      <ProvenanceBlock
        generatedAt={freshness.generatedAt}
        sources={freshness.sources}
        precomputeIndex={precomputeIndex}
      />
    </div>
    </div>
  );
}
