import { Suspense } from "react";
import { EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL } from "@optimitron/db/system-identities";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";
import { LandingSection, landingButtonClass } from "./LandingSection";

export const CONTACT_URL = `mailto:${EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL}`;

export function CallTodaySection() {
  return (
    <LandingSection id="vote" title="Call today!">
      <Suspense fallback={null}>
        <TreatyVoteFlow
          authCallbackUrl={ROUTES.dashboard}
          compactInitialScreen
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          respectStoredFlowVariant={false}
          sliderHeadingLevel="h2"
          surface="optimitron_landing"
        />
      </Suspense>
      <div className="mt-10 flex flex-col gap-4 border-t border-foreground/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-base leading-7">
          Earth Optimization Services is a Delaware public benefit corporation.
          If you want the math, want to build a piece of this, or think we
          have it backwards, write to us. A human answers:{" "}
          <span className="font-mono font-bold">
            {EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL}
          </span>
        </p>
        <a className={`${landingButtonClass} shrink-0`} href={CONTACT_URL}>
          Email a human
        </a>
      </div>
    </LandingSection>
  );
}
