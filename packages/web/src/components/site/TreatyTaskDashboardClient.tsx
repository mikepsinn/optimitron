"use client";

import Link from "next/link";
import { Check, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ReferralInvitationStatusCard } from "@/components/dashboard/ReferralInvitationStatusCard";
import { ReferralInvitationComposer } from "@/components/landing/ReferralInvitationComposer";
import { Button } from "@/components/retroui/Button";
import {
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
} from "@/components/landing/TreatyFlowShell";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { TaskCardTask } from "@/components/tasks/task-card";

interface TreatyTaskDashboardClientProps {
  nextTasks: TaskCardTask[];
  completedTasks?: TaskCardTask[];
}

/// Suffixes of the HMT subtasks where the composer (assign-a-human form)
/// is the actual action. Showing it on other steps (sign-personally,
/// share-referral, phone-call) makes the dashboard look like a giant
/// data-entry form competing with the primary CTA. Gate it.
const ASSIGN_HUMAN_TASK_KEY_SUFFIXES = [
  ":assignFirstHuman",
  ":assignSecondHuman",
] as const;

function isAssignHumanTask(task: TaskCardTask | undefined) {
  if (!task?.taskKey) return false;
  return ASSIGN_HUMAN_TASK_KEY_SUFFIXES.some((suffix) =>
    task.taskKey?.endsWith(suffix),
  );
}

export function TreatyTaskDashboardClient({
  nextTasks,
  completedTasks = [],
}: TreatyTaskDashboardClientProps) {
  const [primaryTask, ...followUpTasks] = nextTasks;
  const showComposer = isAssignHumanTask(primaryTask);

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:py-12">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--treaty-ink)]/30 pb-4 sm:flex-row">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
            Earth Optimization Services LLC
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Humanity Management Dashboard
          </h1>
        </div>
        <Button
          variant="outline"
          data-testid="sign-out-button"
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
          className="min-h-11 border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
        >
          <LogOut className="h-4 w-4 stroke-[2.5px]" />
        </Button>
      </div>

      {primaryTask ? (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
            Your next task
          </p>
          <PrimaryTaskCard task={primaryTask} />
        </section>
      ) : (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
            Stage 1 complete
          </p>
          <div className="border border-[var(--treaty-ink)] bg-[#fffdf8] p-5">
            <p className="text-base font-bold text-[var(--treaty-ink-soft)]">
              Five tasks done. Promotion review pending.
            </p>
          </div>
        </section>
      )}

      {showComposer ? (
        <section className="mx-auto max-w-2xl space-y-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
              Assign an Earth Optimization Task
            </h2>
            <p className="mt-2 text-sm font-bold text-[var(--treaty-ink-muted)]">
              Give one human the task, then send or copy the message.
            </p>
          </div>
          <ReferralInvitationComposer />
          <ReferralInvitationStatusCard />
        </section>
      ) : null}

      {followUpTasks.length > 0 ? (
        <section className="space-y-3">
          <details className="group border border-[var(--treaty-ink)] bg-transparent">
            <summary className="cursor-pointer list-none p-4 text-sm font-black uppercase tracking-tight">
              Up next ({followUpTasks.length} more)
              <span className="float-right text-xs font-bold text-[var(--treaty-ink-muted)] group-open:hidden">
                show
              </span>
              <span className="float-right hidden text-xs font-bold text-[var(--treaty-ink-muted)] group-open:inline">
                hide
              </span>
            </summary>
            <div className="border-t border-[var(--treaty-ink)]/30 p-4">
              <SortableTaskList tasks={followUpTasks} />
            </div>
          </details>
        </section>
      ) : null}

      {completedTasks.length > 0 ? (
        <section className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
            Done ({completedTasks.length})
          </p>
          <ul className="space-y-2">
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 border border-[var(--treaty-ink)]/30 bg-transparent px-4 py-2"
              >
                <Check className="h-5 w-5 stroke-[2.5px] text-[var(--treaty-ink)]" />
                <span className="font-bold text-[var(--treaty-ink-muted)] line-through">
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
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
    <div className="border border-[var(--treaty-ink)] bg-[#fffdf8] p-5 shadow-none">
      <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
        {task.title}
      </h2>
      {task.description ? (
        <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-7 text-[var(--treaty-ink-soft)]">
          {task.description}
        </p>
      ) : null}
      <div className="mt-6">
        <Button
          asChild
          className={ctaLabel === "Open the task" ? treatySecondaryButtonClass : treatyPrimaryButtonClass}
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
