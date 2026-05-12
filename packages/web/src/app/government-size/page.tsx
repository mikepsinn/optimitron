import Link from "next/link";
import { usGovernmentSizeAnalysis } from "@/lib/government-size-analysis";
import { getRouteMetadata } from "@/lib/metadata";
import { governmentSizeLink, ROUTES } from "@/lib/routes";

export const metadata = getRouteMetadata(governmentSizeLink);

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPercent(value: number | null): string {
  return value == null ? "N/A" : `${value.toFixed(1)}%`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export default function GovernmentSizePage() {
  const analysis = usGovernmentSizeAnalysis;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
          Government Size
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          Whole-government floor, not just federal line items
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
          This view asks a different question from OBG: how much total government spending is consistent with strong
          direct welfare outcomes in the cross-country panel, before we even argue about composition.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-4">
        <MetricCard label="US-equivalent floor" value={formatPercent(analysis.overall.usEquivalentOptimalPctGdp)} accent="cyan" />
        <MetricCard label="Current US share" value={formatPercent(analysis.usSnapshot.modeledSpendingPctGdp)} accent="yellow" />
        <MetricCard label="Gap to floor" value={formatPercent(analysis.usSnapshot.gapToOptimalPctPoints)} accent="pink" />
        <MetricCard label="Floor PPP / cap" value={formatCurrency(analysis.overall.optimalSpendingPerCapitaPpp)} accent="foreground" />
      </div>

      <section className="mb-10 border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black uppercase text-foreground">Objective floors</h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          The headline floor is not the only one published. These variants show how the answer moves when you isolate
          health-only versus combined direct welfare objectives.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {analysis.objectiveFloors.map((floor) => (
            <div key={floor.id} className="border-4 border-primary p-4">
              <p className="text-lg font-black uppercase text-foreground">{floor.name}</p>
              <p className="mt-3 text-3xl font-black text-background">
                {formatPercent(floor.usEquivalentOptimalPctGdp)}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
                US-equivalent spending share
              </p>
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Band {formatPercent(floor.usEquivalentBandLowPctGdp)} to {formatPercent(floor.usEquivalentBandHighPctGdp)}
              </p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {floor.qualifyingJurisdictions} qualifying jurisdictions
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase text-foreground">Start-year sensitivity</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary bg-background text-foreground">
                  <th className="px-3 py-2 text-left font-black uppercase">Window</th>
                  <th className="px-3 py-2 text-right font-black uppercase">Floor</th>
                  <th className="px-3 py-2 text-right font-black uppercase">Band</th>
                  <th className="px-3 py-2 text-right font-black uppercase">US status</th>
                </tr>
              </thead>
              <tbody>
                {analysis.sensitivity.startYearScenarios.map((scenario) => (
                  <tr key={scenario.startYear} className="border-t border-primary">
                    <td className="px-3 py-3 font-bold text-foreground">
                      {scenario.startYear} to {scenario.endYear}
                      {scenario.isPrimaryScenario ? (
                        <span className="ml-2 bg-foreground px-2 py-0.5 text-xs font-black text-background">
                          primary
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-background">
                      {formatPercent(scenario.usEquivalentOptimalPctGdp)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-muted-foreground">
                      {formatPercent(scenario.usEquivalentBandLowPctGdp)} - {formatPercent(scenario.usEquivalentBandHighPctGdp)}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-foreground">
                      {formatStatus(scenario.usStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase text-foreground">Efficient jurisdictions</h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Jurisdictions with repeated observations inside the minimum-efficient per-capita band.
          </p>
          <div className="mt-4 space-y-3">
            {analysis.efficientJurisdictions.slice(0, 8).map((jurisdiction) => (
              <div key={jurisdiction.jurisdictionId} className="border-4 border-primary p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black uppercase text-foreground">{jurisdiction.jurisdictionName}</p>
                    <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                      {jurisdiction.qualifyingObservations} qualifying observations
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-background">
                      {formatCurrency(jurisdiction.medianSpendingPerCapitaPpp)}
                    </p>
                    <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                      {jurisdiction.medianSpendingPctGdp.toFixed(1)}% GDP
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10 border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black uppercase text-foreground">Federal composition implications</h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          {analysis.federalComposition.compositionCaveat}
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-black uppercase text-foreground">Top scale-ups</h3>
            <div className="mt-4 space-y-3">
              {analysis.federalComposition.topIncreaseCategories.map((category) => (
                <div key={category.name} className="border-4 border-primary p-4">
                  <p className="font-black uppercase text-foreground">{category.name}</p>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">
                    {category.reallocationPct.toFixed(1)}% reallocation · target share {category.targetSharePct.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-foreground">Top scale-downs</h3>
            <div className="mt-4 space-y-3">
              {analysis.federalComposition.topDecreaseCategories.map((category) => (
                <div key={category.name} className="border-4 border-primary p-4">
                  <p className="font-black uppercase text-foreground">{category.name}</p>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">
                    {category.reallocationPct.toFixed(1)}% reallocation · target share {category.targetSharePct.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <NavCard href={ROUTES.obg} title="Category budgets" description="Return to the federal line-item analysis." />
        <NavCard href={ROUTES.efficiency} title="Efficiency rankings" description="See the cross-country comparators driving the budget case." />
        <NavCard href={ROUTES.dividend} title="Optimization Dividend" description="Translate the savings into household-level outcomes." />
      </section>

      <p className="mt-8 text-xs font-bold text-muted-foreground">
        Generated {new Date(analysis.generatedAt).toLocaleDateString()} from the current government-size analysis artifact.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "yellow" | "pink" | "foreground";
}) {
  const accents: Record<typeof accent, string> = {
    cyan: "bg-background text-foreground",
    yellow: "bg-background text-foreground",
    pink: "bg-foreground text-background",
    foreground: "bg-foreground text-background",
  };

  return (
    <div className={`border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${accents[accent]}`}>
      <div className="text-2xl font-black md:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-wide">{label}</div>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <p className="text-lg font-black uppercase text-foreground">{title}</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{description}</p>
    </Link>
  );
}
