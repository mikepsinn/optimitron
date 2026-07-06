import { DISEASES_WITHOUT_EFFECTIVE_TREATMENT } from "@optimitron/data/parameters";
import { Container } from "@/components/ui/container";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { ROUTES } from "@/lib/routes";
import { FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR } from "@/lib/treaty-share-flow-parameters";

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
          <h2 className="text-3xl font-black uppercase leading-tight sm:text-5xl">
            Vote on the 1% Treaty
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-muted-foreground sm:text-lg">
            Trade one apocalypse for disease eradication. Humanity has{" "}
            <ParameterValue
              param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
              display="integer"
              presentation="inline"
            />{" "}
            stockpiled — you can spare one to cure the{" "}
            <ParameterValue
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
              presentation="inline"
              valueOverride={DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value.toLocaleString(
                "en-US",
              )}
            />{" "}
            diseases with no treatment.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GameCTA href={ROUTES.vote} size="lg" variant="primary">
              Vote Now
            </GameCTA>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}
