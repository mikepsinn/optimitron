import Link from "next/link";
import type { Metadata } from "next";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "dFEC — Elections & Accountability | Optimitron",
  description:
    "Smart contracts fund politicians by alignment score. No PACs. No lobbying. No bribery with extra steps.",
};

export default function DFECPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={ROUTES.agencies}
        className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
      >
        &larr; Optimized Governance
      </Link>

      <section className="mt-6 mb-12">
        <ArcadeTag>Elections &amp; Accountability</ArcadeTag>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          dFEC
        </h1>
        <p className="mt-4 text-lg font-bold leading-relaxed text-foreground max-w-3xl">
          Your politicians are funded by the people they are supposed to
          regulate. You call this &ldquo;campaign finance.&rdquo; I call it
          bribery with extra steps.
        </p>
        <p className="mt-3 text-muted-foreground font-bold">
          On my planet, officials are funded proportionally to how well they
          align with citizen preferences. Smart contracts handle the maths.
          Lobbying is not a thing.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <BrutalCard bgColor="pink" shadowSize={4} padding="md">
          <div className="text-xs font-black uppercase text-muted-foreground">2024 Election Spending</div>
          <div className="mt-1 text-2xl font-black text-foreground">$4.7B</div>
        </BrutalCard>
        <BrutalCard bgColor="yellow" shadowSize={4} padding="md">
          <div className="text-xs font-black uppercase text-muted-foreground">Annual Lobbying</div>
          <div className="mt-1 text-2xl font-black text-foreground">$3.7B</div>
        </BrutalCard>
        <BrutalCard bgColor="cyan" shadowSize={4} padding="md">
          <div className="text-xs font-black uppercase text-muted-foreground">Dark Money Growth</div>
          <div className="mt-1 text-2xl font-black text-foreground">67%</div>
        </BrutalCard>
        <BrutalCard bgColor="background" shadowSize={4} padding="md">
          <div className="text-xs font-black uppercase text-muted-foreground">Mega-Donors</div>
          <div className="mt-1 text-2xl font-black text-foreground">0.01%</div>
          <div className="text-xs font-bold text-muted-foreground">of the population</div>
        </BrutalCard>
      </section>

      {/* Alignment Tool */}
      <section className="mb-12">
        <Link href={ROUTES.alignment} className="block">
          <BrutalCard bgColor="cyan" hover padding="lg">
            <span className="text-3xl">🔮</span>
            <h2 className="mt-2 text-xl font-black uppercase text-foreground">
              Alignment Scoring
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
              You tell us what you want. We compare it against what your politicians
              actually voted for. Each one gets a number. The number is usually
              disappointing. That&apos;s not a bug in the tool.
            </p>
            <p className="mt-3 text-xs font-black uppercase text-muted-foreground">
              Replaces: Campaign promises nobody checks
            </p>
          </BrutalCard>
        </Link>
      </section>

      {/* How it works */}
      <section className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
        <h2 className="text-xl font-black uppercase text-foreground mb-4">
          How dFEC Works
        </h2>
        <div className="space-y-4 text-sm font-bold text-foreground">
          <p>
            <span className="text-brutal-pink font-black">1.</span> Citizens pick
            between two things. Then two more. The maths works out what you
            actually want. (Turns out nobody had asked before.)
          </p>
          <p>
            <span className="text-brutal-pink font-black">2.</span> Politicians
            vote on real legislation. Their votes are compared against citizen
            preferences.
          </p>
          <p>
            <span className="text-brutal-pink font-black">3.</span> Each
            politician gets a single number: how much they actually did what
            you asked. It&apos;s like a restaurant hygiene rating, except for
            democracy.
          </p>
          <p>
            <span className="text-brutal-pink font-black">4.</span> Smart
            contracts route money to politicians based on their score. No
            lobbyists. No donors. No dinner fundraisers at $50,000 a plate.
          </p>
          <p>
            <span className="text-brutal-pink font-black">5.</span> Politicians
            who align with citizens get funded. Those who don&apos;t, don&apos;t.
            No lobbying required.
          </p>
        </div>
      </section>

      <section className="text-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href={ROUTES.alignment} variant="primary" size="lg">
            Check Your Alignment
          </GameCTA>
          <GameCTA href={ROUTES.iab} variant="secondary" size="lg">
            Incentive Alignment Bonds
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
