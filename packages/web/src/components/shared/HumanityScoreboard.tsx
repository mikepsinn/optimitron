import { BrutalCard } from "@/components/ui/brutal-card";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  WISHONIA_PROJECTED_HALE_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_HALE_GAIN_YEAR_15,
} from "@optimitron/data/parameters";

const haleGain = TREATY_HALE_GAIN_YEAR_15.value.toFixed(1);
const wishoniaHaleGain = (
  WISHONIA_PROJECTED_HALE_YEAR_15.value - GLOBAL_HALE_CURRENT.value
).toFixed(1);
const treatyIncomeMultiplier = Math.round(
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value /
    CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value,
);
const wishoniaIncomeMultiplier = Math.round(
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15.value /
    CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15.value,
);

/**
 * Humanity's Scoreboard — the two metrics that define the game.
 * Shows current values, treaty targets, and optimal governance targets.
 * Reusable across landing page and /scoreboard.
 */
export function HumanityScoreboard() {
  return (
    <BrutalCard bgColor="background" shadowSize={8} padding="lg">
      <div className="text-center mb-6">
        <span className="text-xs font-black px-2.5 py-1 bg-foreground text-background uppercase">
          Humanity&apos;s Scoreboard
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div />
        <div className="text-center">
          <span className="text-xs font-black uppercase text-muted-foreground">
            Current
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs font-black uppercase text-brutal-cyan">
            1% Treaty
          </span>
        </div>
        <div className="text-center">
          <span className="text-xs font-black uppercase text-brutal-pink">
            Optimal
          </span>
        </div>
      </div>

      {/* HALE row */}
      <div className="grid grid-cols-4 gap-4 items-center py-4 border-b-4 border-primary">
        <div>
          <p className="text-base sm:text-lg font-black uppercase text-foreground">
            Healthy Life Years
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-muted-foreground line-through">
            {GLOBAL_HALE_CURRENT.value}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-brutal-cyan">
            {TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1)}
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            +{haleGain} yrs
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-brutal-pink">
            {WISHONIA_PROJECTED_HALE_YEAR_15.value.toFixed(1)}
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            +{wishoniaHaleGain} yrs
          </p>
        </div>
      </div>

      {/* Income row */}
      <div className="grid grid-cols-4 gap-4 items-center py-4">
        <div>
          <p className="text-base sm:text-lg font-black uppercase text-foreground">
            Median Income
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-muted-foreground line-through">
            <ParameterValue
              param={CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15}
              className="text-muted-foreground"
            />
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-brutal-cyan">
            <ParameterValue
              param={TREATY_TRAJECTORY_AVG_INCOME_YEAR_15}
              className="text-brutal-cyan"
            />
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            {treatyIncomeMultiplier}x
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-brutal-pink">
            <ParameterValue
              param={WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15}
              className="text-brutal-pink"
            />
          </div>
          <p className="text-sm font-bold text-muted-foreground">
            {wishoniaIncomeMultiplier}x
          </p>
        </div>
      </div>
    </BrutalCard>
  );
}
