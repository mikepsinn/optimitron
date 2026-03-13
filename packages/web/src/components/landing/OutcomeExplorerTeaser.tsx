import Link from "next/link";
import type { OutcomeMegaStudyRanking } from "@optomitron/optimizer";
import type { ExplorerOutcome } from "@/lib/analysis-explorer-types";
import { getOutcomeHubPath } from "@/lib/analysis-explorer-routes";
import { studiesLink } from "@/lib/routes";

interface OutcomeCard {
  outcome: ExplorerOutcome;
  ranking: OutcomeMegaStudyRanking | null;
  pairCount: number;
}

export function OutcomeExplorerTeaser({ outcomes }: { outcomes: OutcomeCard[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
          The Mega-Study Engine
        </h2>
        <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
          Pick an outcome you care about. I&apos;ll show you every predictor
          ranked by causal evidence strength, with response curves, optimal
          values, and jurisdiction-level diagnostics. It&apos;s like a search
          engine, but for &ldquo;what actually works.&rdquo;
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {outcomes.map(({ outcome, ranking, pairCount }) => {
          const topRow = ranking?.rows[0];
          return (
            <Link
              key={outcome.id}
              href={getOutcomeHubPath(outcome.id)}
              className="p-6 border-2 border-black bg-emerald-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col"
            >
              <h3 className="text-lg font-black text-black mb-2">
                {outcome.label}
              </h3>
              <p className="text-sm text-black/60 font-medium mb-3">
                {pairCount} predictor{pairCount !== 1 ? "s" : ""} analyzed
              </p>
              {topRow ? (
                <div className="mt-auto pt-3 border-t border-black/10">
                  <span className="text-xs font-bold text-black/50 uppercase">
                    Top predictor
                  </span>
                  <p className="text-sm font-black text-black">
                    {topRow.predictorLabel}
                  </p>
                  <span className="text-xs font-bold text-emerald-700">
                    Score {(topRow.score * 100).toFixed(0)}
                  </span>
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div className="text-center mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded max-w-2xl mx-auto">
        <p className="text-sm text-black/60 font-medium">
          Every recommendation is gated by direct mission KPI evidence.
          No vibes. No &ldquo;well it feels like it should work.&rdquo; Just data.
        </p>
      </div>
      <div className="text-center mt-8">
        <Link
          href={studiesLink.href}
          className="inline-flex items-center text-sm font-black text-emerald-700 hover:text-emerald-900 uppercase transition-colors"
        >
          Explore All Outcomes &rarr;
        </Link>
      </div>
    </section>
  );
}
