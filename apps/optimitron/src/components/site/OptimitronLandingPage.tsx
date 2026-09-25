import { CallTodaySection, CONTACT_URL } from "@/components/optimitron-landing/CallTodaySection";
import { ControlLoopSection } from "@/components/optimitron-landing/ControlLoopDiagrams";
import { FeaturedProductsSection } from "@/components/optimitron-landing/FeaturedProducts";
import { IncomeFuturesSection } from "@/components/optimitron-landing/IncomeFutures";
import {
  landingButtonClass,
  landingLinkClass,
} from "@/components/optimitron-landing/LandingSection";
import { ProviderRatedSection } from "@/components/optimitron-landing/ProviderRatedSection";
import { ReplacementSuiteSection } from "@/components/optimitron-landing/ReplacementSuiteSection";
import { StatementSection } from "@/components/optimitron-landing/StatementSection";

const HERO_BODY =
  "Are your governments wasting trillions on excess mass-murder capacity while you and everyone you love are slowly tortured and murdered by horrible diseases? Earth Optimization Services repairs your government and maximizes the health and wealth of your civilization.";

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:items-end lg:gap-12">
      <div>
        <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Your planet may be eligible for optimization
        </p>
        <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          Earth Optimization Services
        </h1>
      </div>
      <div>
        <p className="max-w-xl text-lg leading-8">
          {HERO_BODY} <strong className="font-black">Call today!</strong>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a className={landingButtonClass} href={CONTACT_URL}>
            Call today
          </a>
          <a className={landingLinkClass} href="#thermostat">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * optimitron.com homepage: the pitch, why governments fail (no feedback
 * loop), what that costs, what fixing it is worth to you, the products that
 * close the loop, the incumbents' ratings, the replacement price list, and
 * the thirty-second action.
 */
export function OptimitronLandingPage() {
  return (
    <div className="pb-8">
      <Hero />
      <ControlLoopSection />
      <StatementSection />
      <IncomeFuturesSection />
      <FeaturedProductsSection />
      <ProviderRatedSection />
      <ReplacementSuiteSection />
      <CallTodaySection />
    </div>
  );
}
