import { Suspense } from "react";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export default function TreatyVoteSection() {
  return (
    <SectionContainer
      id="vote"
      bgColor="background"
      borderPosition="both"
      padding="sm"
    >
      <Container size="lg">
        <Suspense fallback={null}>
          <TreatyVoteFlow
            authCallbackUrl={ROUTES.dashboard}
            compactInitialScreen
            defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
            respectStoredFlowVariant={false}
            sliderHeadingLevel="h2"
            surface="game_landing"
          />
        </Suspense>
      </Container>
    </SectionContainer>
  );
}
