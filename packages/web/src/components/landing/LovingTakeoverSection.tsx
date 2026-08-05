import { MachineDiagram } from "@/components/eos-retro/MachineDiagram";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import "@/components/eos-retro/eos-retro.css";

export function LovingTakeoverSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="both"
      id="loving-takeover"
      padding="lg"
    >
      <Container size="lg">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            From recommendation to power
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            The Loving Takeover
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold leading-8">
            Calculating better laws is not enough. The plan is to buy voting
            shares in the companies whose lobbying writes government budgets,
            use shareholder rights to redirect that lobbying toward
            Optimitron&apos;s highest-value recommendations, and keep the
            shares.
          </p>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-muted-foreground">
            Better policy grows the economy those companies sell into. The value
            increase funds the next turn of the machine. Greed and altruism
            finally point at the same button.
          </p>
        </div>

        <div className="eos-retro mt-12 border border-foreground p-4 sm:p-8">
          <MachineDiagram fitWidth />
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <GameCTA href="/tasks/loving-takeover#funding">
            Fund the Loving Takeover
          </GameCTA>
          <GameCTA
            external
            href="https://manual.warondisease.org/knowledge/appendix/loving-takeover.html"
            variant="outline"
          >
            Read the analysis
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
