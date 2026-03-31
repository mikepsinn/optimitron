import Link from "next/link";
import { notFound } from "next/navigation";

import { ProvenanceBlock } from "@/components/analysis/provenance-block";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  getExplorerFreshness,
  getExplorerPrecomputeIndex,
  getOutcomeMegaStudy,
  listExplorerOutcomes,
} from "@/lib/analysis-explorer-data";
import { buildOutcomeQualityBadges } from "@/lib/analysis-explorer-badges";
import {
  getOutcomeRouteParams,
  getPairStudyPath,
} from "@/lib/analysis-explorer-routes";
import { studiesLink } from "@/lib/routes";

function badgeClass(tone: "neutral" | "info" | "warning" | "danger"): string {
  if (tone === "info") return "bg-brutal-cyan border-primary";
  if (tone === "warning") return "bg-brutal-yellow border-primary";
  if (tone === "danger") return "bg-brutal-red border-primary";
  return "bg-muted border-primary";
}

export function generateStaticParams() {
  return getOutcomeRouteParams();
}

export default async function OutcomeHubPage({
  params,
}: {
  params: Promise<{ outcomeId: string }>;
}) {
  const { outcomeId } = await params;
  const outcome = listExplorerOutcomes().find(item => item.id === outcomeId);
  const ranking = getOutcomeMegaStudy(outcomeId);
  const freshness = getExplorerFreshness();
  const precomputeIndex = getExplorerPrecomputeIndex();

  if (!outcome || !ranking) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <NavItemLink
          item={studiesLink}
          variant="custom"
          className="inline-block text-xs font-bold uppercase text-muted-foreground hover:text-foreground mb-3"
        >
          ← All Outcomes
        </NavItemLink>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
          {outcome.label}
        </h1>
        <p className="text-muted-foreground font-bold mt-2">
          Ranked predictors for this outcome using aggregate n-of-1 evidence and multiple-testing correction.
        </p>
      </header>

      <section className="border-4 border-primary bg-background overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary bg-brutal-yellow text-brutal-yellow-foreground">
              <th className="text-left px-3 py-2 font-black uppercase">Rank</th>
              <th className="text-left px-3 py-2 font-black uppercase">Predictor</th>
              <th className="text-right px-3 py-2 font-black uppercase">Score</th>
              <th className="text-right px-3 py-2 font-black uppercase">Confidence</th>
              <th className="text-right px-3 py-2 font-black uppercase">Adj p</th>
              <th className="text-right px-3 py-2 font-black uppercase">Subjects</th>
              <th className="text-right px-3 py-2 font-black uppercase">Pairs</th>
              <th className="text-center px-3 py-2 font-black uppercase">Study</th>
            </tr>
          </thead>
          <tbody>
            {ranking.rows.map(row => (
              <tr key={row.predictorId} className="border-b border-primary hover:bg-brutal-cyan">
                <td className="px-3 py-2 font-black text-foreground">#{row.rank}</td>
                <td className="px-3 py-2 font-bold text-foreground">
                  <div>{row.predictorLabel ?? row.predictorId}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {buildOutcomeQualityBadges(row).map(badge => (
                      <span
                        key={badge.key}
                        className={`inline-block border px-1.5 py-0.5 text-[10px] font-black uppercase ${badgeClass(badge.tone)}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-bold text-foreground">{(row.score * 100).toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-foreground">{(row.confidence * 100).toFixed(1)}%</td>
                <td className="px-3 py-2 text-right text-foreground">{row.adjustedPValue.toFixed(3)}</td>
                <td className="px-3 py-2 text-right text-foreground">{row.numberOfSubjects}</td>
                <td className="px-3 py-2 text-right text-foreground">{row.totalPairs}</td>
                <td className="px-3 py-2 text-center">
                  <Link
                    href={getPairStudyPath(outcomeId, row.predictorId)}
                    className="inline-block px-2 py-1 text-xs font-black uppercase border-4 border-primary bg-background hover:bg-brutal-pink"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ProvenanceBlock
        generatedAt={freshness.generatedAt}
        sources={freshness.sources}
        precomputeIndex={precomputeIndex}
      />
    </div>
  );
}
