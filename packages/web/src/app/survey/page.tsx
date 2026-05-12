import type { Metadata } from "next";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata: Metadata = {
  title: GLOBAL_SURVEY_NAME,
  description:
    "A two-question survey about ending war and disease by funding pragmatic clinical trials.",
};

export default function SurveyPage() {
  return (
    <main className="min-h-screen bg-[var(--treaty-paper)]">
      <section className="mx-auto max-w-3xl px-4 pb-2 pt-8 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--treaty-ink)] sm:text-5xl">
          {GLOBAL_SURVEY_NAME}
        </h1>
      </section>
      <TreatyVoteFlow
        authCallbackUrl={ROUTES.dashboard}
        defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
        postVoteCompletion="message"
        respectStoredFlowVariant={false}
        surface="neutral_survey"
      />
    </main>
  );
}
