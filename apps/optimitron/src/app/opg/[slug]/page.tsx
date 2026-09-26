import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { usPolicyAnalysis as data } from "@/data/us-policy-analysis";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { getPolicyPath, optimalPolicyGeneratorPaperLink, opgLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { slugify } from "@/lib/slugify";
import { formatPolicyEffect, policyDisplayName, policyEvidenceLabel } from "@/lib/policy-presentation";
import { getPolicyEvidence, type MatchedExperiment, type MatchedComparison } from "@/data/policy-evidence-map";
import { ExperimentTimeSeriesChart } from "@/components/opg/ExperimentTimeSeriesChart";
import { retiredPolicyRedirectPath } from "./legacy-policy-redirect";
import type { CountryDrugPolicy, CountryHealthData, CountryEducationData, CountryCriminalJustice } from "@optimitron/data/datasets/international-comparisons";

export function generateStaticParams() {
  return data.policies.map((policy) => ({ slug: slugify(policy.name) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = data.policies.find((candidate) => slugify(candidate.name) === slug);
  return getRouteMetadata(policy ? {
    ...opgLink,
    label: policyDisplayName(policy),
    href: getPolicyPath(policy.name),
    description: policy.description,
  } : opgLink);
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = data.policies.find((candidate) => slugify(candidate.name) === slug);
  if (!policy) {
    const redirectPath = retiredPolicyRedirectPath(slug, data.policies);
    if (redirectPath) permanentRedirect(redirectPath);
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="text-3xl font-black mb-4">Policy not found</h1>
        <Link href="/opg" className="underline">All policies</Link>
      </div>
    );
  }
  const evidence = getPolicyEvidence(policy.name, policy.category, policy.description);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <NavItemLink item={opgLink} variant="custom" className="inline-block mb-6 font-bold underline">← All policies</NavItemLink>
      <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{policyEvidenceLabel(policy.evidenceKind)}</p>
      <h1 className="text-2xl sm:text-4xl font-black mb-4">{policyDisplayName(policy)}</h1>
      <p className="font-bold mb-8">{policy.description}</p>

      <section className="border-4 border-primary p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-black mb-4">{policy.evidenceKind === "comparison" ? "National comparison" : "Proposed change"}</h2>
        <div className="space-y-4">
          {policy.currentStatus && <Detail label="Current situation" value={policy.currentStatus} />}
          {policy.recommendedTarget && <Detail label={policy.evidenceKind === "comparison" ? "Reference" : "Proposal"} value={policy.recommendedTarget} />}
          <p className="text-sm">{policy.rationale}</p>
        </div>
      </section>

      {policy.evidenceKind !== "comparison" ? (
        <section className="border-4 border-primary p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-black mb-3">{policy.evidenceKind === "assumption" ? "Scenario assumptions" : "Reported effect estimates"}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {policy.evidenceKind === "assumption"
              ? "These percentages are supplied assumptions, not estimated national effects. No time horizon or baseline supports converting them into dollars or years."
              : "Effects retain their reported percentage scale. Converting them into dollars or years requires a specified baseline and time horizon."}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><dt className="font-bold text-sm">Median after-tax income</dt><dd className="text-2xl font-black">{formatPolicyEffect(policy.incomeEffect)}</dd></div>
            <div><dt className="font-bold text-sm">Median healthy life years</dt><dd className="text-2xl font-black">{formatPolicyEffect(policy.healthEffect)}</dd></div>
          </dl>
        </section>
      ) : (
        <p className="text-sm mb-8">
          This spending comparison does not estimate the health or income effect of adopting another country&apos;s policies.
          <Link href="/obg" className="ml-1 underline">Inspect the spending data and comparison years.</Link>
        </p>
      )}

      {evidence.experiments.length > 0 && <NaturalExperimentsSection experiments={evidence.experiments} />}
      {evidence.comparison && <InternationalComparisonSection comparison={evidence.comparison} />}

      <p className="text-sm text-muted-foreground mb-6">
        {policy.evidenceKind !== "estimate" && "A causal evidence grade requires an assessment of the underlying studies and their applicability. This entry has not received that assessment. "}
        Read the{" "}
        <NavItemLink item={optimalPolicyGeneratorPaperLink} variant="custom" external className="underline">policy evaluation methodology</NavItemLink>.
      </p>
      <p className="text-xs text-muted-foreground">Generated: {data.generatedAt.slice(0, 10)}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase text-muted-foreground mb-1">{label}</p><p className="text-sm">{value}</p></div>;
}

function NaturalExperimentsSection({ experiments }: { experiments: MatchedExperiment[] }) {
  return (
    <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
      <h2 className="text-lg font-black uppercase text-foreground mb-4">
        Historical examples
      </h2>
      <p className="text-sm font-bold text-muted-foreground mb-6">
        Before-and-after observations for related interventions. These comparisons do not isolate the policy&apos;s causal effect.
      </p>

      <div className="space-y-8">
        {experiments.map((exp) => (
          <div key={`${exp.computed.jurisdiction}-${exp.computed.policy}`}>
            {/* Experiment header */}
            <div className="border-4 border-primary bg-background text-foreground p-4 mb-4">
              <h3 className="text-sm font-black uppercase">
                {exp.computed.jurisdiction} — {exp.computed.policy}
              </h3>
              <p className="text-xs font-bold mt-1">
                Intervention year: {exp.computed.interventionYear} · {exp.timeSeries.description}
              </p>
            </div>

            {/* Outcome stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {exp.computed.outcomes.map((outcome) => (
                <div
                  key={outcome.metric}
                  className="border-4 border-primary p-3 bg-background"
                >
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    {outcome.metric}
                  </div>
                  <div className={`text-lg font-black ${outcome.percentChange < 0 ? (outcome.direction === "lower" ? "text-brutal-green" : "text-brutal-red") : (outcome.direction === "higher" ? "text-brutal-green" : "text-brutal-red")}`}>
                    {outcome.percentChange > 0 ? "+" : ""}
                    {outcome.percentChange.toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground mt-1">Observed change</div>
                </div>
              ))}
            </div>

            {/* Time-series charts */}
            <ExperimentTimeSeriesChart
              outcomes={exp.timeSeries.outcomes}
              interventionYear={exp.timeSeries.interventionYear}
              jurisdiction={exp.timeSeries.jurisdiction}
            />

            {/* Sources */}
            {exp.timeSeries.sources.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Sources:{" "}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {exp.timeSeries.sources.join(" · ")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  International Comparison Section                                  */
/* ------------------------------------------------------------------ */

function InternationalComparisonSection({ comparison }: { comparison: MatchedComparison }) {
  return (
    <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
      <h2 className="text-lg font-black uppercase text-foreground mb-4">
        🌍 {comparison.label}
      </h2>
      <p className="text-sm font-bold text-muted-foreground mb-4">
        Descriptive country snapshots, generally from 2020–2023 sources; education scores use PISA 2022.
        These are separate from the budget page&apos;s multi-year averages.
        {comparison.type === "health" && " Health spending is current PPP-adjusted dollars per person, not constant 2017 dollars."}
      </p>

      <div className="overflow-x-auto">
        {comparison.type === "drug" && (
          <DrugComparisonTable data={comparison.data as CountryDrugPolicy[]} />
        )}
        {comparison.type === "health" && (
          <HealthComparisonTable data={comparison.data as CountryHealthData[]} />
        )}
        {comparison.type === "education" && (
          <EducationComparisonTable data={comparison.data as CountryEducationData[]} />
        )}
        {comparison.type === "criminal_justice" && (
          <CriminalJusticeComparisonTable data={comparison.data as CountryCriminalJustice[]} />
        )}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-bold">Sources by country</summary>
        <ul className="mt-3 space-y-2">
          {comparison.data.map((country) => (
            <li key={country.iso3}><strong>{country.country}:</strong> {country.source}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function isUS(iso3: string): string {
  return iso3 === "USA"
    ? "bg-background text-foreground font-black"
    : "text-foreground";
}

function DrugComparisonTable({ data }: { data: CountryDrugPolicy[] }) {
  const sorted = [...data].sort((a, b) => a.drugDeathsPer100K - b.drugDeathsPer100K);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-4 border-primary bg-foreground text-background">
          <Th>Country</Th>
          <Th align="left">Approach</Th>
          <Th align="right">Drug Deaths/100K</Th>
          <Th align="right">Incarceration/100K</Th>
          <Th align="right">Treatment Access</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-background text-foreground" : ""}`}>
            <Td className={isUS(c.iso3)}>{c.country}</Td>
            <Td className={isUS(c.iso3)}>{c.approach}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.drugDeathsPer100K.toFixed(1)}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.incarcerationRatePer100K}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.treatmentAccessRate}%</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HealthComparisonTable({ data }: { data: CountryHealthData[] }) {
  const sorted = [...data].sort((a, b) => b.lifeExpectancy - a.lifeExpectancy);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-4 border-primary bg-foreground text-background">
          <Th>Country</Th>
          <Th align="right">$/Capita</Th>
          <Th align="right">Life Exp.</Th>
          <Th align="right">Infant Mort.</Th>
          <Th align="left">System</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-background text-foreground" : ""}`}>
            <Td className={isUS(c.iso3)}>{c.country}</Td>
            <Td align="right" className={isUS(c.iso3)}>${c.healthSpendingPerCapita.toLocaleString()}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.lifeExpectancy.toFixed(1)}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.infantMortality.toFixed(1)}</Td>
            <Td className={isUS(c.iso3)}>{c.systemType}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EducationComparisonTable({ data }: { data: CountryEducationData[] }) {
  const sorted = [...data].sort((a, b) => b.pisaScoreMath - a.pisaScoreMath);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-4 border-primary bg-foreground text-background">
          <Th>Country</Th>
          <Th align="right">Spend % GDP</Th>
          <Th align="right">PISA Math</Th>
          <Th align="right">PISA Reading</Th>
          <Th align="right">PISA Science</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-background text-foreground" : ""}`}>
            <Td className={isUS(c.iso3)}>{c.country}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.educationSpendingPctGDP.toFixed(1)}%</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.pisaScoreMath}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.pisaScoreReading}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.pisaScoreScience}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CriminalJusticeComparisonTable({ data }: { data: CountryCriminalJustice[] }) {
  const sorted = [...data].sort((a, b) => a.homicideRatePer100K - b.homicideRatePer100K);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-4 border-primary bg-foreground text-background">
          <Th>Country</Th>
          <Th align="right">Incarceration/100K</Th>
          <Th align="right">Homicide/100K</Th>
          <Th align="right">Recidivism</Th>
          <Th align="left">Approach</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => (
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-background text-foreground" : ""}`}>
            <Td className={isUS(c.iso3)}>{c.country}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.incarcerationRatePer100K}</Td>
            <Td align="right" className={isUS(c.iso3)}>{c.homicideRatePer100K.toFixed(1)}</Td>
            <Td align="right" className={isUS(c.iso3)}>{(c.recidivismRate * 100).toFixed(0)}%</Td>
            <Td className={isUS(c.iso3)}>{c.approach}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <th className={`py-2 px-3 font-black uppercase text-xs ${alignCls}`}>{children}</th>;
}

function Td({ children, align = "left", className = "" }: { children: React.ReactNode; align?: "left" | "right" | "center"; className?: string }) {
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={`py-2 px-3 font-bold ${alignCls} ${className}`}>{children}</td>;
}
