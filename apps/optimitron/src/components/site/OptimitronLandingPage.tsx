import Link from "next/link";
import { EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL } from "@optimitron/db/system-identities";
import { GLOBAL_GOVERNMENT_EXPENSE_ANNUAL } from "@optimitron/data/parameters";
import { ComparativeEffectivenessSection } from "@/components/dfda/ComparativeEffectivenessSection";
import { OutcomeLabelsSection } from "@/components/dfda/OutcomeLabelsSection";
import { EarthOptimizationTaskSystemSection } from "@/components/landing/EarthOptimizationTaskSystemSection";
import { GovernmentReportCardPreview } from "@/components/landing/GovernmentReportCardPreview";
import { HeroSection } from "@/components/landing/HeroSection";
import { LovingTakeoverSection } from "@/components/landing/LovingTakeoverSection";
import { OptimalPolicyPreview } from "@/components/landing/OptimalPolicyPreview";
import { OptimizedGovernanceSection } from "@/components/landing/OptimizedGovernanceSection";
import { PleaseSelectAnEarthSection } from "@/components/landing/PleaseSelectAnEarthSection";
import { TheBillSection } from "@/components/landing/TheBillSection";
import {
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { WishocracyPreview } from "@/components/landing/WishocracyPreview";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { ROUTES } from "@/lib/routes";

const CONTACT_URL = `mailto:${EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL}`;
const PITCH_URL =
  "https://manual.warondisease.org/knowledge/economics/eos-pitch.html";

const HERO_BODY =
  "Are your governments wasting trillions on excess mass-murder capacity while you and everyone you love are slowly tortured and murdered by horrible diseases? Earth Optimization Services repairs your government and maximizes the health and wealth of your civilization. Call today!";

/** The offer, stated before the demonstrations start. */
function NowOfferingSection() {
  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
      <Container className="max-w-3xl">
        <SectionHeader
          size="lg"
          title="Your planet may be eligible for optimization"
        />
        <div className="space-y-5 text-lg font-bold leading-8">
          <p>
            You spend{" "}
            <ParameterValue
              figures={3}
              param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
            />{" "}
            on governments to promote the general welfare. Public policy is
            currently based on vibes and bribery.
          </p>
          <p>
            We&apos;re Earth Optimization Services. We buy controlling shares of
            the companies that control your government, and we use the
            scientific method and real evidence to calculate optimal public
            policies and budgets that maximize the general welfare.
          </p>
        </div>
        <div className="mt-8 space-y-3">
          <p className="border-2 border-foreground px-4 py-3 text-sm font-black uppercase tracking-[0.12em] sm:text-base">
            Maximize median health-adjusted life expectancy
          </p>
          <p className="border-2 border-foreground px-4 py-3 text-sm font-black uppercase tracking-[0.12em] sm:text-base">
            Maximize median after-tax, inflation-adjusted income, for you, the
            citizen
          </p>
        </div>
      </Container>
    </SectionContainer>
  );
}

function ContactSection({
  body,
  heading,
  showPitchLink = false,
}: {
  body?: string;
  heading: string;
  showPitchLink?: boolean;
}) {
  return (
    <SectionContainer bgColor="background" borderPosition="top" padding="lg">
      <Container className="max-w-2xl text-center">
        <h2 className="text-4xl font-black uppercase leading-none sm:text-5xl">
          {heading}
        </h2>
        {body ? (
          <p className="mx-auto mt-6 text-lg font-bold leading-8">{body}</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            className={`${treatyPrimaryButtonClass} inline-flex items-center justify-center`}
            href={CONTACT_URL}
          >
            Email a human
          </a>
          {showPitchLink ? (
            <a
              className={`${treatySecondaryButtonClass} inline-flex items-center justify-center`}
              href={PITCH_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read the math
            </a>
          ) : (
            <Link
              className={`${treatySecondaryButtonClass} inline-flex items-center justify-center`}
              href={ROUTES.tasks}
            >
              Claim a task
            </Link>
          )}
        </div>
      </Container>
    </SectionContainer>
  );
}

/**
 * optimitron.com homepage.
 *
 * Composed from the same section components the game page uses, in a different
 * order: the offer comes before the demonstrations, the charge sheet before the
 * product tour, and the page closes on contact rather than a countdown. `/game`
 * renders its own ordering from the same parts, so neither page constrains the
 * other.
 */
export function OptimitronLandingPage() {
  return (
    <div>
      <HeroSection
        actions={[
          {
            external: true,
            href: CONTACT_URL,
            label: "Talk to us",
            variant: "primary",
          },
          { href: "#the-machine", label: "See how it works" },
        ]}
        body={HERO_BODY}
        headlineLines={["Earth Optimization", "Services"]}
      />

      {/* The bill comes first, so the point of the page is unmissable. */}
      <TheBillSection />

      {/* Then the offer, then who has been sending the bill. */}
      <NowOfferingSection />
      <GovernmentReportCardPreview
        subtitle="Every government on Earth, graded on what it actually delivered. Yours is in here."
        title="Your Current Provider, Rated"
      />

      {/* The machine itself. */}
      <div id="the-machine">
        <EarthOptimizationTaskSystemSection />
        <OptimalPolicyPreview subtitle="Every policy gets a grade for what it did to how long people live and how much they keep." />
        <WishocracyPreview />
        <OutcomeLabelsSection />
        <ComparativeEffectivenessSection />
        <OptimizedGovernanceSection subtitle="Every public service, rebuilt so each dollar buys as much health and income as it can." />
      </div>

      {/* How a recommendation turns into actual power. */}
      <LovingTakeoverSection />

      <ContactSection heading="Talk To A Human" />

      {/* Timeline and the futures it leads to belong together, then the
          thirty-second action that moves between them. */}
      <WhyPlaySection
        punchline="All of it is fixable."
        showCta={false}
        title="What Happens If Nobody Calls"
      />
      <PleaseSelectAnEarthSection />
      <TreatyVoteSection />

      <ContactSection
        body="Earth Optimization Services is a Delaware public benefit corporation. If you want the math, want to build a piece of this, or want to tell us we have it backwards, write to us. A human answers."
        heading="Call Today!"
        showPitchLink
      />
    </div>
  );
}
