"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { Button } from "@/components/retroui/Button";
import { getTaskPath, ROUTES } from "@/lib/routes";
import { formatDelayDuration, getTaskDelayStats } from "@/lib/tasks/accountability";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface TreatyTaskDashboardClientProps {
  overdueLeaders: TaskCardTask[];
}

export function TreatyTaskDashboardClient({
  overdueLeaders,
}: TreatyTaskDashboardClientProps) {
  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--treaty-ink)]/30 pb-4 sm:flex-row">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Humanity Management Dashboard
          </h1>
          <Button
            variant="outline"
            data-testid="sign-out-button"
            onClick={() => {
              void signOut({ callbackUrl: ROUTES.home });
            }}
            className="min-h-11 border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
          >
            <LogOut className="h-4 w-4 stroke-[2.5px]" />
          </Button>
        </div>

        <TreatyReminderComposer />

        <ReferralInvitationComposer />

        <OverdueLeaderList tasks={overdueLeaders} />
      </div>
    </div>
  );
}

function OverdueLeaderList({ tasks }: { tasks: TaskCardTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight sm:text-xl">
          Overdue leaders
        </h2>
        <Link
          href={ROUTES.tasks}
          className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] underline underline-offset-4"
        >
          See all 193
        </Link>
      </div>
      <ul className="divide-y divide-[var(--treaty-ink)]/20 border border-[var(--treaty-ink)] bg-[#fffdf8]">
        {tasks.map((task) => {
          const stats = getTaskDelayStats(task);
          const leaderName =
            task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
          return (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-black">{leaderName}</p>
                {stats.isOverdue ? (
                  <p className="text-xs font-bold uppercase text-[var(--treaty-ink-muted)]">
                    {formatDelayDuration(stats.currentDelayDays)} overdue
                  </p>
                ) : null}
              </div>
              <Link
                href={getTaskPath(task.id)}
                className="border border-[var(--treaty-ink)] bg-transparent px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] hover:bg-[#efe4cf]"
              >
                Remind
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
