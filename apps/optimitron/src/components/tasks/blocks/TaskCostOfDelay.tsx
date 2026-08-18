import { BrutalCard } from "@/components/ui/brutal-card";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import type { TaskContext } from "@/lib/tasks/task-context";
import { renderTemplate } from "@/lib/tasks/render-template";

interface TaskCostOfDelayProps {
  context: TaskContext;
  delayStats: {
    currentDelayDays: number;
    currentEconomicValueUsdLost: number | null;
    currentHumanLivesLost: number | null;
    currentSufferingHoursLost: number | null;
  };
  ratePerSecond?: {
    deaths?: number | null;
    usd?: number | null;
  };
  tokens?: Record<string, string | number | null | undefined>;
}

export function TaskCostOfDelay({
  context,
  delayStats,
  ratePerSecond,
  tokens,
}: TaskCostOfDelayProps) {
  const costNote = context.costOfDelayNote
    ? tokens
      ? renderTemplate(context.costOfDelayNote, tokens)
      : context.costOfDelayNote
    : null;
  const cards: Array<{ emoji: string; label: string; value: string }> = [];

  if (
    delayStats.currentHumanLivesLost != null &&
    delayStats.currentHumanLivesLost > 0
  ) {
    cards.push({
      emoji: "💀",
      label: "Deaths",
      value: formatCompactCount(delayStats.currentHumanLivesLost),
    });
  }
  if (
    delayStats.currentEconomicValueUsdLost != null &&
    delayStats.currentEconomicValueUsdLost > 0
  ) {
    cards.push({
      emoji: "💸",
      label: "Money Destroyed",
      value: formatCompactCurrency(delayStats.currentEconomicValueUsdLost),
    });
  }
  if (
    delayStats.currentSufferingHoursLost != null &&
    delayStats.currentSufferingHoursLost > 0
  ) {
    cards.push({
      emoji: "⏱️",
      label: "Suffering Hours",
      value: formatCompactCount(delayStats.currentSufferingHoursLost),
    });
  }

  if (cards.length === 0) return null;

  return (
    <BrutalCard bgColor="background" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
          Cost of Delay
        </p>
        {costNote ? (
          <p className="text-sm font-bold text-muted-foreground">{costNote}</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="border-4 border-foreground bg-brutal-red text-brutal-red-foreground p-4"
            >
              <div className="text-xs font-black uppercase tracking-[0.18em]">
                {card.emoji} {card.label}
              </div>
              <div className="mt-2 text-3xl font-black uppercase">{card.value}</div>
            </div>
          ))}
        </div>
        {ratePerSecond &&
        (ratePerSecond.deaths != null || ratePerSecond.usd != null) ? (
          <div className="border-t-2 border-foreground/20 pt-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Right now:{" "}
            {ratePerSecond.deaths != null
              ? `💀 ${ratePerSecond.deaths.toFixed(1)} deaths/sec`
              : null}
            {ratePerSecond.deaths != null && ratePerSecond.usd != null ? "  " : ""}
            {ratePerSecond.usd != null
              ? `💸 ${formatCompactCurrency(ratePerSecond.usd)}/sec`
              : null}
          </div>
        ) : null}
      </div>
    </BrutalCard>
  );
}
