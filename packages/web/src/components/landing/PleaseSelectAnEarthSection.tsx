import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { GameCTA } from "@/components/ui/game-cta";
import {
  GLOBAL_AVG_INCOME_2025,
  GLOBAL_HALE_CURRENT,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_PROJECTED_HALE_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15,
  WISHONIA_PROJECTED_HALE_YEAR_15,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
} from "@optimitron/data/parameters";

const collapseYear = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);
const globalDysfunctionCostT = Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12);

function formatCurrency(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

const scenarios = [
  {
    name: "Status Quo",
    subtitle: "Somalia, But Everywhere",
    income: formatCurrency(Math.round(GLOBAL_AVG_INCOME_2025.value)),
    hale: GLOBAL_HALE_CURRENT.value,
    color: "text-muted-foreground",
  },
  {
    name: "1% Treaty",
    subtitle: "Minimum Acceptable Governance",
    income: formatCurrency(Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value)),
    hale: TREATY_PROJECTED_HALE_YEAR_15.value,
    color: "text-brutal-cyan",
  },
  {
    name: "Optimal Governance",
    subtitle: `End the $${globalDysfunctionCostT}T/yr Dysfunction Tax`,
    income: formatCurrency(Math.round(WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15.value)),
    hale: WISHONIA_PROJECTED_HALE_YEAR_15.value,
    color: "text-brutal-green",
  },
];

export function PleaseSelectAnEarthSection() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="Please Select an Earth"
          subtitle={`Projected outcomes by ${collapseYear}. You are currently on Path A. You chose it by not choosing. Which is very on-brand for your species.`}
          size="lg"
        />

        <div className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto max-w-4xl mx-auto mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-primary">
                <th className="p-3 text-left text-xs font-black uppercase text-muted-foreground">
                  Scenario
                </th>
                <th className="p-3 text-right text-xs font-black uppercase text-muted-foreground">
                  Income / Person / Year
                </th>
                <th className="p-3 text-right text-xs font-black uppercase text-muted-foreground">
                  Median HALE
                </th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr
                  key={s.name}
                  className="border-b-2 border-primary last:border-b-0"
                >
                  <td className="p-3">
                    <div className={`font-black text-sm uppercase ${s.color}`}>
                      {s.name}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground">
                      {s.subtitle}
                    </div>
                  </td>
                  <td className={`p-3 text-right font-black text-lg ${s.color}`}>
                    {s.income}
                  </td>
                  <td className={`p-3 text-right font-black text-lg ${s.color}`}>
                    {s.hale} yrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <GameCTA href="/prize" variant="secondary" size="lg">
            Choose Path B
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
