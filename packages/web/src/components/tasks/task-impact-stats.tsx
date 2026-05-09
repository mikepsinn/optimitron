import Link from "next/link";
import {
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  type TaskDelayStats,
} from "@/lib/tasks/accountability";

interface TaskImpactStatsProps {
  delayStats: TaskDelayStats;
  /** Link to the calculation methodology page */
  calculationsUrl?: string | null;
  /** Total cumulative healthy years averted over the full impact window (optional) */
  totalHealthyYears?: number | null;
  /** Total cumulative economic value (optional) */
  totalEconomicValue?: number | null;
  /** Duration in years over which the cumulative impact plays out */
  benefitDurationYears?: number | null;
}

function StatBox({
  label,
  value,
  accent = "red",
}: {
  label: string;
  value: string;
  accent?: "red" | "pink";
}) {
  const accentClass = accent === "red" ? "text-brutal-red" : "text-foreground";
  return (
    <div className="border-4 border-foreground bg-muted/20 p-3">
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${accentClass}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black uppercase">{value}</p>
    </div>
  );
}

export function TaskImpactStats({
  delayStats,
  calculationsUrl,
  totalHealthyYears,
  totalEconomicValue,
  benefitDurationYears,
}: TaskImpactStatsProps) {
  const perDayHealthyYears = delayStats.delayDalysLostPerDay;
  const perDayEcon = delayStats.delayEconomicValueUsdLostPerDay;
  const annualHealthyYears = perDayHealthyYears != null ? perDayHealthyYears * 365 : null;
  const annualEcon = perDayEcon != null ? perDayEcon * 365 : null;

  return (
    <div className="space-y-4">
      {/* Primary row: annual delay rate + overdue status */}
      <div className="grid gap-3 md:grid-cols-3">
        {delayStats.isOverdue ? (
          <StatBox label="Days Overdue" value={formatDelayDuration(delayStats.currentDelayDays)} />
        ) : null}
        {annualHealthyYears != null ? (
          <StatBox
            label="Healthy Years Lost Per Year of Delay"
            value={formatCompactCount(annualHealthyYears)}
          />
        ) : null}
        {annualEcon != null ? (
          <StatBox
            label="Economic Loss Per Year of Delay"
            value={formatCompactCurrency(annualEcon)}
          />
        ) : null}
      </div>

      {/* Explanation sentence */}
      {annualHealthyYears != null ? (
        <p className="text-sm font-bold leading-7 text-muted-foreground">
          Every year this task remains unfinished, humanity loses{" "}
          <span className="text-foreground">
            {formatCompactCount(annualHealthyYears)} healthy years of life
          </span>{" "}
          it could have prevented.
          {totalHealthyYears != null && benefitDurationYears != null ? (
            <>
              {" "}
              Over the full{" "}
              <span className="text-foreground">
                {Math.round(benefitDurationYears)}-year
              </span>{" "}
              impact window, completing this task would eventually avert{" "}
              <span className="text-foreground">
                {formatCompactCount(totalHealthyYears)} healthy years
              </span>
              {totalEconomicValue != null ? (
                <>
                  {" "}
                  worth{" "}
                  <span className="text-foreground">
                    {formatCompactCurrency(totalEconomicValue)}
                  </span>
                </>
              ) : null}
              .
            </>
          ) : null}
        </p>
      ) : null}

      {calculationsUrl ? (
        <Link
          href={calculationsUrl}
          target="_blank"
          className="inline-block text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          View calculations and methodology
        </Link>
      ) : null}
    </div>
  );
}
