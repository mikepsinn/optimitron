import Link from "next/link";
import policyData from "@/data/us-policy-analysis.json";

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

const data = policyData as PolicyDataType;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const BRADFORD_HILL_CRITERIA: Record<string, string> = {
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
      return "bg-emerald-400 text-black";
    case "B":
      return "bg-yellow-300 text-black";
    case "C":
      return "bg-orange-400 text-black";
    default:
      return "bg-red-400 text-black";
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
        <h1 className="text-3xl font-black uppercase text-black mb-4">Policy Not Found</h1>
        <Link href="/policies" className="text-pink-500 font-bold underline">
          ← Back to Policy Rankings
        </Link>
      </div>
    );
  }

  const bhEntries = Object.entries(policy.bradfordHillScores) as [string, number][];
  const avgBH = bhEntries.reduce((s, [, v]) => s + v, 0) / bhEntries.length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/policies"
        className="inline-block mb-6 text-sm font-bold text-black/50 hover:text-black transition-colors"
      >
        ← Back to Policy Rankings
      </Link>

      {/* Hero */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
            {policy.name}
          </h1>
          <span
            className={`inline-block border-2 border-black px-3 py-1 text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${gradeColor(
              policy.evidenceGrade
            )}`}
          >
            Grade {policy.evidenceGrade} — {gradeLabel(policy.evidenceGrade)}
          </span>
        </div>
        <p className="text-black/60 font-medium mb-6">{policy.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-2 border-black p-4 bg-pink-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase opacity-80 mb-1">Welfare Score</div>
            <div className="text-2xl sm:text-3xl font-black">+{policy.welfareScore}</div>
          </div>
          <div className="border-2 border-black p-4 bg-cyan-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Causal Confidence</div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {(policy.causalConfidenceScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="border-2 border-black p-4 bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Policy Impact</div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {(policy.policyImpactScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="border-2 border-black p-4 bg-emerald-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">BH Average</div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {(avgBH * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Bradford Hill Scores */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">
          📊 Bradford Hill Criteria Scores
        </h2>
        <div className="space-y-3">
          {bhEntries.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-black capitalize">{key}</span>
                <span className="text-sm font-black text-black">
                  {(val * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-6 bg-gray-100 border-2 border-black overflow-hidden">
                <div
                  className={`h-full ${
                    val >= 0.8
                      ? "bg-emerald-400"
                      : val >= 0.5
                        ? "bg-yellow-300"
                        : "bg-red-300"
                  }`}
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Breakdown */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">💥 Impact Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-2 border-black p-4 bg-emerald-100">
            <div className="text-xs font-bold uppercase text-black/50 mb-1">Income Effect</div>
            <div className="text-3xl font-black text-emerald-700">
              +{(policy.incomeEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-3 bg-gray-100 border border-black overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${policy.incomeEffect * 100}%` }}
              />
            </div>
          </div>
          <div className="border-2 border-black p-4 bg-pink-100">
            <div className="text-xs font-bold uppercase text-black/50 mb-1">Health Effect</div>
            <div className="text-3xl font-black text-pink-700">
              +{(policy.healthEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-2 h-3 bg-gray-100 border border-black overflow-hidden">
              <div
                className="h-full bg-pink-500"
                style={{ width: `${policy.healthEffect * 100}%` }}
              />
            </div>
          </div>
          <div className="border-2 border-black p-4 bg-cyan-100">
            <div className="text-xs font-bold uppercase text-black/50 mb-1">
              Combined Welfare
            </div>
            <div className="text-3xl font-black text-cyan-700">+{policy.welfareScore}</div>
            <div className="mt-2 h-3 bg-gray-100 border border-black overflow-hidden">
              <div
                className="h-full bg-cyan-500"
                style={{ width: `${Math.min(policy.welfareScore, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">📋 Policy Details</h2>
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
            <div className="text-xs font-bold uppercase text-black/50 mb-2">Rationale</div>
            <p className="text-sm text-black/70 font-medium border-l-4 border-pink-500 pl-3">
              {policy.rationale}
            </p>

            {policy.blockingFactors.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase text-black/50 mb-2">
                  Blocking Factors
                </div>
                <div className="flex flex-wrap gap-2">
                  {policy.blockingFactors.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-red-200 text-red-800 px-2 py-1 border-2 border-red-800 font-bold"
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
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">
          🔬 Evidence Assessment: Bradford Hill Criteria
        </h2>
        <p className="text-sm text-black/70 font-medium mb-4">
          The{" "}
          <strong className="text-black">
            Bradford Hill criteria
          </strong>{" "}
          are nine principles used to establish evidence of a causal relationship between a
          policy intervention and its outcomes. Originally developed for epidemiology, they
          provide a structured framework for evaluating whether an observed association is truly
          causal. Each criterion is scored from 0 to 1.
        </p>

        <div className="space-y-3">
          {bhEntries.map(([key, val]) => (
            <div
              key={key}
              className="border-2 border-black p-3 bg-white"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-black uppercase">{key}</span>
                <span
                  className={`text-xs font-black px-2 py-0.5 border-2 border-black ${
                    val >= 0.8
                      ? "bg-emerald-300"
                      : val >= 0.5
                        ? "bg-yellow-300"
                        : "bg-red-300"
                  }`}
                >
                  {(val * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-black/60 font-medium">
                {BRADFORD_HILL_CRITERIA[key]}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-2 border-black bg-yellow-50 p-4">
          <h3 className="text-sm font-black text-black uppercase mb-2">
            How is the Causal Confidence Score calculated?
          </h3>
          <p className="text-sm text-black/70 font-medium">
            The <strong className="text-black">Causal Confidence Score (CCS)</strong> of{" "}
            <strong className="text-black">
              {(policy.causalConfidenceScore * 100).toFixed(0)}%
            </strong>{" "}
            is a weighted average of the nine Bradford Hill criteria. Experiment and temporality
            receive higher weights since they provide the strongest evidence for causation. The
            CCS is then combined with the estimated effect magnitude to produce the Policy
            Impact Score (PIS) of{" "}
            <strong className="text-black">
              {(policy.policyImpactScore * 100).toFixed(0)}%
            </strong>
            .
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Link
          href="/policies"
          className="inline-block border-2 border-black bg-black text-white px-4 py-2 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none transition-shadow"
        >
          ← All Policies
        </Link>
        <p className="text-xs text-black/40 font-bold">
          Analysis: {data.analysisDate} · Optomitron OPG
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-bold uppercase text-black/40">{label}</span>
      <div className="text-sm font-bold text-black capitalize">{value}</div>
    </div>
  );
}
