import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { getRouteMetadata } from "@/lib/metadata";
import { ROUTES, voteLink } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata = getRouteMetadata(voteLink);

export default function VotePage() {
  return (
    <div className="min-h-screen bg-[var(--treaty-paper)]">
      <section id="vote" className="min-h-screen bg-[var(--treaty-paper)]">
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.dashboard}
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          postVoteBehavior="redirect"
          postVoteRedirectUrl={ROUTES.dashboard}
          respectStoredFlowVariant={false}
          surface="fast_vote_page"
        />
      </section>
    </div>
  );
}
