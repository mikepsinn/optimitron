import { ShareOverdueListButtons } from "@/components/tasks/ShareOverdueListButtons";
import { BrutalCard } from "@/components/ui/brutal-card";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";

interface ReminderActionCardProps {
  currentEconomicValueUsdLost: number | null;
  currentHumanLivesLost: number | null;
  currentSufferingHoursLost: number | null;
  overdueTaskCount: number;
  tasksUrl: string;
}

export function ReminderActionCard({
  currentEconomicValueUsdLost,
  currentHumanLivesLost,
  currentSufferingHoursLost,
  overdueTaskCount,
  tasksUrl,
}: ReminderActionCardProps) {
  return (
    <BrutalCard bgColor="pink" padding="md" shadowSize={8}>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
          {overdueTaskCount} Leaders Overdue on the 1% Treaty
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-4 border-foreground bg-background p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
              Human Cost
            </p>
            <p className="mt-1 text-2xl font-black uppercase text-foreground">
              {formatCompactCount(currentHumanLivesLost)}
            </p>
            <p className="text-xs font-bold uppercase text-muted-foreground">deaths from delay</p>
          </div>
          <div className="border-4 border-foreground bg-background p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
              Suffering
            </p>
            <p className="mt-1 text-2xl font-black uppercase text-foreground">
              {formatCompactCount(currentSufferingHoursLost)}
            </p>
            <p className="text-xs font-bold uppercase text-muted-foreground">suffering-hours caused</p>
          </div>
          <div className="border-4 border-foreground bg-background p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-red">
              Economic Loss
            </p>
            <p className="mt-1 text-2xl font-black uppercase text-foreground">
              {formatCompactCurrency(currentEconomicValueUsdLost)}
            </p>
            <p className="text-xs font-bold uppercase text-muted-foreground">lost so far</p>
          </div>
        </div>

        <ShareOverdueListButtons
          economicLoss={formatCompactCurrency(currentEconomicValueUsdLost)}
          labelClassName="text-background"
          livesLost={formatCompactCount(currentHumanLivesLost)}
          overdueCount={overdueTaskCount}
          tasksUrl={tasksUrl}
          variant="icon"
        />
      </div>
    </BrutalCard>
  );
}
