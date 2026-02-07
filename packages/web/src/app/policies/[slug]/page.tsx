import Link from "next/link";
import policyData from "@/data/us-policy-analysis.json";
import { slugify } from "@/lib/slugify";

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
  rationale?: string;
  currentStatus?: string;
  recommendedTarget?: string;
  blockingFactors?: string[];
}

interface PolicyData {
  jurisdiction: string;
  policies: Policy[];
  generatedAt: string;
}

const data = policyData as PolicyData;

export function generateStaticParams() {
  return data.policies.map((p) => ({ slug: slugify(p.name) }));
}

function gradeColor(grade: string): string {
  if (grade === "A") return "bg-emerald-400 text-black border-black";
  if (grade === "B") return "bg-yellow-300 text-black border-black";
  return "bg-orange-300 text-black border-black";
}

function gradeLabel(grade: string): string {
  if (grade === "A") return "Strong Evidence";
  if (grade === "B") return "Moderate Evidence";
  return "Limited Evidence";
}

const bhLabels: Record<string, string> = {
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

const bhDescriptions: Record<string, string> = {
  strength: "How strong is the statistical association between the policy and outcome?",
  consistency: "Has this effect been observed across different populations and settings?",
  temporality: "Does the policy change precede the outcome change? (Always 1.0 for policies)",
  gradient: "Does more of the policy produce more of the outcome (dose-response)?",
  experiment: "Is there experimental or quasi-experimental evidence?",
  plausibility: "Is there a plausible mechanism explaining how this policy causes the outcome?",
  coherence: "Does the association fit with existing knowledge?",
  analogy: "Are there analogous policies with similar effects?",
  specificity: "Is the effect specific to this policy, or could many factors explain it?",
};

function barColor(val: number): string {
  if (val >= 0.8) return "bg-emerald-500";
  if (val >= 0.6) return "bg-yellow-400";
  if (val >= 0.4) return "bg-orange-400";
  return "bg-red-400";
}

export default function PolicyDetailPage({ params }: { params: { slug: string } }) {
  const pol = data.policies.find((p) => slugify(p.name) === params.slug);

  if (!pol) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-black mb-4">Policy Not Found</h1>
        <Link href="/policies" className="text-pink-500 font-bold hover:underline">← Back to Policies</Link>
      </div>
    );
  }

  const bhEntries = Object.entries(pol.bradfordHillScores).sort(([, a], [, b]) => b - a);
  const avgBH = bhEntries.reduce((s, [, v]) => s + v, 0) / bhEntries.length;

  // Find rank
  const sorted = [...data.policies].sort((a, b) => b.policyImpactScore - a.policyImpactScore);
  const rank = sorted.findIndex((p) => p.name === pol.name) + 1;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/policies" className="text-sm font-bold text-black/50 hover:text-pink-500 transition-colors mb-6 inline-block uppercase">
        ← All Policies
      </Link>

      {/* Hero */}
      <div className="bg-white border-4 border-black p-8 mb-8" style={{ boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}>
        <div className="flex flex-wrap items-start gap-4 mb-4">
          <span className={`text-sm font-black px-3 py-1 border-2 ${gradeColor(pol.evidenceGrade)}`}>
            Grade {pol.evidenceGrade} — {gradeLabel(pol.evidenceGrade)}
          </span>
          <span className="text-sm font-bold text-black/50">
            Rank #{rank} of {data.policies.length}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-3">{pol.name}</h1>
        <p className="text-black/70 font-medium">{pol.description}</p>

        <div className="flex flex-wrap gap-6 mt-6">
          <div>
            <div className="text-xs font-black uppercase text-black/50">Causal Confidence</div>
            <div className="text-3xl font-black text-black">{(pol.causalConfidenceScore * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-black/50">Policy Impact</div>
            <div className="text-3xl font-black text-pink-500">{(pol.policyImpactScore * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-black/50">Welfare Score</div>
            <div className="text-3xl font-black text-cyan-600">{pol.welfareScore}</div>
          </div>
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border-2 border-black p-6" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
          <h3 className="text-sm font-black uppercase text-black/50 mb-1">💰 Income Effect</h3>
          <div className="text-4xl font-black text-black">{pol.incomeEffect > 0 ? "+" : ""}{(pol.incomeEffect * 100).toFixed(0)}%</div>
          <p className="text-xs text-black/50 mt-1">Expected change in economic outcomes</p>
        </div>
        <div className="bg-white border-2 border-black p-6" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
          <h3 className="text-sm font-black uppercase text-black/50 mb-1">❤️ Health Effect</h3>
          <div className="text-4xl font-black text-black">{pol.healthEffect > 0 ? "+" : ""}{(pol.healthEffect * 100).toFixed(0)}%</div>
          <p className="text-xs text-black/50 mt-1">Expected change in health outcomes</p>
        </div>
      </div>

      {/* Rationale */}
      {pol.rationale && (
        <div className="bg-yellow-50 border-2 border-black p-6 mb-8" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
          <h2 className="text-lg font-black uppercase text-black mb-2">💡 Rationale</h2>
          <p className="text-black/80 font-medium">{pol.rationale}</p>
          {pol.currentStatus && (
            <div className="mt-3 text-sm">
              <span className="font-black text-black/50">Current: </span>
              <span className="text-black/70">{pol.currentStatus}</span>
            </div>
          )}
          {pol.recommendedTarget && (
            <div className="text-sm">
              <span className="font-black text-black/50">Target: </span>
              <span className="text-pink-600 font-bold">{pol.recommendedTarget}</span>
            </div>
          )}
        </div>
      )}

      {/* Bradford Hill Scores */}
      <div className="bg-white border-2 border-black p-6 mb-8" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black uppercase text-black">🔬 Bradford Hill Criteria</h2>
          <span className="text-sm font-black text-black/50">Avg: {(avgBH * 100).toFixed(0)}%</span>
        </div>
        <div className="space-y-4">
          {bhEntries.map(([key, val]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-black">{bhLabels[key] || key}</span>
                <span className="text-sm font-black text-black">{(val * 100).toFixed(0)}%</span>
              </div>
              <div className="h-6 bg-gray-100 border-2 border-black relative">
                <div className={`h-full ${barColor(val)}`} style={{ width: `${val * 100}%` }} />
              </div>
              <p className="text-xs text-black/40 mt-0.5">{bhDescriptions[key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Blocking Factors */}
      {pol.blockingFactors && pol.blockingFactors.length > 0 && (
        <div className="bg-red-50 border-2 border-black p-6 mb-8" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
          <h2 className="text-lg font-black uppercase text-black mb-3">⚠️ Blocking Factors</h2>
          <div className="flex flex-wrap gap-2">
            {pol.blockingFactors.map((f) => (
              <span key={f} className="text-sm font-bold px-3 py-1 bg-red-200 border-2 border-black text-black">
                {f.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="bg-white border-2 border-black p-6" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
        <h2 className="text-lg font-black uppercase text-black mb-3">📐 About Bradford Hill Criteria</h2>
        <div className="space-y-3 text-sm text-black/80 font-medium">
          <p>
            The <strong>Bradford Hill criteria</strong> are nine principles for establishing causal relationships between a
            policy intervention and an observed outcome. Originally developed for epidemiology (1965), they provide a
            rigorous framework for evaluating whether a correlation represents true causation.
          </p>
          <p>
            Each criterion is scored 0-1 based on available evidence. A high average score ({">"} 0.7) indicates strong
            causal evidence. The <strong>Causal Confidence Score</strong> is a weighted combination of all nine criteria,
            with temporality and experiment weighted higher.
          </p>
          <p className="text-xs text-black/50">
            See the <a href="https://opg.warondisease.org" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">Optimal Policy Generator paper</a> for full methodology.
          </p>
        </div>
      </div>
    </div>
  );
}
