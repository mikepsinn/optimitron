"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Scale, Sparkles, Target } from "lucide-react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { Button } from "@/components/ui/button";
import { ALIGNMENT_BENCHMARK_SOURCE_NOTE } from "@/lib/alignment-benchmarks";
import type { PersonalAlignmentState } from "@/lib/alignment-report";
import { wishocracyLink } from "@/lib/routes";

interface AlignmentReportProps {
  state: PersonalAlignmentState;
  shareUrl: string;
  ownerLabel?: string | null;
  publicMode?: boolean;
}

function formatScore(score: number): string {
  return `${score.toFixed(1)}%`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatCoverageLabel(input: {
  categoriesCovered?: number;
  rollCallCount?: number;
  sourceLabel: string;
}) {
  const parts = [input.sourceLabel];
  if (input.rollCallCount && input.rollCallCount > 0) {
    parts.push(`${input.rollCallCount} roll call${input.rollCallCount === 1 ? "" : "s"}`);
  }
  if (input.categoriesCovered && input.categoriesCovered > 0) {
    parts.push(`${input.categoriesCovered} categor${input.categoriesCovered === 1 ? "y" : "ies"}`);
  }
  return parts.join(" · ");
}

export function AlignmentReport({
  state,
  shareUrl,
  ownerLabel,
  publicMode = false,
}: AlignmentReportProps) {
  const reportTitle =
    publicMode && ownerLabel
      ? `Alignment Report for ${ownerLabel}`
      : "Personal Politician Report";

  if (state.status === "empty") {
    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">
            {publicMode ? "Shared Alignment" : "Your Alignment"}
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            {reportTitle}
          </h1>
          <p className="max-w-3xl text-base font-medium text-black/70">
            {publicMode
              ? "This shared report link exists, but there is not enough saved Wishocracy data yet to render a public alignment snapshot."
              : "Compare your budget priorities against real benchmark politician profiles once you have enough pairwise trade-offs saved."}
          </p>
        </section>

        <section className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 border-2 border-black bg-brutal-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
              <Target className="h-4 w-4" />
              Not Ready Yet
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase text-black">{state.headline}</h2>
              <p className="text-base font-medium text-black/70">{state.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-2 border-black bg-cyan-100 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                  Comparisons Saved
                </div>
                <div className="mt-2 text-3xl font-black text-black">{state.comparisonCount}</div>
              </div>
              <div className="border-2 border-black bg-yellow-100 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                  Categories In Scope
                </div>
                <div className="mt-2 text-3xl font-black text-black">
                  {state.selectedCategoryCount}
                </div>
              </div>
              <div className="border-2 border-black bg-pink-100 p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                  Completion
                </div>
                <div className="mt-2 text-3xl font-black text-black">
                  {formatPercent(state.completionRatio)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild className="font-black uppercase">
                <Link href={state.ctaHref}>
                  {state.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const topMatch = state.report.politicians[0];
  const shareText =
    publicMode && ownerLabel
      ? `See how ${ownerLabel} lines up against Optomitron's federal benchmark politicians.`
      : "I compared my budget priorities against Optomitron's federal benchmark politicians. See how yours line up.";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">
            {publicMode ? "Shared Alignment" : "Your Alignment"}
          </p>
          <span
            className={`border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${
              state.report.isPreliminary
                ? "bg-yellow-300 text-black"
                : "bg-brutal-cyan text-black"
            }`}
          >
            {state.report.isPreliminary ? "Preliminary" : "Ready"}
          </span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          {reportTitle}
        </h1>
        <p className="max-w-3xl text-base font-medium text-black/70">
          {publicMode
            ? "This public snapshot uses one user's saved Wishocracy trade-offs to rank benchmark politicians by how closely their budget posture matches."
            : "This report uses your saved Wishocracy trade-offs to rank benchmark politicians by how closely their budget posture matches your priorities."}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 border-2 border-black bg-brutal-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-4 w-4" />
                Best Match
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase text-black">
                  {topMatch?.name}
                </h2>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-black/60">
                  {topMatch?.title} · {topMatch?.party}
                </p>
                {topMatch ? (
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-black/50">
                    {formatCoverageLabel(topMatch)}
                  </p>
                ) : null}
              </div>
              <p className="max-w-2xl text-sm font-medium text-black/70">
                {topMatch?.summary}
              </p>
            </div>
            <div className="min-w-40 border-4 border-black bg-brutal-cyan p-5 text-center">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                Alignment Score
              </div>
              <div className="mt-2 text-4xl font-black text-black">
                {topMatch ? formatScore(topMatch.score) : "0.0%"}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border-2 border-black bg-pink-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                Comparisons
              </div>
              <div className="mt-2 text-3xl font-black text-black">
                {state.report.comparisonCount}
              </div>
            </div>
            <div className="border-2 border-black bg-yellow-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                Categories
              </div>
              <div className="mt-2 text-3xl font-black text-black">
                {state.report.selectedCategoryCount}
              </div>
            </div>
            <div className="border-2 border-black bg-cyan-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
                Completion
              </div>
              <div className="mt-2 text-3xl font-black text-black">
                {formatPercent(state.report.completionRatio)}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t-2 border-black pt-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              <h3 className="text-lg font-black uppercase text-black">Your Top Priorities</h3>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.report.topPriorities.map((priority) => (
                <div
                  key={priority.categoryId}
                  className="flex items-center gap-3 border-2 border-black bg-neutral-50 p-3"
                >
                  <span className="text-3xl">{priority.icon}</span>
                  <div>
                    <div className="text-sm font-black uppercase text-black">
                      {priority.name}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">
                      {priority.percentage.toFixed(1)}% of your ideal budget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h3 className="text-lg font-black uppercase text-black">
                Share This Report
              </h3>
            </div>
            <p className="mt-3 text-sm font-medium text-black/70">
              Copy or share the public report URL so other people can open this exact
              alignment snapshot.
            </p>
            <div className="mt-4">
              <CopyLinkButton url={shareUrl} className="w-full font-black uppercase" />
            </div>
            <div className="mt-4">
              <SocialShareButtons url={shareUrl} text={shareText} />
            </div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-black">Method Note</h3>
            <p className="mt-3 text-sm font-medium text-black/70">
              {state.report.candidateSourceNote || ALIGNMENT_BENCHMARK_SOURCE_NOTE}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-black/50">
              Generated {new Date(state.report.generatedAt).toLocaleString()}
            </p>
            {state.report.candidateLastSyncedAt ? (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-black/50">
                Politician sync {new Date(state.report.candidateLastSyncedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          {publicMode ? (
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-black">Try Your Own</h3>
              <p className="mt-3 text-sm font-medium text-black/70">
                Create your own alignment report by completing the Wishocracy budget trade-offs.
              </p>
              <div className="mt-4">
                <Button asChild className="font-black uppercase">
                  <Link href={wishocracyLink.href}>Start Wishocracy</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase text-black">Ranked Matches</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {state.report.politicians.map((politician) => (
            <article
              key={politician.politicianId}
              className="border-2 border-black bg-neutral-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                    Rank #{politician.rank}
                  </div>
                  <h3 className="mt-1 text-2xl font-black uppercase text-black">
                    {politician.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-black/60">
                    {politician.title} · {politician.party}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-black/50">
                    {formatCoverageLabel(politician)}
                  </p>
                </div>
                <div className="border-2 border-black bg-white px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50">
                    Score
                  </div>
                  <div className="text-2xl font-black text-black">
                    {formatScore(politician.score)}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-black/70">{politician.summary}</p>

              <div className="mt-5 grid gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                    Closest Matches
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.closestMatches.map((gap) => (
                      <span
                        key={`${politician.politicianId}-${gap.itemId}-match`}
                        className="border-2 border-black bg-brutal-cyan/30 px-2 py-1 text-xs font-bold uppercase"
                      >
                        {gap.itemName}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                    You Want More
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.wantsMore.length > 0 ? (
                      politician.wantsMore.map((gap) => (
                        <span
                          key={`${politician.politicianId}-${gap.itemId}-more`}
                          className="border-2 border-black bg-pink-100 px-2 py-1 text-xs font-bold uppercase"
                        >
                          {gap.itemName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">
                        No major shortfalls
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-black/50">
                    You Want Less
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.wantsLess.length > 0 ? (
                      politician.wantsLess.map((gap) => (
                        <span
                          key={`${politician.politicianId}-${gap.itemId}-less`}
                          className="border-2 border-black bg-yellow-100 px-2 py-1 text-xs font-bold uppercase"
                        >
                          {gap.itemName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">
                        No major overshoots
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
