import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCardGrid } from "@/components/ui/stat-card";

// Teaser only. Full pitch (copyable peer message, "call me" mechanic) lives on
// the post-vote confirmation card. Do not inline the full payload here.

export function TheSecretSection() {
  return (
    <SectionContainer bgColor="pink" padding="lg">
      <Container size="lg">
        <SectionHeader
          title="There is a secret."
          subtitle="2 people tell 2 people. 32 doublings later, 4.29 billion humans have voted — ~75% of the world's adults. Disease eradication shifts forward by years."
          size="lg"
        />

        <StatCardGrid
          className="mx-auto max-w-4xl"
          columns={3}
          stats={[
            {
              value: "2³² = 4.29B",
              label: "Reach at 32 doublings",
              size: "md",
              color: "yellow",
            },
            {
              value: "~11 days",
              label: "Handoff to hit 4B in 1 year",
              size: "md",
              color: "cyan",
            },
            {
              value: "~1.7 / sec",
              label: "Disease deaths, globally",
              size: "md",
              color: "default",
            },
          ]}
        />

        <div className="mt-12 text-center">
          <GameCTA href="#vote" variant="secondary" size="lg">
            Vote (30 sec) →
          </GameCTA>
          <p className="mt-4 text-sm font-bold">
            Vote first. The secret unlocks on the next screen.
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}
