import { StatCardGrid } from "@/components/ui/stat-card";
import type { WishoniaAgency } from "@optimitron/data";
import { AgencyStampHero } from "./AgencyStampHero";
import { AnnotatedCodeBlock } from "./AnnotatedCodeBlock";
import { EarthAgencyReportCard } from "./EarthAgencyReportCard";
import { EarthAgencyPerformanceSection } from "./EarthAgencyPerformanceSection";
import { MetricsComparison } from "./MetricsComparison";
import { resolveEarthAgencies } from "./resolveEarthAgencies";
import { SavingsImpact } from "./SavingsImpact";
import { WishoniaCTA } from "./WishoniaCTA";

interface WishoniaAgencyPageProps {
  agency: WishoniaAgency;
  /** Optional extra content between stats and code (e.g. the dIH pragmatic trials analysis) */
  children?: React.ReactNode;
}

export function WishoniaAgencyPage({
  agency,
  children,
}: WishoniaAgencyPageProps) {
  const earthAgencies = resolveEarthAgencies(agency);

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <AgencyStampHero
          agencyName={agency.replacesAgencyName}
          dName={agency.dName}
          tagline={agency.tagline}
          cardColor={agency.cardColor}
        />

        {/* Report Card — grade badge + rationale from Earth agency data */}
        <EarthAgencyReportCard
          earthAgencies={earthAgencies}
          accentColor={agency.cardColor}
        />

        {/* Misaligned vs Aligned metrics comparison */}
        <MetricsComparison
          deprecatedMetrics={agency.deprecatedMetrics}
          optimalMetrics={agency.optimalMetrics}
          accentColor={agency.cardColor}
        />

        {/* Spending vs Outcomes charts from Earth agency performance data */}
        <EarthAgencyPerformanceSection earthAgencies={earthAgencies} />

        {/* What They Cost You */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
            What They Cost You
          </h2>
          <StatCardGrid stats={agency.stats} columns={2} />
        </section>

        {/* Optional extra content (e.g. historical analysis for dFED, pragmatic trials for dIH) */}
        {children}

        <AnnotatedCodeBlock
          header={agency.codeHeader}
          code={agency.replacementCode}
          language={agency.codeLanguage}
          explanation={agency.codeExplanation}
        />

        <SavingsImpact
          annualSavings={agency.annualSavings}
          savingsComparison={agency.savingsComparison}
          wishoniaQuote={agency.wishoniaQuote}
          accentColor={agency.cardColor}
        />
      </div>

      <WishoniaCTA />
    </div>
  );
}
