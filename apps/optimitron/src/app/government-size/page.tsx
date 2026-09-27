import Link from "next/link";
import {
  usGovernmentSizeAnalysis,
  type GovernmentWelfareInterval,
  type HistoricalGovernmentSizeAnalysis,
} from "@/lib/government-size-analysis";
import { getRouteMetadata } from "@/lib/metadata";
import { governmentSizeLink, ROUTES } from "@/lib/routes";

export const metadata = getRouteMetadata(governmentSizeLink);

function number(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${number(value)}`;
}

function Interval({ value }: { value: GovernmentWelfareInterval | null }) {
  if (!value) return <p className="mt-3 text-xl font-black">More country data needed</p>;
  return <>
    <p className="mt-3 text-3xl font-black">{signed(value.mean)}</p>
    <p className="mt-1 text-sm text-muted-foreground">95% interval: {signed(value.low)} to {signed(value.high)}</p>
  </>;
}

function HistoricalResults({ analysis }: { analysis: HistoricalGovernmentSizeAnalysis }) {
  return (
    <details className="mt-10 border-t-2 border-primary pt-5">
      <summary className="cursor-pointer text-lg font-black">Earlier spending-floor estimates</summary>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        The {analysis.generatedAt.slice(0, 10)} report asked how little countries spent while staying near the best observed health and income scores.
        Its estimates remain below for comparison.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b-2 border-primary">
            <th className="py-3 pr-4">Earlier objective</th><th className="py-3 px-3 text-right">US-equivalent floor</th>
            <th className="py-3 px-3 text-right">Band</th><th className="py-3 pl-3 text-right">Countries</th>
          </tr></thead>
          <tbody>{analysis.objectiveFloors.map(floor => <tr key={floor.id} className="border-b border-primary/20">
            <td className="py-3 pr-4 font-bold">{floor.name}</td>
            <td className="py-3 px-3 text-right">{floor.usEquivalentOptimalPctGdp == null ? "Unavailable" : `${number(floor.usEquivalentOptimalPctGdp)}%`}</td>
            <td className="py-3 px-3 text-right">{floor.usEquivalentBandLowPctGdp == null ? "Unavailable" : `${number(floor.usEquivalentBandLowPctGdp)}–${number(floor.usEquivalentBandHighPctGdp ?? floor.usEquivalentBandLowPctGdp)}%`}</td>
            <td className="py-3 pl-3 text-right">{floor.qualifyingJurisdictions}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <h3 className="mt-6 font-black">Earlier federal reallocations</h3>
      <p className="mt-2 text-sm text-muted-foreground">{analysis.federalComposition.compositionCaveat}</p>
      <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {[...analysis.federalComposition.topIncreaseCategories, ...analysis.federalComposition.topDecreaseCategories].map(category =>
          <li key={category.name}><span className="font-bold">{category.name}</span>: {signed(category.reallocationPct)}%; target share {number(category.targetSharePct)}%</li>,
        )}
      </ul>
    </details>
  );
}

export default function GovernmentSizePage() {
  const analysis = usGovernmentSizeAnalysis;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">Government spending, health and income</h1>
      <p className="mt-3 max-w-3xl text-base text-muted-foreground">
        When a country spends more, do its people live healthier lives and take home more income?
        Compare the results across countries and over time.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {analysis.outcomes.map(outcome => <section key={outcome.id} className="border-4 border-primary p-5">
          <h2 className="text-xl font-black">{outcome.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Observed difference after higher-spending years</p>
          <Interval value={outcome.meanOutcomeDifference} />
          <p className="mt-1 text-sm font-bold">{outcome.unit}</p>
          <p className="mt-5 text-sm">{outcome.countryCount} countries · {outcome.sourceObservationCount.toLocaleString("en-US")} observations · {outcome.yearRange?.join("–") ?? "No coverage"}</p>
          <p className="mt-3 text-xs text-muted-foreground">{outcome.definition}</p>
        </section>)}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Higher-spending years are compared with each country&apos;s lower-spending years, using health and income measured over the following one to four years.
        These are observed differences, not a forecast of the benefit from a budget change.
      </p>
      <a href="/reports/us-government-size-analysis.md" className="mt-5 inline-flex border-2 border-primary px-4 py-2 font-bold hover:bg-muted" download>
        Download the full analysis
      </a>
      {analysis.outcomes.map(outcome => <details key={outcome.id} className="mt-10">
        <summary className="cursor-pointer text-xl font-black">{outcome.name} by country</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b-2 border-primary">
              <th className="py-3 pr-4">Country</th><th className="py-3 px-3 text-right">Lower / higher spending</th>
              <th className="py-3 px-3 text-right">Outcome difference</th><th className="py-3 pl-3 text-right">Paired years</th>
            </tr></thead>
            <tbody>{outcome.countries.filter(country => country.includedInSummary).map(country =>
              <tr key={country.id} className="border-b border-primary/20">
                <td className="py-3 pr-4 font-bold"><a href={country.sourceUrl} className="underline underline-offset-2">{country.name}</a></td>
                <td className="py-3 px-3 text-right whitespace-nowrap">{number(country.lowerSpendingPctGdp, 1)} / {number(country.higherSpendingPctGdp, 1)}% GDP</td>
                <td className="py-3 px-3 text-right whitespace-nowrap">{signed(country.outcomeDifference)}</td>
                <td className="py-3 pl-3 text-right">{country.pairedYears}</td>
              </tr>,
            )}</tbody>
          </table>
        </div>
      </details>)}
      <details className="mt-10 border-t-2 border-primary pt-5">
        <summary className="cursor-pointer text-lg font-black">Sources and calculation</summary>
        <p className="mt-3 text-sm">{analysis.predictor.definition}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {analysis.sourceSnapshots.map(source => <li key={source.name}><a href={source.url} className="underline underline-offset-2">{source.name}</a> · source snapshot {source.generatedAt.slice(0, 10)}</li>)}
          {analysis.methodology.notes.map(note => <li key={note}>{note}</li>)}
        </ul>
        <p className="mt-3 text-sm">{analysis.methodology.intervalDescription}</p>
        <p className="mt-2 text-sm">{analysis.methodology.bootstrapDraws.toLocaleString("en-US")} bootstrap draws · seed {analysis.methodology.seed}</p>
      </details>
      {analysis.historicalBenchmark && <HistoricalResults analysis={analysis.historicalBenchmark} />}
      <p className="mt-8 text-xs text-muted-foreground">Report generated {analysis.generatedAt}. {analysis.sourceMode}.</p>
      <div className="mt-6 flex gap-6 text-sm font-bold">
        <Link href={ROUTES.obg} className="underline underline-offset-2">Budget analysis</Link>
        <Link href={ROUTES.opg} className="underline underline-offset-2">Policy analysis</Link>
      </div>
    </div>
  );
}
