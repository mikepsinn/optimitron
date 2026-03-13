import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPairSummary,
  listPairSubjectDrilldowns,
} from "@/lib/analysis-explorer-data";
import {
  getJurisdictionStudyPath,
  getPairRouteParams,
  getPairStudyPath,
} from "@/lib/analysis-explorer-routes";

function fmt(value: number | null | undefined, digits: number = 2): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return value.toFixed(digits);
}

export function generateStaticParams() {
  return getPairRouteParams();
}

export default async function JurisdictionListPage({
  params,
}: {
  params: Promise<{ outcomeId: string; predictorId: string }>;
}) {
  const { outcomeId, predictorId } = await params;
  const summary = getPairSummary(outcomeId, predictorId);
  const subjects = listPairSubjectDrilldowns(outcomeId, predictorId);

  if (!summary) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <Link
          href={getPairStudyPath(outcomeId, predictorId)}
          className="inline-block text-xs font-bold uppercase text-black/50 hover:text-black mb-3"
        >
          ← Back to Pair Study
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">
          Jurisdiction N-of-1 Summaries
        </h1>
        <p className="text-black/60 font-medium mt-2">
          {summary.predictorLabel} → {summary.outcomeLabel}
        </p>
      </header>

      <section className="border-2 border-black bg-white overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black bg-yellow-300">
              <th className="text-left px-3 py-2 font-black uppercase">Jurisdiction</th>
              <th className="text-right px-3 py-2 font-black uppercase">Forward r</th>
              <th className="text-right px-3 py-2 font-black uppercase">Predictive r</th>
              <th className="text-right px-3 py-2 font-black uppercase">% Change</th>
              <th className="text-right px-3 py-2 font-black uppercase">Pairs</th>
              <th className="text-right px-3 py-2 font-black uppercase">Score</th>
              <th className="text-center px-3 py-2 font-black uppercase">Quality</th>
              <th className="text-center px-3 py-2 font-black uppercase">Detail</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => (
              <tr key={subject.summary.subjectId} className="border-b border-black hover:bg-cyan-50">
                <td className="px-3 py-2 font-bold text-black">{subject.summary.subjectName}</td>
                <td className="px-3 py-2 text-right text-black/70">{fmt(subject.summary.forwardPearson, 3)}</td>
                <td className="px-3 py-2 text-right text-black/70">{fmt(subject.summary.predictivePearson, 3)}</td>
                <td className="px-3 py-2 text-right text-black/70">{fmt(subject.summary.percentChangeFromBaseline, 2)}%</td>
                <td className="px-3 py-2 text-right text-black/70">{subject.summary.numberOfPairs}</td>
                <td className="px-3 py-2 text-right text-black/70">{(subject.ranking.score * 100).toFixed(1)}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block border px-2 py-0.5 text-[10px] font-black uppercase ${
                      subject.qualityGate.passed
                        ? "bg-cyan-100 border-cyan-400 text-black"
                        : "bg-amber-100 border-amber-500 text-black"
                    }`}
                  >
                    {subject.qualityGate.passed ? "Pass" : "Flagged"}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Link
                    href={getJurisdictionStudyPath(outcomeId, predictorId, subject.summary.subjectId)}
                    className="inline-block px-2 py-1 text-xs font-black uppercase border-2 border-black bg-white hover:bg-pink-200"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
