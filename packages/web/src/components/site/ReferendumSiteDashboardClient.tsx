"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { PostVoteReminders } from "@/components/landing/PostVoteReminders";
import { Button } from "@/components/retroui/Button";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import { TreatySection } from "@/components/site/TreatySection";

interface ReferendumSiteDashboardClientProps {
  task: TaskCardTask | null;
  subtasks: TaskCardTask[];
  treatyMarkdown: string;
  referendumSlug: string | null;
}

export function ReferendumSiteDashboardClient({
  task,
  subtasks,
  treatyMarkdown,
  referendumSlug,
}: ReferendumSiteDashboardClientProps) {
  if (!task) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex items-start justify-end">
        <Button
          variant="outline"
          data-testid="sign-out-button"
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
          className="bg-background border-4 border-primary hover:bg-primary hover:text-primary-foreground font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-2"
        >
          <LogOut className="h-5 w-5 stroke-[3px]" />
        </Button>
      </div>
      <div className="text-center">
        <TasksRootIntro />
        <div className="mx-auto mt-6 max-w-2xl text-left">
          <PostVoteReminders />
        </div>
      </div>
      <ProgramTaskSection
        task={task}
        subtasks={subtasks}
        subtasksTitle={
          subtasks.length > 0
            ? `↳ ${subtasks.length} employees have overdue tasks`
            : undefined
        }
      />
      <TreatySection
        treatyMarkdown={treatyMarkdown}
        referendumSlug={referendumSlug}
      />
    </div>
  );
}
