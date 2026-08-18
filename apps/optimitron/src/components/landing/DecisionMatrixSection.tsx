import {
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
  EARTH_OPTIMIZATION_POINT_VALUE,
  PRIZE_POOL_ANNUAL_RETURN,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_PARTICIPATION_RATE,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { REFERRAL } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";

const incomeMultiple =
  Math.round(TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER.value * 10) / 10;
const haleGain = Math.round(TREATY_HALE_GAIN_YEAR_15.value * 10) / 10;
const collapseYear = Math.round(DESTRUCTIVE_ECONOMY_50PCT_YEAR.value);

export function DecisionMatrixSection() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg">
      <Container>
        <SectionHeader
          title="The Decision Matrix"
          subtitle={
            <>
              Depositors claim the pool if the targets are missed. Earth
              Optimization Point holders split it if the targets are hit. You
              can do both.
            </>
          }
          size="lg"
        />

        <div className="mx-auto mb-8 max-w-4xl overflow-hidden border border-foreground bg-background">
          <table className="w-full">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-foreground">
                <th className="w-1/5 p-4 text-left text-sm font-black uppercase text-muted-foreground">
                  Your Move
                </th>
                <th className="w-2/5 border-l border-foreground p-4 text-center text-sm font-black uppercase text-foreground">
                  Targets Missed
                </th>
                <th className="w-2/5 border-l border-foreground p-4 text-center text-sm font-black uppercase text-foreground">
                  Targets Hit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="block border-b border-foreground align-top sm:table-row">
                <td className="block border-b border-foreground bg-foreground p-4 text-sm font-black uppercase text-background sm:table-cell sm:border-b-0 sm:border-r sm:bg-background sm:text-foreground">
                  Deposit + Earn Points
                </td>
                <td className="block border-b border-foreground p-4 sm:table-cell sm:border-b-0 sm:border-r">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-foreground sm:hidden">
                    Targets Missed
                  </p>
                  <p className="text-sm font-bold leading-6 text-muted-foreground">
                    Your deposit claims a pro-rata share of the realized pool:
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground sm:text-xl">
                    ~
                    <ParameterValue
                      param={PRIZE_POOL_HORIZON_MULTIPLE}
                      display="integer"
                    />
                    x projected by{" "}
                    <ParameterValue
                      param={DESTRUCTIVE_ECONOMY_50PCT_YEAR}
                      display="integer"
                      valueOverride={collapseYear.toString()}
                    />{" "}
                    at <ParameterValue param={PRIZE_POOL_ANNUAL_RETURN} />{" "}
                    annually.
                  </p>
                </td>
                <td className="block p-4 sm:table-cell">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-foreground sm:hidden">
                    Targets Hit
                  </p>
                  <p className="text-sm font-bold leading-6 text-muted-foreground">
                    Your points split the pool:
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground sm:text-xl">
                    Modeled ~
                    <ParameterValue
                      param={EARTH_OPTIMIZATION_POINT_VALUE}
                    />{" "}
                    per point if{" "}
                    <ParameterValue
                      param={PRIZE_POOL_PARTICIPATION_RATE}
                      valueOverride="1%"
                    />{" "}
                    of global investable assets enter.
                  </p>
                </td>
              </tr>
              <tr className="block sm:table-row">
                <td className="block border-b border-foreground bg-foreground p-4 text-sm font-black uppercase text-background sm:table-cell sm:border-b-0 sm:border-r sm:bg-background sm:text-muted-foreground">
                  Do Neither
                </td>
                <td className="block border-b border-foreground p-4 text-lg font-black text-muted-foreground sm:table-cell sm:border-b-0 sm:border-r">
                  <span className="mb-2 block text-xs uppercase tracking-wide text-foreground sm:hidden">
                    Targets Missed
                  </span>
                  No prize claim.
                </td>
                <td className="block p-4 text-lg font-black text-muted-foreground sm:table-cell">
                  <span className="mb-2 block text-xs uppercase tracking-wide text-foreground sm:hidden">
                    Targets Hit
                  </span>
                  No prize claim.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mx-auto max-w-4xl space-y-4 border-y border-foreground py-6 text-sm font-bold leading-7 text-muted-foreground sm:text-base">
          <p>
            <span className="text-foreground">Modeled world outcome:</span>{" "}
            Targets missed — the destructive economy reaches{" "}
            <ParameterValue
              param={DESTRUCTIVE_ECONOMY_50PCT_YEAR}
              valueOverride={`50% of GDP by ${collapseYear}`}
            />
            . Targets hit —{" "}
            <ParameterValue
              param={TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER}
              valueOverride={`${incomeMultiple}x`}
            />{" "}
            lifetime income and +
            <ParameterValue
              param={TREATY_HALE_GAIN_YEAR_15}
              valueOverride={`${haleGain}`}
            />{" "}
            healthy years.
          </p>
          <p>
            {REFERRAL.earnOne} Deposits are locked until{" "}
            <ParameterValue
              param={DESTRUCTIVE_ECONOMY_50PCT_YEAR}
              display="integer"
              valueOverride={collapseYear.toString()}
            />
            . All figures are projections, not guarantees.
          </p>
        </div>

        <div className="mt-8 text-center">
          <GameCTA href={ROUTES.prize} variant="primary" size="lg">
            See How the Prize Works
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
