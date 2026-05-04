"use client";

import type { ReactNode } from "react";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface PresidentManagementSystemSectionProps {
  children?: ReactNode;
  className?: string;
  pageSize?: number;
  showComposer?: boolean;
  showIntro?: boolean;
  signerTasks: TaskCardTask[];
  treatyProgram: TaskCardTask | null;
}

function getTaskDueMs(task: TaskCardTask) {
  if (!task.dueAt) return null;
  return task.dueAt instanceof Date
    ? task.dueAt.getTime()
    : new Date(task.dueAt).getTime();
}

function countOverdueTasks(tasks: TaskCardTask[]) {
  const now = Date.now();
  return tasks.filter((task) => {
    const dueMs = getTaskDueMs(task);
    return dueMs != null && dueMs < now;
  }).length;
}

export function PresidentManagementSystemSection({
  children,
  className = "space-y-6",
  pageSize,
  showComposer = true,
  showIntro = true,
  signerTasks,
  treatyProgram,
}: PresidentManagementSystemSectionProps) {
  const overdueCount = countOverdueTasks(signerTasks);
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
        <ProgramTaskSection
          task={treatyProgram}
          subtasks={signerTasks}
          subtasksTitle={subtasksTitle}
          pageSize={pageSize}
        />
      ) : null}
    </section>
  );
}

