import type { Metadata } from "next";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export const metadata: Metadata = {
  title: "Trial Abundance Survey",
  description:
    "A two-question survey about whether governments should fund more pragmatic clinical trials.",
};

export default function SurveyPage() {
  return (
    <main className="min-h-screen bg-[var(--treaty-paper)]">
      <section className="mx-auto max-w-3xl px-4 pb-2 pt-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
          Trial Abundance Survey
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-[var(--treaty-ink)] sm:text-5xl">
          Trial Abundance Survey
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-[var(--treaty-ink-soft)]">
          Two questions about government funding for pragmatic clinical trials.
        </p>
      </section>
      <TreatyVoteFlow
        authCallbackUrl={ROUTES.dashboard}
        copyMode="neutral"
        defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
        postVoteCompletion="message"
        respectStoredFlowVariant={false}
        surface="neutral_survey"
      />
    </main>
  );
}
