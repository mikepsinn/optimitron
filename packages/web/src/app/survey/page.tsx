import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { getRouteMetadata } from "@/lib/metadata";
import { ROUTES, trialSurveyLink } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata = getRouteMetadata(trialSurveyLink);

export default function SurveyPage() {
  return (
    <main className="min-h-screen bg-[var(--treaty-paper)]">
      <TreatyVoteFlow
        authCallbackUrl={ROUTES.dashboard}
        defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
        postVoteCompletion="message"
        respectStoredFlowVariant={false}
        sliderHeadline={GLOBAL_SURVEY_NAME}
        sliderPrompt="Which split best improves health and real income?"
        surface="neutral_survey"
      />
    </main>
  );
}
