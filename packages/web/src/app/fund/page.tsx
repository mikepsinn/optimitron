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
    body: "The current on-chain path is the Earth Optimization Prize. Deposit into the pool, recruit voters, and make the demand for the treaty legible.",
    href: ROUTES.prize,
    variant: "secondary" as const,
    color: "pink" as const,
  },
  {
    title: "Fund The Bottleneck",
    body: "Use the public task queue to see the current highest-value bottlenecks, who owns them, and what concrete work still needs to happen.",
    href: ROUTES.tasks,
    variant: "yellow" as const,
    color: "yellow" as const,
  },
  {
    title: "Check The Proof",
    body: "If a funding ask cannot point to a measurable scoreboard, overdue task list, or politician page, it is not grounded enough yet.",
    href: ROUTES.scoreboard,
    variant: "cyan" as const,
    color: "cyan" as const,
  },
];

export default function FundPage() {
  return (
    <div>
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <SectionHeader
            title="Fund Optimization"
            subtitle="Put money into the highest-value bottlenecks instead of into generic hope. The system should tell you what the next dollar actually unlocks."
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
                The product direction is simple: funding should flow into the
                best currently grounded bottleneck, not into a vague nonprofit
                bucket. The public queue, the overdue leader pages, the
                scoreboard, and the proof surfaces exist so each spend can be
                audited against real outcomes.
              </p>
              <p className="mb-6 text-sm font-bold leading-relaxed text-background/75">
                Today, the live funding rail is the Earth Optimization Prize.
                The broader procurement layer is still being built, so this page
                routes you to the current working funding path and the proof
                surfaces that justify it.
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
                <li>The scoreboard defines the end metrics.</li>
                <li>The task list shows the current bottlenecks.</li>
                <li>The politician and government pages show who is failing publicly.</li>
                <li>The manual specifies the expected-value math and prize mechanics.</li>
              </ul>
              <NavItemLink
                item={earthOptimizationPrizeDetailsLink}
                variant="custom"
                external
                className="mt-6 inline-flex items-center text-xs font-black uppercase text-foreground hover:text-foreground"
              >
                Read the funding spec
              </NavItemLink>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="primary" borderPosition="bottom" padding="lg">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {fundingPaths.map((path) => (
              <BrutalCard key={path.title} bgColor={path.color} shadowSize={8} padding="lg" hover>
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
                Funding asks should be specific: what task, what ceiling price,
                what proof surface, what expected downstream value, and what
                counts as done.
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
                Generic fundraising fluff, unsourced strategy decks, and work
                that cannot be tied back to a real bottleneck should not get
                paid just because it sounds important.
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
