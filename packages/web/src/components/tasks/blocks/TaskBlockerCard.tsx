import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskBlockerCardProps {
  context: TaskContext;
}

export function TaskBlockerCard({ context }: TaskBlockerCardProps) {
  const blocked = context.blockedBy;
  if (!blocked) return null;

  const href = blocked.callToActionHref ?? `/tasks/${blocked.taskId}`;

  return (
    <BrutalCard bgColor="yellow" padding="lg">
      <div className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          🔒 Status: Blocked
        </p>
        {blocked.summary ? (
          <p className="text-sm font-bold">{blocked.summary}</p>
        ) : null}
        <Link
          className="inline-block border-4 border-foreground bg-background px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          href={href}
        >
          Go to Blocker →
        </Link>
      </div>
    </BrutalCard>
  );
}
