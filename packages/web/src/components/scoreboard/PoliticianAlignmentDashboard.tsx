"use client";

import type { AggregateScoreData } from "@/lib/aggregate-alignment.server";
import { PrizeCTA } from "@/components/prize/PrizeCTA";
import { CitizenPrioritiesChart } from "./CitizenPrioritiesChart";
import { AlignmentScoreTable } from "./AlignmentScoreTable";

interface PoliticianAlignmentDashboardProps {
  data: AggregateScoreData;
}

export function PoliticianAlignmentDashboard({ data }: PoliticianAlignmentDashboardProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-12 space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
          Public Scoreboard
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
          How Your Representatives Actually Vote (vs. What They Told You)
        </h1>
        <p className="max-w-3xl text-base font-bold text-foreground">
          On my planet, officials who ignore citizen preferences get replaced in
          four minutes. Here, you re-elect them for decades and then wonder why
          nothing works. This scoreboard compares what citizens actually want
          against how politicians actually vote. The gap is&hellip; instructive.
        </p>
      </section>

      {/* Metadata cards */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-4 border-primary bg-brutal-cyan p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Jurisdiction
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">
            {data.jurisdiction.name ?? data.jurisdiction.code}
          </div>
        </div>
        <div className="border-4 border-primary bg-brutal-pink p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Comparisons
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">
            {data.aggregationRun.allocationCount.toLocaleString()}
          </div>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Participants
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">
            {data.aggregationRun.participantCount.toLocaleString()}
          </div>
        </div>
        <div className="border-4 border-primary bg-background p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Consistency
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">
            {data.aggregationRun.consistencyRatio != null
              ? `${(data.aggregationRun.consistencyRatio * 100).toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
      </section>

      {/* Citizen Priorities */}
      <section className="mb-10 border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase text-foreground">
          What Citizens Actually Want
        </h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          These weights come from citizens comparing priorities in pairs. Higher
          weight = more humans chose this over the alternatives. Direct democracy
          in four minutes.
        </p>
        <div className="mt-6">
          <CitizenPrioritiesChart priorities={data.citizenPriorities} />
        </div>
      </section>

      {/* Scoreboard Table */}
      <section className="mb-10 border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase text-foreground">
          Politician Rankings
        </h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Sorted by Citizen Alignment Score. This is how closely each
          politician&apos;s actual voting record matches aggregate citizen
          preferences. Not what they promise. What they do.
        </p>
        <div className="mt-6">
          <AlignmentScoreTable politicians={data.politicians} />
        </div>
      </section>

      {/* Footer note */}
      <section className="border-4 border-primary bg-muted p-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Last computed:{" "}
          {new Date(data.aggregationRun.computedAt).toLocaleString()} &middot;{" "}
          {data.aggregationRun.allocationCount} pairwise comparisons from{" "}
          {data.aggregationRun.participantCount} participants
        </p>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          Scores update as more citizens vote. More participants = more accurate
          weights. Politicians are scored against what everyone wants, not what
          any one person wants. Democracy, basically.
        </p>
      </section>

      <section className="mt-10">
        <PrizeCTA
          headline="The gap between citizens and politicians is the problem. The referendum is the fix."
          body="The misalignment above exists because nobody has proven demand for change. Deposit USDC, recruit verified voters for the 1% Treaty referendum, earn VOTE points for every person you bring in."
          variant="pink"
        />
      </section>
    </div>
  );
}
