import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

interface Props {
  data: ReferendumSiteHomeData;
}

export function OnePercentTreatyLandingPage({ data: _data }: Props) {
  // The primary vote CTA lives inside the slider screen itself, so it stays
  // visually paired with the action and disappears cleanly when the user
  // advances to the YES/NO choice screen.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <section id="sign" className="mb-16">
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.dashboard}
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          postVoteBehavior="redirect"
          postVoteRedirectUrl={ROUTES.dashboard}
          respectStoredFlowVariant={false}
          compactInitialScreen
          surface="landing_vote_page"
        />
      </section>
    </div>
  );
}
