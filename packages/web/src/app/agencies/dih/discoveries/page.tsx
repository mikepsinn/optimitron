import { prisma } from "@/lib/prisma";
import { discoveriesLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(discoveriesLink);

interface AggregateRow {
  predictorName: string;
  outcomeName: string;
  effectSize: number | null;
  predictorImpactScore: number | null;
  numberOfSubjects: number;
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
      numberOfSubjects: true,
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
    numberOfSubjects: r.numberOfSubjects,
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
    return { label: "High", color: "bg-brutal-cyan text-brutal-cyan-foreground" };
  if (units >= 10)
    return { label: "Medium", color: "bg-brutal-yellow text-brutal-yellow-foreground" };
  return { label: "Low", color: "bg-brutal-red text-brutal-red-foreground" };
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
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
          Health Discoveries
        </h1>
        <p className="max-w-3xl text-base font-bold text-foreground">
          These patterns emerged from real people tracking real data. Each row
          is a relationship the population discovered by accident. More
          contributors means the signal gets louder.
        </p>
      </section>

      {discoveries.length === 0 ? (
        <div className="border-2 border-dashed border-primary p-12 text-center">
          <p className="text-lg font-bold text-muted-foreground">
            No discoveries yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Nothing here yet. Install the extension, track your data, and the
            patterns will find themselves.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary bg-brutal-yellow text-brutal-yellow-foreground">
                <th className="px-4 py-3 text-left font-black uppercase">
                  Predictor
                </th>
                <th className="px-4 py-3 text-left font-black uppercase">
                  Outcome
                </th>
                <th className="px-4 py-3 text-right font-black uppercase">
                  Effect
                </th>
                <th className="px-4 py-3 text-right font-black uppercase">
                  PIS
                </th>
                <th className="px-4 py-3 text-right font-black uppercase">
                  Correlation
                </th>
                <th className="px-4 py-3 text-center font-black uppercase">
                  Contributors
                </th>
                <th className="px-4 py-3 text-center font-black uppercase">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {discoveries.map((d, i) => {
                const conf = confidenceLabel(d.numberOfSubjects);
                return (
                  <tr
                    key={`${d.predictorName}-${d.outcomeName}`}
                    className={`border-b border-primary ${i % 2 === 0 ? "bg-background" : "bg-muted"}`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {d.predictorName}
                    </td>
                    <td className="px-4 py-3 text-foreground">
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
                      {d.numberOfSubjects}
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
