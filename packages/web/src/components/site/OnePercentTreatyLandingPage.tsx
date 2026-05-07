import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { VoteCounterSplit } from "@/components/referendum/VoteCounterSplit";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

interface Props {
  data: ReferendumSiteHomeData;
}

export function OnePercentTreatyLandingPage({ data }: Props) {
  const totalVoices =
    data.individualCount + data.memorialVoteCount + data.representedHumanCount;

  // The hero/CTA copy ("Please Take 30 Seconds to End War and Disease") now
  // lives inside the slider screen itself, so it stays visually paired with
  // the action that fulfills it and disappears cleanly when the user advances
  // to the YES/NO choice screen.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {totalVoices > 0 ? (
        <section className="mb-10">
          <VoteCounterSplit
            className="mx-auto max-w-md"
            liveVotes={data.individualCount}
            linkMemorialToPeople
            memorialVotes={data.memorialVoteCount}
            representedVotes={data.representedHumanCount}
            showMemorialIcon={false}
          />
        </section>
      ) : null}
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
