"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ReferralInvitationStatusCard } from "@/components/dashboard/ReferralInvitationStatusCard";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { Button } from "@/components/retroui/Button";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface HumanityManagementDashboardClientProps {
  nextTasks: TaskCardTask[];
}

export function HumanityManagementDashboardClient({
  nextTasks,
}: HumanityManagementDashboardClientProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Earth Optimization Services LLC
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
            Humanity Management Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-base font-bold leading-relaxed text-muted-foreground">
            Assign humans to complete Earth Optimization Tasks and track the
            tasks you created.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="h-10 border-4 border-primary bg-background px-4 text-xs font-black uppercase"
            >
              <Link href="/treaty">Read the Treaty</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 border-4 border-primary bg-background px-4 text-xs font-black uppercase"
            >
              <Link href="/tasks">President Management System</Link>
            </Button>
          </div>
        </div>
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

      <section className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Assign an Earth Optimization Task
          </h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Give one human the task, then send or copy the message.
          </p>
        </div>
        <ReferralInvitationComposer />
        <ReferralInvitationStatusCard />
      </section>

      {nextTasks.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Open Earth Optimization Tasks
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-bold text-muted-foreground">
              These are the Earth Optimization Tasks still waiting for
              completion.
            </p>
          </div>
          <SortableTaskList tasks={nextTasks} />
        </section>
      ) : null}
    </div>
  );
}
