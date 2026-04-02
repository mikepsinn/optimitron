import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import {
  HEALTH_SYSTEM_COMPARISON,
  EDUCATION_COMPARISON,
} from "@optimitron/data/datasets/international-comparisons";
import {
  US_MILITARY_SPENDING_2024_ANNUAL,
  US_GOV_WASTE_MILITARY_OVERSPEND,
  HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO,
} from "@optimitron/data/parameters";

/* ── Pull real data from international comparisons ───────────────── */

const usa = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === "USA")!;
const sgp = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === "SGP")!;
const usaEdu = EDUCATION_COMPARISON.find((c) => c.iso3 === "USA")!;
const sgpEdu = EDUCATION_COMPARISON.find((c) => c.iso3 === "SGP")!;

const healthOverspend = (usa.healthSpendingPerCapita / sgp.healthSpendingPerCapita).toFixed(1);
const usMilitary = Math.round(US_MILITARY_SPENDING_2024_ANNUAL.value / 1e9);
const milDeterrence = Math.round(
  (US_MILITARY_SPENDING_2024_ANNUAL.value - US_GOV_WASTE_MILITARY_OVERSPEND.value) / 1e9,
);
const milOverspend = (
  US_MILITARY_SPENDING_2024_ANNUAL.value /
  (US_MILITARY_SPENDING_2024_ANNUAL.value - US_GOV_WASTE_MILITARY_OVERSPEND.value)
).toFixed(1);
const milMultiplier = HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO.value.toFixed(0);
const eduSpendRatio = (usaEdu.educationSpendingPctGDP / sgpEdu.educationSpendingPctGDP).toFixed(1);

interface BudgetRow {
  emoji: string;
  label: string;
  usaValue: string;
  usaOutcome: string;
  bestValue: string;
  bestOutcome: string;
  bestLabel: string;
  ratio: string;
}

const ROWS: BudgetRow[] = [
  {
    emoji: "🏥",
    label: "Healthcare",
    usaValue: `$${(usa.healthSpendingPerCapita / 1000).toFixed(1)}K/person`,
    usaOutcome: `${usa.lifeExpectancy} yrs life exp`,
    bestLabel: "🇸🇬 Singapore",
    bestValue: `$${(sgp.healthSpendingPerCapita / 1000).toFixed(1)}K/person`,
    bestOutcome: `${sgp.lifeExpectancy} yrs life exp`,
    ratio: `${healthOverspend}×`,
  },
  {
    emoji: "⚔️",
    label: "Military",
    usaValue: `$${usMilitary}B`,
    usaOutcome: "0.6× econ multiplier",
    bestLabel: "🛡️ Deterrence",
    bestValue: `$${milDeterrence}B`,
    bestOutcome: `realloc → ${milMultiplier}× ROI`,
    ratio: `${milOverspend}×`,
  },
  {
    emoji: "📚",
    label: "Education",
    usaValue: `${usaEdu.educationSpendingPctGDP}% GDP`,
    usaOutcome: `PISA math: ${usaEdu.pisaScoreMath}`,
    bestLabel: "🇸🇬 Singapore",
    bestValue: `${sgpEdu.educationSpendingPctGDP}% GDP`,
    bestOutcome: `PISA math: ${sgpEdu.pisaScoreMath}`,
    ratio: `${eduSpendRatio}×`,
  },
];

export function OptimalBudgetPreview() {
  return (
    <SectionContainer bgColor="red" borderPosition="top" padding="lg">
      <Container>
        <SectionHeader
          title="Your Government's Budget Report Card"
          subtitle="More money. Worse outcomes. On every line item. Singapore spends a quarter of what you spend on healthcare and their people live six years longer."
          size="lg"
        />

        <div className="overflow-x-auto border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-primary">
                <th className="py-3 px-4 text-left font-black uppercase text-sm text-foreground" />
                <th className="py-3 px-4 text-center font-black uppercase text-sm text-brutal-red" colSpan={2}>
                  🇺🇸 USA (Current)
                </th>
                <th className="py-3 px-4 text-center font-black uppercase text-sm text-brutal-green" colSpan={2}>
                  Best Performer
                </th>
                <th className="py-3 px-4 text-center font-black uppercase text-sm text-brutal-yellow">
                  Overspend
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b-2 border-primary hover:bg-muted transition-colors">
                  <td className="py-3 px-4 font-black text-foreground whitespace-nowrap">
                    {row.emoji} {row.label}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-brutal-red whitespace-nowrap">
                    {row.usaValue}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-muted-foreground whitespace-nowrap">
                    {row.usaOutcome}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-brutal-green whitespace-nowrap">
                    {row.bestValue}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-muted-foreground whitespace-nowrap">
                    {row.bestLabel} — {row.bestOutcome}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-3 py-1 font-black text-lg bg-brutal-yellow text-brutal-yellow-foreground border-2 border-primary">
                      {row.ratio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center font-black text-lg">
          Pattern: more money, worse outcomes. Every. Single. Category.
        </p>

        <div className="mt-6 text-center">
          <GameCTA href="/obg" variant="primary">
            See Full Budget Analysis &rarr;
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
