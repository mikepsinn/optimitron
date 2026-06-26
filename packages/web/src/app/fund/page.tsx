import { BrutalCard } from "@/components/ui/brutal-card";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import {
  earthOptimizationPrizeDetailsLink,
  fundLink,
  ROUTES,
  scoreboardLink,
  tasksLink,
  videoLink,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { NavItemLink } from "@/components/navigation/NavItemLink";

export const metadata = getRouteMetadata(fundLink);

const fundingPaths = [
  {
    title: "Fund The Prize Pool",
    body: "Deposit into the Earth Optimization Prize. Bring in verified voters. If the treaty fails, you claim your principal plus the yield. Zero downside.",
    href: ROUTES.prize,
    variant: "secondary" as const,
    color: "pink" as const,
  },
  {
    title: "Fund The Bottleneck",
    body: "Open the task queue. Pay for the blocker that actually moves votes, organizations, or leaders.",
    href: ROUTES.tasks,
    variant: "yellow" as const,
    color: "yellow" as const,
  },
  {
    title: "Check The Proof",
    body: "Every dollar points to a scoreboard, an overdue task, or a leader page. No receipt, no money. That is the deal.",
    href: ROUTES.scoreboard,
    variant: "cyan" as const,
    color: "cyan" as const,
  },
];

export default function FundPage() {
  return (
    <div>
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        padding="lg"
      >
        <Container>
          <SectionHeader
            title="Fund Optimization"
            subtitle="Put money where it moves votes, organizations, leaders, or measurable treaty demand."
            size="lg"
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <BrutalCard bgColor="foreground" shadowSize={12} padding="lg">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-background">
                Current State
              </p>
              <h2 className="mb-4 text-3xl font-black uppercase text-background">
                Money In, Accountable Work Out
              </h2>
              <p className="mb-4 text-base font-bold leading-relaxed text-background/85">
                Fund the Earth Optimization Prize. Check the public queue and
                scoreboards to see exactly what each dollar buys before you send
                it.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <GameCTA href={ROUTES.prize} variant="primary">
                  Fund The Prize
                </GameCTA>
                <GameCTA href={ROUTES.tasks} variant="outline">
                  Inspect Bottlenecks
                </GameCTA>
                <GameCTA href={ROUTES.video} variant="outline">
                  Watch The Pitch
                </GameCTA>
              </div>
            </BrutalCard>

            <BrutalCard bgColor="background" shadowSize={8} padding="lg">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-foreground">
                Grounding
              </p>
              <ul className="space-y-3 text-sm font-bold leading-relaxed text-foreground">
                <li>Scoreboards define the end metrics.</li>
                <li>Tasks show current bottlenecks.</li>
                <li>Leader pages show who is overdue.</li>
                <li>
                  The manual specifies the expected-value math and prize
                  mechanics.
                </li>
              </ul>
              <NavItemLink
                item={earthOptimizationPrizeDetailsLink}
                variant="custom"
                external
                className="mt-6 inline-flex items-center text-xs font-black uppercase text-foreground hover:text-foreground"
              >
                Read the prize math
              </NavItemLink>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="primary" borderPosition="bottom" padding="lg">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {fundingPaths.map((path) => (
              <BrutalCard
                key={path.title}
                bgColor={path.color}
                shadowSize={8}
                padding="lg"
                hover
              >
                <h3 className="mb-3 text-2xl font-black uppercase text-foreground">
                  {path.title}
                </h3>
                <p className="mb-4 text-base font-bold text-foreground">
                  {path.body}
                </p>
                <GameCTA href={path.href} variant={path.variant}>
                  Open
                </GameCTA>
              </BrutalCard>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" padding="lg">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <BrutalCard bgColor="cyan" shadowSize={8} padding="lg">
              <h3 className="mb-3 text-2xl font-black uppercase text-foreground">
                What To Demand
              </h3>
              <p className="mb-4 text-base font-bold text-foreground">
                Demand a task, a ceiling price, the proof you can check, an
                expected value, and a done condition.
              </p>
              <GameCTA href={tasksLink.href} variant="secondary">
                See Live Tasks
              </GameCTA>
            </BrutalCard>

            <BrutalCard bgColor="yellow" shadowSize={8} padding="lg">
              <h3 className="mb-3 text-2xl font-black uppercase text-foreground">
                What To Reject
              </h3>
              <p className="mb-4 text-base font-bold text-foreground">
                Reject generic fundraising fluff, unsourced strategy decks, and
                work that cannot name the bottleneck it clears.
              </p>
              <GameCTA href={scoreboardLink.href} variant="secondary">
                Check Outcome Metrics
              </GameCTA>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>
    </div>
  );
}
