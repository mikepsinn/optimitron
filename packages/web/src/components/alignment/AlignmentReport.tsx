"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, ExternalLink, Scale, Shield, Sparkles, Target } from "lucide-react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { Button } from "@/components/retroui/Button";
import { ALIGNMENT_BENCHMARK_SOURCE_NOTE } from "@/lib/alignment-benchmarks";
import type { PersonalAlignmentState } from "@/lib/alignment-report";
import { wishocracyLink } from "@/lib/routes";
import { PrizeCTA } from "@/components/prize/PrizeCTA";
import hypercertData from "@/data/alignment-hypercerts.json";

interface HypercertPolitician {
  politicianId: string;
  name: string;
  storageCid: string;
  activityUri: string;
  evaluationUri: string;
  alignmentScore: number;
}

const hypercertsByPolitician = new Map(
  (hypercertData.politicians as HypercertPolitician[]).map((p) => [p.politicianId, p]),
);

function HypercertBadge({ politicianId }: { politicianId: string }) {
  const cert = hypercertsByPolitician.get(politicianId);
  if (!cert) return null;

  return (
    <a
      href={`https://${cert.storageCid}.ipfs.storacha.link/`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 border-4 border-primary bg-brutal-cyan px-2 py-1 text-xs font-black uppercase tracking-[0.1em] text-foreground transition-all hover:bg-brutal-cyan/80 hover:translate-x-[1px] hover:translate-y-[1px]"
      title="This alignment score is published as a Hypercert on AT Protocol, with data stored on Storacha (IPFS)"
    >
      <Shield className="h-3 w-3" />
      Data on Storacha
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

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
  const methodNote =
    state.status === "ready" && state.report.candidateSourceNote.length > 0
      ? state.report.candidateSourceNote
      : ALIGNMENT_BENCHMARK_SOURCE_NOTE;
  const reportTitle =
    publicMode && ownerLabel
      ? `Alignment Report for ${ownerLabel}`
      : "Personal Politician Report";

  // Track alignment check for wish points (fire once when report is ready)
  const trackedRef = useRef(false);
  useEffect(() => {
    if (state.status === "ready" && !publicMode && !trackedRef.current) {
      trackedRef.current = true;
      fetch("/api/alignment/check", { method: "POST" }).catch(() => {});
    }
  }, [state.status, publicMode]);

  if (state.status === "empty") {
    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            {publicMode ? "Shared Alignment" : "Your Alignment"}
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
            {reportTitle}
          </h1>
          <p className="max-w-3xl text-base font-bold text-foreground">
            {publicMode
              ? "This shared report link exists, but there is not enough saved Wishocracy data yet to render a public alignment snapshot."
              : "Compare your budget priorities against real benchmark politician profiles once you have enough pairwise trade-offs saved."}
          </p>
        </section>

        <section className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 border-4 border-primary bg-brutal-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
              <Target className="h-4 w-4" />
              Not Ready Yet
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase text-foreground">{state.headline}</h2>
              <p className="text-base font-bold text-foreground">{state.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-4 border-primary bg-brutal-cyan p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Comparisons Saved
                </div>
                <div className="mt-2 text-3xl font-black text-foreground">{state.allocationCount}</div>
              </div>
              <div className="border-4 border-primary bg-brutal-yellow p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Categories In Scope
                </div>
                <div className="mt-2 text-3xl font-black text-foreground">
                  {state.selectedItemCount}
                </div>
              </div>
              <div className="border-4 border-primary bg-brutal-pink p-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Completion
                </div>
                <div className="mt-2 text-3xl font-black text-foreground">
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
      ? `See how ${ownerLabel} lines up against Optimitron's federal benchmark politicians.`
      : "I compared my budget priorities against Optimitron's federal benchmark politicians. See how yours line up.";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            {publicMode ? "Shared Alignment" : "Your Alignment"}
          </p>
          <span
            className={`border-4 border-primary px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${
              state.report.isPreliminary
                ? "bg-brutal-yellow text-foreground"
                : "bg-brutal-cyan text-foreground"
            }`}
          >
            {state.report.isPreliminary ? "Preliminary" : "Ready"}
          </span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
          {reportTitle}
        </h1>
        <p className="max-w-3xl text-base font-bold text-foreground">
          {publicMode
            ? "This public snapshot uses one user's saved Wishocracy trade-offs to rank benchmark politicians by how closely their budget posture matches."
            : "This report uses your saved Wishocracy trade-offs to rank benchmark politicians by how closely their budget posture matches your priorities."}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 border-4 border-primary bg-brutal-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-4 w-4" />
                Best Match
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase text-foreground">
                  {topMatch.name}
                </h2>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {topMatch.title} · {topMatch.party}
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  {formatCoverageLabel(topMatch)}
                </p>
              </div>
              <p className="max-w-2xl text-sm font-bold text-foreground">
                {topMatch.summary}
              </p>
              <HypercertBadge politicianId={topMatch.politicianId} />
            </div>
            <div className="min-w-40 border-4 border-primary bg-brutal-cyan p-5 text-center">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Alignment Score
              </div>
              <div className="mt-2 text-4xl font-black text-foreground">
                {formatScore(topMatch.score)}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border-4 border-primary bg-brutal-pink p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Comparisons
              </div>
              <div className="mt-2 text-3xl font-black text-foreground">
                {state.report.allocationCount}
              </div>
            </div>
            <div className="border-4 border-primary bg-brutal-yellow p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Categories
              </div>
              <div className="mt-2 text-3xl font-black text-foreground">
                {state.report.selectedItemCount}
              </div>
            </div>
            <div className="border-4 border-primary bg-brutal-cyan p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                Completion
              </div>
              <div className="mt-2 text-3xl font-black text-foreground">
                {formatPercent(state.report.completionRatio)}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t-2 border-primary pt-6">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              <h3 className="text-lg font-black uppercase text-foreground">Your Top Priorities</h3>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.report.topPriorities.map((priority) => (
                <div
                  key={priority.itemId}
                  className="flex items-center gap-3 border-4 border-primary bg-muted p-3"
                >
                  <span className="text-3xl">{priority.icon}</span>
                  <div>
                    <div className="text-sm font-black uppercase text-foreground">
                      {priority.name}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {priority.percentage.toFixed(1)}% of your ideal budget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h3 className="text-lg font-black uppercase text-foreground">
                Share This Report
              </h3>
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">
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

          <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-foreground">Method Note</h3>
            <p className="mt-3 text-sm font-bold text-foreground">
              {methodNote}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Generated {new Date(state.report.generatedAt).toLocaleString()}
            </p>
            {state.report.candidateLastSyncedAt ? (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Politician sync {new Date(state.report.candidateLastSyncedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          {publicMode ? (
            <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase text-foreground">Try Your Own</h3>
              <p className="mt-3 text-sm font-bold text-foreground">
                Create your own alignment report by completing the Wishocracy budget trade-offs.
              </p>
              <div className="mt-4">
                <Button asChild className="font-black uppercase">
                  <NavItemLink item={wishocracyLink} variant="custom">
                    Start Wishocracy
                  </NavItemLink>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase text-foreground">Ranked Matches</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {state.report.politicians.map((politician) => (
            <article
              key={politician.politicianId}
              className="border-4 border-primary bg-muted p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Rank #{politician.rank}
                  </div>
                  <h3 className="mt-1 text-2xl font-black uppercase text-foreground">
                    {politician.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {politician.title} · {politician.party}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    {formatCoverageLabel(politician)}
                  </p>
                </div>
                <div className="border-4 border-primary bg-background px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Score
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {formatScore(politician.score)}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-foreground">{politician.summary}</p>
              <HypercertBadge politicianId={politician.politicianId} />

              <div className="mt-5 grid gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Closest Matches
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.closestMatches.map((gap) => (
                      <span
                        key={`${politician.politicianId}-${gap.itemId}-match`}
                        className="border-4 border-primary bg-brutal-cyan px-2 py-1 text-xs font-bold uppercase"
                      >
                        {gap.itemName}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    You Want More
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.wantsMore.length > 0 ? (
                      politician.wantsMore.map((gap) => (
                        <span
                          key={`${politician.politicianId}-${gap.itemId}-more`}
                          className="border-4 border-primary bg-brutal-pink px-2 py-1 text-xs font-bold uppercase"
                        >
                          {gap.itemName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        No major shortfalls
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    You Want Less
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {politician.wantsLess.length > 0 ? (
                      politician.wantsLess.map((gap) => (
                        <span
                          key={`${politician.politicianId}-${gap.itemId}-less`}
                          className="border-4 border-primary bg-brutal-yellow px-2 py-1 text-xs font-bold uppercase"
                        >
                          {gap.itemName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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

      <section className="mb-10">
        <PrizeCTA
          headline="Prove that voters want representatives who actually represent them."
          body="The alignment scores above show the gap. The 1% Treaty referendum collapses pluralistic ignorance — everyone wants this, nobody knows everyone else does. Deposit USDC, recruit verified voters, earn VOTE points."
          variant="cyan"
        />
      </section>

      <section className="border-4 border-primary bg-brutal-cyan p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <h2 className="text-2xl font-black uppercase text-foreground">
            Verifiable Attestations
          </h2>
        </div>
        <p className="text-sm font-bold text-foreground max-w-3xl mb-6">
          Every alignment score above is published as a{" "}
          <a
            href="https://hypercerts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-foreground underline hover:text-brutal-pink"
          >
            Hypercert
          </a>{" "}
          on the AT Protocol and stored on{" "}
          <a
            href="https://storacha.network"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-foreground underline hover:text-brutal-pink"
          >
            Storacha
          </a>{" "}
          (IPFS). These verifiable records enable{" "}
          <a
            href="https://iab.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-foreground underline hover:text-brutal-pink"
          >
            Incentive Alignment Bonds
          </a>{" "}
          — smart contracts that distribute campaign funds based on how well
          politicians align with citizen preferences.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {hypercertData.politicians.map((pol) => (
            <div
              key={pol.politicianId}
              className="border-4 border-primary bg-background p-3"
            >
              <div className="text-xs font-black uppercase text-foreground">
                {pol.name}
              </div>
              <div className="text-xs font-bold text-muted-foreground mt-1">
                Score: {pol.alignmentScore}%
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a
                  href={`https://${pol.storageCid}.ipfs.storacha.link/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-primary bg-brutal-cyan px-1.5 py-0.5 text-[10px] font-black uppercase hover:bg-brutal-cyan"
                >
                  IPFS <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <span
                  className="inline-flex items-center gap-1 border border-primary bg-brutal-cyan px-1.5 py-0.5 text-[10px] font-black uppercase"
                  title={pol.activityUri}
                >
                  AT Proto
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Methodology:{" "}
          <a
            href="https://wishocracy.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brutal-pink"
          >
            wishocracy.warondisease.org
          </a>{" "}
          · Generated {new Date(hypercertData.generatedAt).toLocaleString()}
        </p>
      </section>
    </div>
  );
}
