import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Discoveries | Optimitron",
  description:
    "Population-level health discoveries aggregated from individual contributor analyses.",
};

interface AggregateRow {
  predictorName: string;
  outcomeName: string;
  effectSize: number | null;
  predictorImpactScore: number | null;
  numberOfUnits: number;
  forwardPearsonCorrelation: number;
  outcomeFollowUpPercentChangeFromBaseline: number | null;
}

async function getDiscoveries(): Promise<AggregateRow[]> {
  const rows = await prisma.aggregateVariableRelationship.findMany({
    where: { deletedAt: null },
    orderBy: { predictorImpactScore: { sort: "desc", nulls: "last" } },
    take: 100,
    select: {
      forwardPearsonCorrelation: true,
      effectSize: true,
      predictorImpactScore: true,
      numberOfUnits: true,
      outcomeFollowUpPercentChangeFromBaseline: true,
      predictorGlobalVariable: { select: { name: true } },
      outcomeGlobalVariable: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    predictorName: r.predictorGlobalVariable.name,
    outcomeName: r.outcomeGlobalVariable.name,
    effectSize: r.effectSize,
    predictorImpactScore: r.predictorImpactScore,
    numberOfUnits: r.numberOfUnits,
    forwardPearsonCorrelation: r.forwardPearsonCorrelation,
    outcomeFollowUpPercentChangeFromBaseline:
      r.outcomeFollowUpPercentChangeFromBaseline,
  }));
}

function confidenceLabel(units: number): {
  label: string;
  color: string;
} {
  if (units >= 50)
    return { label: "High", color: "bg-brutal-cyan/20 text-brutal-cyan" };
  if (units >= 10)
    return { label: "Medium", color: "bg-brutal-yellow/20 text-brutal-yellow" };
  return { label: "Low", color: "bg-brutal-red/20 text-brutal-red" };
}

function formatNumber(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return "--";
  return n.toFixed(decimals);
}

function formatPercent(n: number | null): string {
  if (n === null || n === undefined) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export default async function DiscoveriesPage() {
  const discoveries = await getDiscoveries();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="space-y-3 mb-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
          Population Insights
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          Health Discoveries
        </h1>
        <p className="max-w-3xl text-base font-medium text-black/70">
          Aggregated from individual contributor analyses. Each row represents a
          predictor-outcome relationship discovered across multiple people. More
          contributors = higher confidence.
        </p>
      </section>

      {discoveries.length === 0 ? (
        <div className="border-2 border-dashed border-black p-12 text-center">
          <p className="text-lg font-bold text-black/50">
            No discoveries yet.
          </p>
          <p className="text-sm text-black/40 mt-2">
            Discoveries appear here once contributors submit health analyses via
            the browser extension.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-brutal-yellow">
                <th className="px-4 py-3 text-left font-black uppercase text-black">
                  Predictor
                </th>
                <th className="px-4 py-3 text-left font-black uppercase text-black">
                  Outcome
                </th>
                <th className="px-4 py-3 text-right font-black uppercase text-black">
                  Effect
                </th>
                <th className="px-4 py-3 text-right font-black uppercase text-black">
                  PIS
                </th>
                <th className="px-4 py-3 text-right font-black uppercase text-black">
                  Correlation
                </th>
                <th className="px-4 py-3 text-center font-black uppercase text-black">
                  Contributors
                </th>
                <th className="px-4 py-3 text-center font-black uppercase text-black">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {discoveries.map((d, i) => {
                const conf = confidenceLabel(d.numberOfUnits);
                return (
                  <tr
                    key={`${d.predictorName}-${d.outcomeName}`}
                    className={`border-b border-black ${i % 2 === 0 ? "bg-white" : "bg-muted"}`}
                  >
                    <td className="px-4 py-3 font-semibold text-black">
                      {d.predictorName}
                    </td>
                    <td className="px-4 py-3 text-black/70">
                      {d.outcomeName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPercent(
                        d.outcomeFollowUpPercentChangeFromBaseline,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(d.predictorImpactScore, 3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(d.forwardPearsonCorrelation, 3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {d.numberOfUnits}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${conf.color}`}
                      >
                        {conf.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
