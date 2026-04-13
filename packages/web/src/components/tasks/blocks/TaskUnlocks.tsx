import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import type { TaskContext, TaskContextUnlock } from "@/lib/tasks/task-context";

interface TaskUnlocksProps {
  context: TaskContext;
}

function UnlockCard({ unlock }: { unlock: TaskContextUnlock }) {
  return (
    <div className="border-4 border-foreground bg-background p-5">
      <div className="flex items-start gap-3">
        {unlock.icon ? <span className="text-2xl">{unlock.icon}</span> : null}
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-black uppercase leading-tight">
            {unlock.title}
          </h3>
          {unlock.summary ? (
            <p className="text-sm font-bold text-muted-foreground">{unlock.summary}</p>
          ) : null}
          {unlock.beforeAfter && unlock.beforeAfter.length > 0 ? (
            <dl className="space-y-2 text-sm font-bold">
              <div className="grid grid-cols-3 gap-2 border-b-2 border-foreground/20 pb-1 text-xs font-black uppercase text-muted-foreground">
                <span>Metric</span>
                <span>Now</span>
                <span>After</span>
              </div>
              {unlock.beforeAfter.map((row) => (
                <div key={row.label} className="grid grid-cols-3 gap-2">
                  <dt>{row.label}</dt>
                  <dd>{row.before}</dd>
                  <dd>→ {row.after}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {unlock.roiRatio != null ? (
            <p className="text-sm font-black uppercase">ROI: {unlock.roiRatio}:1</p>
          ) : null}
          {unlock.childTaskId ? (
            <Link
              className="inline-block text-xs font-black uppercase underline underline-offset-4"
              href={`/tasks/${unlock.childTaskId}`}
            >
              Full Analysis →
            </Link>
          ) : unlock.fullAnalysisUrl ? (
            <Link
              className="inline-block text-xs font-black uppercase underline underline-offset-4"
              href={unlock.fullAnalysisUrl}
              target="_blank"
            >
              Full Analysis →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TaskUnlocks({ context }: TaskUnlocksProps) {
  const unlocks = context.unlocks;
  if (!unlocks || unlocks.length === 0) return null;

  return (
    <BrutalCard bgColor="cyan" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          What Completing This Unlocks
        </p>
        <div className="space-y-4">
          {unlocks.map((unlock, index) => (
            <UnlockCard key={unlock.childTaskId ?? `${unlock.title}-${index}`} unlock={unlock} />
          ))}
        </div>
      </div>
    </BrutalCard>
  );
}
