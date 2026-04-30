import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { ROUTES } from "@/lib/routes";

export default function TreatyVoteSection() {
  return (
    <SectionContainer
      id="vote"
      bgColor="background"
      borderPosition="both"
      padding="md"
    >
      <Container size="md">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-pixel text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
            Treaty vote
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl">
            Vote on the 1% Treaty
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-muted-foreground sm:text-lg">
            One slider. One yes-or-no question. Then Humanity Management
            Training helps you give two humans their treaty voting tasks.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GameCTA href={ROUTES.vote} size="lg" variant="primary">
              Vote Now
            </GameCTA>
            <GameCTA href={ROUTES.questions} size="lg" variant="outline">
              See the Questions
            </GameCTA>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
