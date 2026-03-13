import Link from "next/link";
import { notFound } from "next/navigation";

import { ProvenanceBlock } from "@/components/analysis/provenance-block";
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
  if (tone === "info") return "bg-cyan-100 border-cyan-400";
  if (tone === "warning") return "bg-amber-100 border-amber-400";
  if (tone === "danger") return "bg-red-100 border-red-500";
  return "bg-gray-100 border-gray-300";
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
        <Link
          href={studiesLink.href}
          className="inline-block text-xs font-bold uppercase text-black/50 hover:text-black mb-3"
        >
          ← All Outcomes
        </Link>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
          {outcome.label}
        </h1>
        <p className="text-black/60 font-medium mt-2">
          Ranked predictors for this outcome using aggregate n-of-1 evidence and multiple-testing correction.
        </p>
      </header>

      <section className="border-2 border-black bg-white overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black bg-yellow-300">
              <th className="text-left px-3 py-2 font-black uppercase">Rank</th>
              <th className="text-left px-3 py-2 font-black uppercase">Predictor</th>
              <th className="text-right px-3 py-2 font-black uppercase">Score</th>
              <th className="text-right px-3 py-2 font-black uppercase">Confidence</th>
              <th className="text-right px-3 py-2 font-black uppercase">Adj p</th>
              <th className="text-right px-3 py-2 font-black uppercase">Units</th>
              <th className="text-right px-3 py-2 font-black uppercase">Pairs</th>
              <th className="text-center px-3 py-2 font-black uppercase">Study</th>
            </tr>
          </thead>
          <tbody>
            {ranking.rows.map(row => (
              <tr key={row.predictorId} className="border-b border-black hover:bg-cyan-50">
                <td className="px-3 py-2 font-black text-black">#{row.rank}</td>
                <td className="px-3 py-2 font-bold text-black">
                  <div>{row.predictorLabel || row.predictorId}</div>
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
                <td className="px-3 py-2 text-right font-bold text-black">{(row.score * 100).toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-black/70">{(row.confidence * 100).toFixed(1)}%</td>
                <td className="px-3 py-2 text-right text-black/70">{row.adjustedPValue.toFixed(3)}</td>
                <td className="px-3 py-2 text-right text-black/70">{row.numberOfUnits}</td>
                <td className="px-3 py-2 text-right text-black/70">{row.totalPairs}</td>
                <td className="px-3 py-2 text-center">
                  <Link
                    href={getPairStudyPath(outcomeId, row.predictorId)}
                    className="inline-block px-2 py-1 text-xs font-black uppercase border-2 border-black bg-white hover:bg-pink-200"
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
