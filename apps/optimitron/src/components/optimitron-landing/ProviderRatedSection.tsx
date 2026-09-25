import Link from "next/link";
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { ROUTES } from "@/lib/routes";
import { LandingSection, landingLinkClass } from "./LandingSection";

export function ProviderRatedSection() {
  return (
    <LandingSection
      id="rated"
      note="Every government, graded on what it delivered"
      title="Your current provider, rated"
    >
      <GovernmentLeaderboard compact limit={10} />
      <div className="mt-6">
        <Link className={landingLinkClass} href={ROUTES.governments}>
          See every report card
        </Link>
      </div>

      <h3 className="mt-12 font-mono text-sm font-bold uppercase tracking-[0.12em]">
        Reviews from the competition
      </h3>
      <div className="mt-4 grid gap-8 border-t border-foreground/15 pt-6 md:grid-cols-2">
        <figure>
          <blockquote className="text-xl font-bold leading-snug sm:text-2xl">
            “One star. They started checking which medicines work.”
          </blockquote>
          <figcaption className="mt-3 font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
            Cancer
          </figcaption>
        </figure>
        <figure>
          <blockquote className="text-xl font-bold leading-snug sm:text-2xl">
            “They outspent their own cures{" "}
            <ParameterValue
              display="integer"
              param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
            />{" "}
            to 1. We assumed it was a tribute.”
          </blockquote>
          <figcaption className="mt-3 font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
            The Diseases
          </figcaption>
        </figure>
      </div>
    </LandingSection>
  );
}
