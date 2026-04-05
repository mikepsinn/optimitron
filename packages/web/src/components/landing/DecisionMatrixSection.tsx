import { SectionContainer } from "@/components/ui/section-container";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { GameCTA } from "@/components/ui/game-cta";
import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_ANNUAL_RETURN,
  VOTE_TOKEN_VALUE,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  TREATY_HALE_GAIN_YEAR_15,
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
} from "@optimitron/data/parameters";

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
          subtitle="Every cell is better if you deposit. That's called a dominant strategy."
          size="lg"
        />

        <div className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto max-w-4xl mx-auto mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-primary">
                <th className="p-4 text-left text-xs font-black uppercase text-muted-foreground w-1/5">
                  Your Move
                </th>
                <th className="p-4 text-center text-xs font-black uppercase w-2/5 bg-brutal-yellow text-brutal-yellow-foreground border-l-4 border-primary">
                  Targets Missed
                  <div className="text-xs font-bold normal-case mt-1">
                    Somalia, but everywhere by {collapseYear}
                  </div>
                </th>
                <th className="p-4 text-center text-xs font-black uppercase w-2/5 bg-brutal-cyan text-brutal-cyan-foreground border-l-4 border-primary">
                  Targets Hit
                  <div className="text-xs font-bold normal-case mt-1">
                    {incomeMultiple}x richer &middot; +{haleGain} healthy years
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: You Deposit */}
              <tr className="border-b-4 border-primary">
                <td className="p-4 font-black text-sm uppercase text-foreground border-r-4 border-primary">
                  You Deposit
                </td>
                <td className="p-4 border-r-4 border-primary">
                  <div className="text-2xl font-black text-foreground">
                    ~<ParameterValue
                      param={PRIZE_POOL_HORIZON_MULTIPLE}
                      display="integer"
                    />x return
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    <ParameterValue param={PRIZE_POOL_ANNUAL_RETURN} /> annual, diversified across VC sector
                  </p>
                </td>
                <td className="p-4">
                  <div className="text-2xl font-black text-foreground">
                    ~<ParameterValue param={VOTE_TOKEN_VALUE} />/VOTE
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    at 1% of global savings in prize pool
                  </p>
                </td>
              </tr>

              {/* Row 2: You Don't Deposit */}
              <tr>
                <td className="p-4 font-black text-sm uppercase text-muted-foreground border-r-4 border-primary">
                  You Don&apos;t
                </td>
                <td className="p-4 border-r-4 border-primary">
                  <div className="text-2xl font-black text-muted-foreground">
                    $0
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    and civilizational collapse
                  </p>
                </td>
                <td className="p-4">
                  <div className="text-2xl font-black text-muted-foreground">
                    $0
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    and zero credit for the nice world
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <GameCTA href="#vote" variant="primary" size="lg">
            Deposit &amp; Vote
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}
