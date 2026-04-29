import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { getRouteMetadata } from "@/lib/metadata";
import { questionsLink, ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata = getRouteMetadata(questionsLink);

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-[var(--treaty-paper)]">
      <section id="vote" className="min-h-screen bg-[var(--treaty-paper)]">
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.humanityManagementTraining}
          defaultFlowVariant={TREATY_FLOW_VARIANTS.contextFirstV2}
          postVoteBehavior="redirect"
          postVoteRedirectUrl={ROUTES.humanityManagementTraining}
          respectStoredFlowVariant={false}
          surface="questions_page"
        />
      </section>
    </div>
  );
}
