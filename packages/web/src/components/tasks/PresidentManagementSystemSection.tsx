"use client";

import type { ReactNode } from "react";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { countOverdueTasks } from "@/lib/tasks/overdue";
import { useHydratedNow } from "@/lib/use-hydrated-now";

interface PresidentManagementSystemSectionProps {
  children?: ReactNode;
  className?: string;
  initialOverdueCount?: number;
  pageSize?: number;
  showComposer?: boolean;
  showIntro?: boolean;
  signerTasks: TaskCardTask[];
  treatyProgram: TaskCardTask | null;
}

export function PresidentManagementSystemSection({
  children,
  className = "space-y-6",
  initialOverdueCount = 0,
  pageSize,
  showComposer = true,
  showIntro = true,
  signerTasks,
  treatyProgram,
}: PresidentManagementSystemSectionProps) {
  const now = useHydratedNow();
  const overdueCount = now
    ? countOverdueTasks(signerTasks, now)
    : initialOverdueCount;
  const subtasksTitle =
    overdueCount > 0
      ? `↳ ${overdueCount} employees have overdue tasks`
      : undefined;

  return (
    <section className={className}>
      {showIntro ? (
        <div className="text-center">
          <TasksRootIntro />
          {showComposer ? (
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <TreatyReminderComposer />
            </div>
          ) : null}
        </div>
      ) : showComposer ? (
        <TreatyReminderComposer />
      ) : null}

      {children}

      {treatyProgram ? (
        <div data-visual-section="president-task-list">
          <ProgramTaskSection
            task={treatyProgram}
            subtasks={signerTasks}
            subtasksTitle={subtasksTitle}
            pageSize={pageSize}
          />
        </div>
      ) : null}
    </section>
  );
}
