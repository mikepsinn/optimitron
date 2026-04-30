"use client";

import Link from "next/link";
import { Check, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ReferralInvitationStatusCard } from "@/components/dashboard/ReferralInvitationStatusCard";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { Button } from "@/components/retroui/Button";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface HumanityManagementDashboardClientProps {
  nextTasks: TaskCardTask[];
  completedTasks?: TaskCardTask[];
}

export function HumanityManagementDashboardClient({
  nextTasks,
  completedTasks = [],
}: HumanityManagementDashboardClientProps) {
  const [primaryTask, ...followUpTasks] = nextTasks;

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

      {primaryTask ? (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Your next task
          </p>
          <PrimaryTaskCard task={primaryTask} />
        </section>
      ) : (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Stage 1 complete
          </p>
          <div className="border-4 border-primary bg-brutal-green p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-base font-bold text-brutal-green-foreground">
              Five tasks done. Promotion review pending.
            </p>
          </div>
        </section>
      )}

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

      {followUpTasks.length > 0 ? (
        <section className="space-y-3">
          <details className="group border-4 border-primary bg-background">
            <summary className="cursor-pointer list-none p-4 text-sm font-black uppercase tracking-tight">
              Up next ({followUpTasks.length} more)
              <span className="float-right text-xs font-bold text-muted-foreground group-open:hidden">
                show
              </span>
              <span className="float-right text-xs font-bold text-muted-foreground hidden group-open:inline">
                hide
              </span>
            </summary>
            <div className="border-t-4 border-primary p-4">
              <SortableTaskList tasks={followUpTasks} />
            </div>
          </details>
        </section>
      ) : null}

      {completedTasks.length > 0 ? (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Done ({completedTasks.length})
          </p>
          <ul className="space-y-2">
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border-4 border-primary bg-background px-4 py-2"
              >
                <Check className="h-5 w-5 stroke-[3px] text-brutal-green-foreground" />
                <span className="font-bold text-muted-foreground line-through">
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/// Trust-the-user attestation: when the user clicks through to publicly
/// sign the 1% Treaty, fire the POST that marks their HMT subtask
/// VERIFIED. We don't await it — the user's link click navigates away
/// regardless. If the network call drops the signature isn't recorded,
/// the user has the click-through evidence, and they can re-click later.
async function postSignTreatyAttestation() {
  try {
    await fetch("/api/user-treaty-task/sign-personally", { method: "POST" });
  } catch {
    // Best-effort. The link click already opened 1percenttreaty.org in a
    // new tab; we don't want to block navigation on a verification POST.
  }
}

function PrimaryTaskCard({ task }: { task: TaskCardTask }) {
  const actionLink = task.communicationEndpoints?.find((endpoint) => endpoint.url) ?? null;
  const ctaUrl = actionLink?.url ?? `/tasks/${task.id}`;
  const ctaLabel = actionLink?.label ?? "Open the task";
  /// Detect the signTreatyPersonally subtask by suffix on its taskKey.
  /// When the user clicks the action-link we fire the attestation POST in
  /// parallel — see `markUserTreatyPersonalSignComplete` for why we trust
  /// the click.
  const isSignTreatyTask = Boolean(
    task.taskKey?.endsWith(":signTreatyPersonally"),
  );

  return (
    <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black uppercase tracking-tight">
        {task.title}
      </h2>
      {task.description ? (
        <p className="mt-3 text-base font-bold leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {task.description}
        </p>
      ) : null}
      <div className="mt-6">
        <Button
          asChild
          className="h-11 border-4 border-primary px-6 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Link
            href={ctaUrl}
            target={actionLink?.url ? "_blank" : undefined}
            onClick={isSignTreatyTask ? () => void postSignTreatyAttestation() : undefined}
          >
            {ctaLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
