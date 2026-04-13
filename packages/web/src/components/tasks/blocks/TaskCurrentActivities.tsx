import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskCurrentActivitiesProps {
  context: TaskContext;
}

export function TaskCurrentActivities({ context }: TaskCurrentActivitiesProps) {
  const activities = context.currentActivities;
  if (!activities || activities.length === 0) return null;

  return (
    <BrutalCard bgColor="yellow" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
          Currently Doing Instead
        </p>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id ?? `${activity.description}-${index}`}
              className="border-4 border-foreground bg-background p-4"
            >
              <p className="text-lg font-black uppercase">{activity.description}</p>
              {activity.impactSummary ? (
                <p className="mt-2 text-sm font-bold">{activity.impactSummary}</p>
              ) : null}
              {activity.methodology ? (
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  Methodology: {activity.methodology}
                </p>
              ) : null}
              {activity.updated ? (
                <p className="mt-2 text-xs font-black uppercase text-muted-foreground">
                  Updated {activity.updated}
                </p>
              ) : null}
              {activity.sourceUrl ? (
                <Link
                  className="mt-2 inline-block text-sm font-black uppercase underline underline-offset-4"
                  href={activity.sourceUrl}
                  target="_blank"
                >
                  Open Source
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </BrutalCard>
  );
}
