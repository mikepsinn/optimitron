import TrialAbundanceSurveySection from "@/components/landing/trial-abundance-survey-section"
import { parseTrialAbundanceVisualState } from "@optimitron/site-kit/lib/trial-abundance-visual"
import { EmbedReadySignal } from "@optimitron/survey-embed";

export const dynamic = "force-dynamic";

type EmbedPageProps = {
  searchParams?: Promise<{
    ref?: string;
    embed?: string;
    visual?: string;
  }>;
};

/**
 * Framed survey surface for partners (iframe / embed.js).
 * Referral: ?ref=CODE
 */
export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const resolved = (await searchParams) ?? {};
  const ref = resolved.ref;
  const visualState = parseTrialAbundanceVisualState(resolved.visual)

  return (
    <div
      className="min-h-screen bg-background p-2 sm:p-4"
      data-embed="1"
      data-ref={ref ?? ""}
    >
      <EmbedReadySignal />
      <TrialAbundanceSurveySection
        disableIntroAnimation={resolved.visual === "1" || Boolean(visualState)}
        visualState={visualState}
      />
      {ref ? <p className="sr-only">Referral code {ref}</p> : null}
    </div>
  );
}
