"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { Button } from "@/components/retroui/Button";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { ROUTES } from "@/lib/routes";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface TreatyTaskDashboardClientProps {
  treatyProgram: TaskCardTask | null;
  signerTasks: TaskCardTask[];
}

export function TreatyTaskDashboardClient({
  treatyProgram,
  signerTasks,
}: TreatyTaskDashboardClientProps) {
  const overdueCount = signerTasks.filter(
    (t) => t.dueAt != null && t.dueAt.getTime() < Date.now(),
  ).length;

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:py-12">
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

        {treatyProgram ? (
          <ProgramTaskSection
            task={treatyProgram}
            subtasks={signerTasks}
            subtasksTitle={
              overdueCount > 0
                ? `↳ ${overdueCount} employees have overdue tasks`
                : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}
