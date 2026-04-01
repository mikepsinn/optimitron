import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { agenciesLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(agenciesLink);

interface AgencyCard {
  emoji: string;
  name: string;
  description: string;
  href: string;
  earthEquivalent: string;
  color: "pink" | "cyan" | "yellow" | "background";
}

const departments: { label: string; agencies: AgencyCard[] }[] = [
  {
    label: "Democracy",
    agencies: [
      {
        emoji: "🏛️",
        name: "dCongress",
        description:
          "Every citizen votes on the budget. Takes two minutes. Your Congress takes two years and still gets it wrong.",
        href: ROUTES.dcongress,
        earthEquivalent: "Congress",
        color: "yellow",
      },
    ],
  },
  {
    label: "Finance",
    agencies: [
      {
        emoji: "💸",
        name: "dTreasury",
        description:
          "0.5% transaction tax, UBI, and Wishocratic allocation — in one currency. The seventy-four-thousand-page tax code is not invited.",
        href: ROUTES.dtreasury,
        earthEquivalent: "Treasury + IRS + Federal Reserve + Social Security",
        color: "pink",
      },
      {
        emoji: "🤝",
        name: "dFEC",
        description:
          "Smart contracts fund politicians by alignment score. No PACs. No lobbying. No bribery with extra steps.",
        href: ROUTES.dfec,
        earthEquivalent: "Federal Election Commission",
        color: "cyan",
      },
    ],
  },
  {
    label: "Analysis",
    agencies: [
      {
        emoji: "📋",
        name: "dCBO",
        description:
          "Every policy ranked by whether it actually works. Scores in 200 milliseconds. Shows its work.",
        href: ROUTES.dcbo,
        earthEquivalent: "Congressional Budget Office",
        color: "cyan",
      },
      {
        emoji: "💰",
        name: "dOMB",
        description:
          "What should your government spend money on? I asked everyone and did the maths. Your current method is to let lobbyists decide over dinner.",
        href: ROUTES.domb,
        earthEquivalent: "Office of Management and Budget",
        color: "yellow",
      },
      {
        emoji: "🔍",
        name: "dGAO",
        description:
          "Every number stored where nobody can quietly delete it. Your governments love deleting things. This system can't.",
        href: ROUTES.dgao,
        earthEquivalent: "Government Accountability Office",
        color: "background",
      },
    ],
  },
  {
    label: "Services",
    agencies: [
      {
        emoji: "🧬",
        name: "dIH",
        description:
          "Same science, 30x cheaper, 44x faster. Your NIH spends 97% of its budget on things that aren't clinical trials. It's a fire department that budgets 3% for water.",
        href: ROUTES.dih,
        earthEquivalent: "National Institutes of Health + FDA",
        color: "pink",
      },
      {
        emoji: "💀",
        name: "dDoD",
        description:
          "We don't have one. War is a negative-sum game and the spreadsheet agrees.",
        href: ROUTES.ddod,
        earthEquivalent: "Department of Defense",
        color: "background",
      },
      {
        emoji: "🌐",
        name: "dCensus",
        description:
          "citizenCount() returns in fifty milliseconds. No fourteen-billion-dollar survey required.",
        href: ROUTES.dcensus,
        earthEquivalent: "Census Bureau",
        color: "cyan",
      },
    ],
  },
];

const totalAgencies = departments.reduce((sum, d) => sum + d.agencies.length, 0);

export default function AgenciesIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <ArcadeTag>{totalAgencies} Agencies</ArcadeTag>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
            Optimized Governance
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            On my planet, governance takes about four minutes a week. Nine
            agencies run everything. No bureaucracy, no lobbying, no
            seventy-four-thousand-page tax code. Just code that does what it
            says.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            Your species has 440 federal agencies. Most of them exist to manage
            the failures of other agencies. Here is what a working government
            looks like.
          </p>
        </div>
      </section>

      {/* Departments */}
      {departments.map((dept) => (
        <section key={dept.label} className="mb-12">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-6">
            {dept.label}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {dept.agencies.map((agency) => (
              <Link key={agency.name} href={agency.href} className="block">
                <BrutalCard
                  bgColor={agency.color}
                  hover
                  padding="lg"
                  className="h-full"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{agency.emoji}</span>
                    <span className="inline-block border-2 border-primary bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">
                      Active
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-black uppercase text-foreground">
                    {agency.name}
                  </h3>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                    {agency.description}
                  </p>
                  <p className="mt-3 text-xs font-black uppercase text-muted-foreground">
                    On Earth: {agency.earthEquivalent}
                  </p>
                </BrutalCard>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="border-4 border-primary bg-foreground text-background p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 text-2xl font-black uppercase">
          See How Earth Does It
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold opacity-80">
          Every Earth government graded on spending vs outcomes. We publish
          the results the same way you publish restaurant hygiene ratings.
          Except you actually read those.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/governments" variant="primary" size="lg">
            Government Report Cards
          </GameCTA>
          <GameCTA href={ROUTES.wishocracy} variant="yellow" size="lg">
            Play the Game
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
