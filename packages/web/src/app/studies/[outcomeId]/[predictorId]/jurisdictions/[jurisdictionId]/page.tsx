import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPairSubjectDrilldown,
  getPairSummary,
} from "@/lib/analysis-explorer-data";
import { getJurisdictionRouteParams } from "@/lib/analysis-explorer-routes";

function fmt(value: number | null | undefined, digits: number = 2): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return value.toFixed(digits);
}

export function generateStaticParams() {
  return getJurisdictionRouteParams().map(param => ({
    outcomeId: param.outcomeId,
    predictorId: param.predictorId,
    jurisdictionId: param.jurisdictionId,
  }));
}

export default async function JurisdictionStudyPage({
  params,
}: {
  params: Promise<{ outcomeId: string; predictorId: string; jurisdictionId: string }>;
}) {
  const { outcomeId, predictorId, jurisdictionId } = await params;
  const summary = getPairSummary(outcomeId, predictorId);
  const subject = getPairSubjectDrilldown(outcomeId, predictorId, jurisdictionId);

  if (!summary || !subject) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <Link
          href={`/studies/${encodeURIComponent(outcomeId)}/${encodeURIComponent(predictorId)}/jurisdictions`}
          className="inline-block text-xs font-bold uppercase text-black/50 hover:text-black mb-3"
        >
          ← All Jurisdictions
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">
          {subject.summary.subjectName}
        </h1>
        <p className="text-black/60 font-medium mt-2">
          {summary.predictorLabel} → {summary.outcomeLabel}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border-2 border-black bg-cyan-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase text-black/60">Forward Pearson</div>
          <div className="text-3xl font-black text-black">{fmt(subject.summary.forwardPearson, 3)}</div>
        </div>
        <div className="border-2 border-black bg-yellow-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase text-black/60">Predictive Pearson</div>
          <div className="text-3xl font-black text-black">{fmt(subject.summary.predictivePearson, 3)}</div>
        </div>
        <div className="border-2 border-black bg-pink-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase text-black/60">Outcome % Change</div>
          <div className="text-3xl font-black text-black">{fmt(subject.summary.percentChangeFromBaseline, 2)}%</div>
        </div>
        <div className="border-2 border-black bg-emerald-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black uppercase text-black/60">Aligned Pairs</div>
          <div className="text-3xl font-black text-black">{subject.summary.numberOfPairs}</div>
        </div>
      </section>

      <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-3">N-of-1 Summary</h2>
        <p className="text-sm text-black/70 font-medium mb-2">
          This page represents the single-subject causal summary used as one contribution in the aggregate pair study.
        </p>
        <ul className="text-sm text-black/70 font-medium space-y-1">
          <li>Evidence grade: {subject.summary.evidenceGrade || "N/A"}</li>
          <li>Optimal predictor value: {fmt(subject.summary.optimalPredictorValue, 2)}</li>
          <li>Subject ID: {subject.summary.subjectId}</li>
          <li>Ranking score: {(subject.ranking.score * 100).toFixed(1)}</li>
          <li>Quality gate: {subject.qualityGate.passed ? "Pass" : "Flagged"}</li>
        </ul>
      </section>

      <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-3">Vs Aggregate</h2>
        <ul className="text-sm text-black/70 font-medium space-y-1">
          <li>Direction agreement: {subject.aggregateComparison.directionAgreement}</li>
          <li>
            Predictive Pearson delta: {fmt(subject.aggregateComparison.predictivePearsonDelta, 3)}
          </li>
          <li>Forward Pearson delta: {fmt(subject.aggregateComparison.forwardPearsonDelta, 3)}</li>
          <li>
            Outcome % change delta: {fmt(subject.aggregateComparison.percentChangeFromBaselineDelta, 2)}%
          </li>
        </ul>
      </section>

      {!subject.qualityGate.passed && (
        <section className="border-2 border-black bg-amber-100 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-lg font-black uppercase text-black mb-3">Quality Gate Notes</h2>
          <ul className="text-sm text-black/80 font-medium space-y-1">
            {subject.qualityGate.reasons.map(reason => (
              <li key={reason.code}>
                {reason.code}: {reason.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
