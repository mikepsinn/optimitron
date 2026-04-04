import { usPolicyAnalysis as policyData } from "@/data/us-policy-analysis";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { optimalPolicyGeneratorPaperLink, opgLink } from "@/lib/routes";
import { slugify } from "@/lib/slugify";
import { getPolicyEvidence, type MatchedExperiment, type MatchedComparison } from "@/data/policy-evidence-map";
import { ExperimentTimeSeriesChart } from "@/components/opg/ExperimentTimeSeriesChart";
import type { CountryDrugPolicy, CountryHealthData, CountryEducationData, CountryCriminalJustice } from "@optimitron/data/datasets/international-comparisons";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface BradfordHillScores {
  strength: number;
  consistency: number;
  temporality: number;
  gradient: number;
  experiment: number;
  plausibility: number;
  coherence: number;
  analogy: number;
  specificity: number;
}

interface Policy {
  name: string;
  type: string;
  category: string;
  description: string;
  recommendationType: string;
  evidenceGrade: string;
  causalConfidenceScore: number;
  policyImpactScore: number;
  welfareScore: number;
  incomeEffect: number;
  healthEffect: number;
  bradfordHillScores: BradfordHillScores;
  rationale: string;
  currentStatus?: string;
  recommendedTarget?: string;
  blockingFactors: string[];
}

interface PolicyDataType {
  jurisdiction: string;
  analysisDate: string;
  policies: Policy[];
  topRecommendations: string[];
  generatedAt: string;
}

const data = policyData as unknown as PolicyDataType;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const BRADFORD_HILL_LABELS: Record<string, string> = {
  strength: "Strength of Association",
  consistency: "Consistency",
  temporality: "Temporality",
  gradient: "Biological Gradient",
  experiment: "Experiment",
  plausibility: "Plausibility",
  coherence: "Coherence",
  analogy: "Analogy",
  specificity: "Specificity",
};

const BRADFORD_HILL_DESCRIPTIONS: Record<string, string> = {
  strength:
    "How large is the association between the policy and the outcome? Larger effect sizes increase confidence in causation.",
  consistency:
    "Has the relationship been observed across different populations, settings, and times? Replication strengthens causal claims.",
  temporality:
    "Does the policy change precede the outcome change? Temporal ordering is a necessary condition for causation.",
  gradient:
    "Is there a dose-response relationship? More of the policy leads to more of the effect? Gradients support causation.",
  experiment:
    "Is there evidence from randomized controlled trials or natural experiments? Experimental evidence is the gold standard.",
  plausibility:
    "Is there a plausible mechanism explaining how the policy causes the outcome? Mechanistic understanding increases confidence.",
  coherence:
    "Does the causal interpretation fit with existing knowledge? The relationship should not contradict established facts.",
  analogy:
    "Are there analogous policies that have produced similar effects? Similar interventions with known effects support the claim.",
  specificity:
    "Is the effect specific to this policy rather than a general phenomenon? Specific associations are more likely causal.",
};

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-brutal-cyan text-brutal-cyan-foreground";
    case "B":
      return "bg-brutal-yellow text-brutal-yellow-foreground";
    case "C":
      return "bg-brutal-yellow text-brutal-yellow-foreground";
    default:
      return "bg-brutal-red text-brutal-red-foreground";
  }
}

function gradeLabel(grade: string): string {
  switch (grade) {
    case "A":
      return "Strong Evidence";
    case "B":
      return "Moderate Evidence";
    case "C":
      return "Limited Evidence";
    default:
      return "Insufficient Evidence";
  }
}

function barColor(val: number): string {
  if (val >= 0.8) return "bg-brutal-cyan text-brutal-cyan-foreground";
  if (val >= 0.5) return "bg-brutal-yellow text-brutal-yellow-foreground";
  return "bg-brutal-red text-brutal-red-foreground";
}

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return data.policies.map((p) => ({
    slug: slugify(p.name),
  }));
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = data.policies.find((p) => slugify(p.name) === slug);

  if (!policy) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground mb-4">Policy Not Found</h1>
        <NavItemLink item={opgLink} variant="custom" className="text-brutal-pink font-bold underline">
          ← Back to Policy Rankings
        </NavItemLink>
      </div>
    );
  }

  const bhEntries = Object.entries(policy.bradfordHillScores) as [string, number][];
  const bhSorted = [...bhEntries].sort(([, a], [, b]) => b - a);
  const avgBH = bhEntries.reduce((s, [, v]) => s + v, 0) / bhEntries.length;

  // Find rank
  const sorted = [...data.policies].sort((a, b) => b.policyImpactScore - a.policyImpactScore);
  const rank = sorted.findIndex((p) => p.name === policy.name) + 1;

  // Match supporting evidence
  const evidence = getPolicyEvidence(policy.name, policy.category, policy.description);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <NavItemLink
        item={opgLink}
        variant="custom"
        className="inline-block mb-6 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase"
      >
        ← All Policies
      </NavItemLink>

      {/* Hero */}
      <div className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
            {policy.name}
          </h1>
          <span
            className={`inline-block border-4 border-primary px-3 py-1 text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${gradeColor(
              policy.evidenceGrade
            )}`}
          >
            Grade {policy.evidenceGrade} — {gradeLabel(policy.evidenceGrade)}
          </span>
        </div>
        <p className="text-muted-foreground font-bold mb-2">{policy.description}</p>
        <p className="text-xs font-bold text-muted-foreground">
          Rank #{rank} of {data.policies.length} policies
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="border-4 border-primary p-4 bg-brutal-pink text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase opacity-80 mb-1">Welfare Score</div>
            <div className="text-2xl sm:text-3xl font-black">+{policy.welfareScore}</div>
          </div>
          <div className="border-4 border-primary p-4 bg-brutal-cyan text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase mb-1">Causal Confidence</div>
            <div className="text-2xl sm:text-3xl font-black">
              {(policy.causalConfidenceScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="border-4 border-primary p-4 bg-brutal-yellow text-brutal-yellow-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase mb-1">Policy Impact</div>
            <div className="text-2xl sm:text-3xl font-black">
              {(policy.policyImpactScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="border-4 border-primary p-4 bg-brutal-cyan text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase mb-1">BH Average</div>
            <div className="text-2xl sm:text-3xl font-black">
              {(avgBH * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Bradford Hill Scores */}
      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">
          📊 Bradford Hill Criteria Scores
        </h2>
        <div className="space-y-3">
          {bhSorted.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-foreground">{BRADFORD_HILL_LABELS[key] || key}</span>
                <span className="text-sm font-black text-foreground">
                  {(val * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-6 bg-muted border-4 border-primary overflow-hidden">
                <div
                  className={`h-full ${barColor(val)}`}
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Breakdown */}
      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">💥 Impact Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-4 border-primary p-4 bg-brutal-cyan text-brutal-cyan-foreground">
            <div className="text-xs font-bold uppercase mb-1">Income Effect</div>
            <div className="text-3xl font-black">
              +{(policy.incomeEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-3 bg-muted border border-primary overflow-hidden">
              <div
                className="h-full bg-brutal-cyan"
                style={{ width: `${policy.incomeEffect * 100}%` }}
              />
            </div>
          </div>
          <div className="border-4 border-primary p-4 bg-brutal-pink text-brutal-pink-foreground">
            <div className="text-xs font-bold uppercase mb-1">Health Effect</div>
            <div className="text-3xl font-black text-brutal-pink-foreground">
              +{(policy.healthEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-3 bg-muted border border-primary overflow-hidden">
              <div
                className="h-full bg-brutal-pink"
                style={{ width: `${policy.healthEffect * 100}%` }}
              />
            </div>
          </div>
          <div className="border-4 border-primary p-4 bg-brutal-cyan text-brutal-cyan-foreground">
            <div className="text-xs font-bold uppercase mb-1">
              Combined Welfare
            </div>
            <div className="text-3xl font-black">+{policy.welfareScore}</div>
            <div className="mt-2 h-3 bg-muted border border-primary overflow-hidden">
              <div
                className="h-full bg-brutal-cyan"
                style={{ width: `${Math.min(policy.welfareScore, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Natural Experiments */}
      {evidence.experiments.length > 0 && (
        <NaturalExperimentsSection experiments={evidence.experiments} />
      )}

      {/* International Comparison */}
      {evidence.comparison && (
        <InternationalComparisonSection comparison={evidence.comparison} />
      )}

      {/* Details */}
      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">📋 Policy Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm">
            <Detail label="Type" value={policy.type.replace(/_/g, " ")} />
            <Detail label="Category" value={policy.category.replace(/_/g, " ")} />
            <Detail label="Recommendation" value={policy.recommendationType} />
            {policy.currentStatus && (
              <Detail label="Current Status" value={policy.currentStatus} />
            )}
            {policy.recommendedTarget && (
              <Detail label="Recommended Target" value={policy.recommendedTarget} />
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-muted-foreground mb-2">Rationale</div>
            <p className="text-sm text-foreground font-bold border-l-4 border-brutal-pink pl-3">
              {policy.rationale}
            </p>

            {policy.blockingFactors.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  Blocking Factors
                </div>
                <div className="flex flex-wrap gap-2">
                  {policy.blockingFactors.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-brutal-red text-brutal-red-foreground px-2 py-1 border-4 border-primary font-bold"
                    >
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Evidence Assessment (Bradford Hill explanation) */}
      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">
          🔬 Evidence Assessment: Bradford Hill Criteria
        </h2>
        <p className="text-sm text-foreground font-bold mb-4">
          The{" "}
          <strong className="text-foreground">Bradford Hill criteria</strong>{" "}
          are nine principles used to establish evidence of a causal relationship between a
          policy intervention and its outcomes. Originally developed for epidemiology (1965),
          they provide a structured framework for evaluating whether an observed association
          is truly causal. Each criterion is scored from 0 to 1.
        </p>

        <div className="space-y-3">
          {bhEntries.map(([key, val]) => (
            <div
              key={key}
              className="border-4 border-primary p-3 bg-background"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-foreground uppercase">
                  {BRADFORD_HILL_LABELS[key] || key}
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${barColor(val)}`}
                >
                  {(val * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-bold">
                {BRADFORD_HILL_DESCRIPTIONS[key]}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4">
          <h3 className="text-sm font-black uppercase mb-2">
            How is the Causal Confidence Score calculated?
          </h3>
          <p className="text-sm font-bold">
            The <strong>Causal Confidence Score (CCS)</strong> of{" "}
            <strong>
              {(policy.causalConfidenceScore * 100).toFixed(0)}%
            </strong>{" "}
            is a weighted average of the nine Bradford Hill criteria. Experiment and temporality
            receive higher weights since they provide the strongest evidence for causation. The
            CCS is then combined with the estimated effect magnitude to produce the Policy
            Impact Score (PIS) of{" "}
            <strong>
              {(policy.policyImpactScore * 100).toFixed(0)}%
            </strong>.
          </p>
          <p className="text-xs opacity-80 mt-2">
            See the{" "}
            <NavItemLink
              item={optimalPolicyGeneratorPaperLink}
              variant="custom"
              external
              className="text-brutal-pink hover:underline"
            >
              Optimal Policy Generator paper
            </NavItemLink>{" "}
            for full methodology.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <NavItemLink
          item={opgLink}
          variant="custom"
          className="inline-block border-4 border-primary bg-foreground text-background px-4 py-2 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-shadow"
        >
          ← All Policies
        </NavItemLink>
        <p className="text-xs text-muted-foreground font-bold">
          Analysis: {data.analysisDate} · Optimitron OPG
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>
      <div className="text-sm font-bold text-foreground capitalize">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Natural Experiments Section                                       */
/* ------------------------------------------------------------------ */

function NaturalExperimentsSection({ experiments }: { experiments: MatchedExperiment[] }) {
  return (
    <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
      <h2 className="text-lg font-black uppercase text-foreground mb-4">
        🧪 Natural Experiments
      </h2>
      <p className="text-sm font-bold text-muted-foreground mb-6">
        Real-world before/after data from jurisdictions that implemented this policy.
      </p>

      <div className="space-y-8">
        {experiments.map((exp) => (
          <div key={`${exp.computed.jurisdiction}-${exp.computed.policy}`}>
            {/* Experiment header */}
            <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4 mb-4">
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
                  <div className="text-[10px] font-bold text-muted-foreground mt-1">
                    p={outcome.pValue < 0.001 ? "<0.001" : outcome.pValue.toFixed(3)}
                  </div>
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
        How countries compare on this policy domain. The US row is highlighted.
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
    </section>
  );
}

function isUS(iso3: string): string {
  return iso3 === "USA"
    ? "bg-brutal-yellow text-brutal-yellow-foreground font-black"
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
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-brutal-yellow text-brutal-yellow-foreground" : ""}`}>
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
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-brutal-yellow text-brutal-yellow-foreground" : ""}`}>
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
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-brutal-yellow text-brutal-yellow-foreground" : ""}`}>
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
          <tr key={c.iso3} className={`border-b-2 border-primary ${c.iso3 === "USA" ? "bg-brutal-yellow text-brutal-yellow-foreground" : ""}`}>
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
