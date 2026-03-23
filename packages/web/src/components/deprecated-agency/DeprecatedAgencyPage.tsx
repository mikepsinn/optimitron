import { StatCardGrid } from "@/components/ui/stat-card";
import type { DeprecatedAgency } from "@/lib/deprecated-agencies-data";
import { AgencyStampHero } from "./AgencyStampHero";
import { AnnotatedCodeBlock } from "./AnnotatedCodeBlock";
import { SavingsImpact } from "./SavingsImpact";
import { DeprecateCTA } from "./DeprecateCTA";

interface DeprecatedAgencyPageProps {
  agency: DeprecatedAgency;
  /** Optional extra content between stats and code (e.g. the dFED 1971 analysis) */
  children?: React.ReactNode;
}

export function DeprecatedAgencyPage({
  agency,
  children,
}: DeprecatedAgencyPageProps) {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <AgencyStampHero
          agencyName={agency.agencyName}
          dName={agency.dName}
          tagline={agency.tagline}
        />

        {/* What They Cost You */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
            What They Cost You
          </h2>
          <StatCardGrid stats={agency.stats} columns={2} />
        </section>

        {/* Optional extra content (e.g. historical analysis for dFED) */}
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
        />
      </div>

      <DeprecateCTA />
    </div>
  );
}
