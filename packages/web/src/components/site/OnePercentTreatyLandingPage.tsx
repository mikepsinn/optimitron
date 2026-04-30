import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

interface Props {
  data: ReferendumSiteHomeData;
}

export function OnePercentTreatyLandingPage({ data }: Props) {
  const { content } = data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-6 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.home.heroTitle}
        </h1>
      </header>

      <section id="sign" className="mb-16">
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.humanityManagementTraining}
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          postVoteBehavior="redirect"
          postVoteRedirectUrl={ROUTES.humanityManagementTraining}
          respectStoredFlowVariant={false}
          compactInitialScreen
          surface="landing_vote_page"
        />
      </section>
    </div>
  );
}
