import Link from "next/link";
import type { Metadata } from "next";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "dCongress — Direct Democracy | Optimitron",
  description:
    "Congress has two jobs: set the budget and pass laws. Wishonia replaces both with direct citizen participation. No representatives required.",
};

const subAgencies = [
  {
    emoji: "🗳️",
    name: "Wishocracy",
    description:
      "Pick between two things. Do it ten times. Eigenvector decomposition produces a stable budget allocation. Democracy in four minutes. No lobbyists. No filibuster.",
    href: ROUTES.wishocracy,
    earthEquivalent: "Congressional Appropriations",
    color: "yellow" as const,
  },
  {
    emoji: "📜",
    name: "Referendums",
    description:
      "Vote on proposals directly. Verify with World ID. Skip the middleman who was going to ignore you anyway.",
    href: ROUTES.referendum,
    earthEquivalent: "Congressional Legislation",
    color: "cyan" as const,
  },
];

export default function DCongressPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={ROUTES.agencies}
        className="text-sm font-black uppercase text-muted-foreground hover:text-brutal-pink transition-colors"
      >
        &larr; Optimized Governance
      </Link>

      <section className="mt-6 mb-12">
        <ArcadeTag>Direct Democracy</ArcadeTag>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          dCongress
        </h1>
        <p className="mt-4 text-lg font-bold leading-relaxed text-foreground max-w-3xl">
          On Earth, 535 people decide how to spend $6.8 trillion. None of them
          asked you. On my planet, every citizen allocates the budget in four
          minutes and votes on legislation directly.
        </p>
        <p className="mt-3 text-muted-foreground font-bold">
          Congress has two jobs: set the budget and pass laws. We replaced both
          with maths and a smartphone.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-12">
        {subAgencies.map((agency) => (
          <Link key={agency.name} href={agency.href} className="block">
            <BrutalCard
              bgColor={agency.color}
              hover
              padding="lg"
              className="h-full"
            >
              <span className="text-3xl">{agency.emoji}</span>
              <h2 className="mt-2 text-xl font-black uppercase text-foreground">
                {agency.name}
              </h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                {agency.description}
              </p>
              <p className="mt-3 text-xs font-black uppercase text-muted-foreground">
                Replaces: {agency.earthEquivalent}
              </p>
            </BrutalCard>
          </Link>
        ))}
      </div>

      <section className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-lg font-bold max-w-2xl mx-auto">
          &ldquo;Your Congress has an approval rating of eighteen percent and a
          re-election rate of ninety-four percent. On my planet, we call that a
          bug. You lot call it democracy.&rdquo;
        </p>
        <p className="mt-3 text-xs font-black uppercase text-brutal-pink">
          — Wishonia
        </p>
        <div className="mt-6">
          <GameCTA href={ROUTES.wishocracy} variant="primary" size="lg">
            Try Wishocracy
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
