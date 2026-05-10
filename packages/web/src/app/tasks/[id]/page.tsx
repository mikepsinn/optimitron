import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { TaskClaimPolicy, TaskClaimStatus, TaskStatus } from "@optimitron/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { type TaskCardTask } from "@/components/tasks/task-card";
import { TaskCommentFeed } from "@/components/tasks/task-comment-feed";
import { TaskDescription } from "@/components/tasks/task-description";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { TaskCompleteForm } from "@/components/tasks/TaskCompleteForm";
import { TaskDeleteButton } from "@/components/tasks/TaskDeleteButton";
import { TaskShareButtons } from "@/components/tasks/TaskShareButtons";
import { TaskVerifyForm } from "@/components/tasks/TaskVerifyForm";
import { getUserDisplayLabel } from "@/lib/user-display";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildTaskShareText,
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getSignInPath, getTaskPath, tasksLink, ROUTES } from "@/lib/routes";
import { canTaskAcceptMoreClaims } from "@/lib/tasks/rank-tasks";
import { getPersonHref } from "@/lib/person-href";
import { getTaskAncestors, getTaskDetailData } from "@/lib/tasks.server";
import {
  getTaskActivityTimeline,
  getTaskCommentFeed,
} from "@/lib/tasks/task-comments.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import { getWishoniaUserId } from "@/lib/wishonia.server";

async function getPublicTaskPageData(id: string) {
  const [data, commentFeed, activityTimeline, ancestors] = await Promise.all([
    getTaskDetailData(id, null),
    getTaskCommentFeed({
      taskId: id,
      sort: "new",
      limit: 100,
      currentUserId: null,
    }),
    getTaskActivityTimeline(id, 50),
    getTaskAncestors(id),
  ]);

  return { data, commentFeed, activityTimeline, ancestors };
}

const TASK_DATE_TIME_ZONE = "UTC";

function getDisplayDate(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDueDate(value: Date | string | null | undefined) {
  const date = getDisplayDate(value);
  if (date == null) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: TASK_DATE_TIME_ZONE,
    year: "numeric",
  });
}

function formatShortDate(value: Date | string | null | undefined) {
  const date = getDisplayDate(value);
  if (date == null) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: TASK_DATE_TIME_ZONE,
    year: "numeric",
  });
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTaskProgress(value: TaskStatus) {
  switch (value) {
    case TaskStatus.DRAFT:
      return "Draft";
    case TaskStatus.ACTIVE:
      return "To do";
    case TaskStatus.VERIFIED:
      return "Done";
    case TaskStatus.STALE:
      return "Needs review";
    default:
      return formatEnumLabel(value) ?? "To do";
  }
}

function formatEffortHours(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  if (value < 1) {
    const minutes = Math.max(1, Math.round(value * 60));
    return `${minutes.toLocaleString("en-US")} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  const rounded = Number(value.toFixed(value >= 10 ? 0 : 1));
  return `${rounded.toLocaleString("en-US")} ${rounded === 1 ? "hour" : "hours"}`;
}

function getEndpointHref(
  endpoint:
    | {
        email?: string | null;
        url?: string | null;
      }
    | null
    | undefined,
) {
  if (!endpoint) {
    return null;
  }

  if (endpoint.url) {
    return endpoint.url;
  }

  if (endpoint.email) {
    return `mailto:${endpoint.email}`;
  }

  return null;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:");
}

function getAssigneeLabel(task: {
  assigneeOrganization?: { name: string } | null;
  assigneePerson?: { displayName: string } | null;
}) {
  return (
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? null
  );
}

function getAssigneeHref(task: {
  assigneePerson?: { id: string; handle?: string | null } | null;
}) {
  return task.assigneePerson ? getPersonHref(task.assigneePerson) : null;
}

function ActionLink({
  children,
  href,
  primary = false,
}: {
  children: ReactNode;
  href: string;
  primary?: boolean;
}) {
  const external = isExternalHref(href);
  const className = primary
    ? "inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
    : "inline-flex min-h-10 items-center justify-center border border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background";

  if (external) {
    return (
      <a
        className={className}
        href={href}
        rel="noreferrer"
        target={href.startsWith("mailto:") ? undefined : "_blank"}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "") {
    return null;
  }

  return (
    <div className="border-t border-foreground py-3 first:border-t-0">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-foreground">{value}</dd>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getTaskDetailData(id, null);

  if (!data) {
    return {
      title: "Task Detail | Optimitron",
    };
  }

  const { task } = data;
  const delayStats = getTaskDelayStats(task);
  const targetLabel =
    task.assigneePerson?.displayName ??
    task.assigneeOrganization?.name ??
    task.title;
  const description = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });

  return {
    title: `${task.title} | ${tasksLink.label} | Optimitron`,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: task.title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: task.title,
      description,
    },
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const publicPageData = userId ? null : await getPublicTaskPageData(id);
  const [
    data,
    commentFeed,
    activityTimeline,
    wishoniaUserId,
    ancestors,
    viewerIsAdmin,
  ] = userId
    ? await Promise.all([
        getTaskDetailData(id, userId),
        getTaskCommentFeed({
          taskId: id,
          sort: "new",
          limit: 100,
          currentUserId: userId,
        }),
        getTaskActivityTimeline(id, 50),
        getWishoniaUserId().catch(() => null),
        getTaskAncestors(id),
        prisma.user
          .findUnique({ where: { id: userId }, select: { isAdmin: true } })
          .then((u) => u?.isAdmin ?? false),
      ])
    : [
        publicPageData?.data ?? null,
        publicPageData?.commentFeed ?? { comments: [], total: 0 },
        publicPageData?.activityTimeline ?? [],
        await getWishoniaUserId().catch(() => null),
        publicPageData?.ancestors ?? [],
        false,
      ];

  if (!data) {
    notFound();
  }

  const { task, viewer, viewerClaim } = data;
  const hasOtherPersonAssignee =
    task.assigneePerson != null && task.assigneePerson.id !== viewer?.personId;
  const canShowClaimButton = !hasOtherPersonAssignee;
  const canClaim = canTaskAcceptMoreClaims({
    activeClaimCount: task.activeClaimCount,
    claimPolicy: task.claimPolicy,
    difficulty: task.difficulty,
    estimatedEffortHours: task.estimatedEffortHours,
    interestTags: task.interestTags,
    maxClaims: task.maxClaims,
    skillTags: task.skillTags,
    status: task.status,
  });
  const signInHref = getSignInPath(`${ROUTES.tasks}/${task.id}`);
  const reviewableClaims = task.claims.filter(
    (claim) => claim.status === TaskClaimStatus.COMPLETED,
  );
  const delayStats = getTaskDelayStats(task);
  const targetLabel = getAssigneeLabel(task) ?? task.title;
  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const primaryEndpoint = task.communicationEndpoints[0] ?? null;
  const primaryHref = getEndpointHref(primaryEndpoint);
  const assigneeHref = getAssigneeHref(task);
  const assigneeLabel = getAssigneeLabel(task);
  const dueLabel = formatDueDate(task.dueAt);
  const completedLabel = formatShortDate(task.verifiedAt ?? task.completedAt);
  const effortLabel = formatEffortHours(task.estimatedEffortHours);
  const progressLabel = formatTaskProgress(task.status);
  const ownerDetail =
    assigneeLabel && assigneeHref ? (
      <Link className="underline underline-offset-4" href={assigneeHref}>
        {assigneeLabel}
      </Link>
    ) : (
      assigneeLabel
    );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={ROUTES.tasks}
          >
            Tasks
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-2">
              <span>/</span>
              <Link
                className="text-foreground underline underline-offset-4"
                href={getTaskPath(ancestor.id)}
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span>{task.title}</span>
        </nav>

        <header className="border-b border-foreground pb-6">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              {delayStats.isOverdue ? "Overdue task" : "Task"}
              {task.isPublic ? "" : " · Private"}
            </p>
            <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-muted-foreground">
              {assigneeLabel ? (
                <span>
                  Assigned to{" "}
                  {assigneeHref ? (
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href={assigneeHref}
                    >
                      {assigneeLabel}
                    </Link>
                  ) : (
                    <span className="text-foreground">{assigneeLabel}</span>
                  )}
                </span>
              ) : null}
              {task.roleTitle ? <span>{task.roleTitle}</span> : null}
              {task.assigneeAffiliationSnapshot ? (
                <span>{task.assigneeAffiliationSnapshot}</span>
              ) : null}
              {dueLabel ? <span>Due {dueLabel}</span> : null}
              {delayStats.isOverdue ? (
                <span className="font-black text-foreground">
                  {formatDelayDuration(delayStats.currentDelayDays)} overdue
                </span>
              ) : null}
            </div>
          </div>

          <section
            aria-label="Task actions"
            className="mt-6 flex flex-wrap items-center gap-2"
          >
            {primaryHref ? (
              <ActionLink href={primaryHref} primary>
                {primaryEndpoint?.label ?? "Open task link"}
              </ActionLink>
            ) : null}
            {task.status !== TaskStatus.VERIFIED &&
            canShowClaimButton &&
            (canClaim || task.viewerHasClaim) ? (
              <TaskClaimButton
                canClaim={canClaim}
                signedIn={Boolean(userId)}
                signInHref={signInHref}
                taskId={task.id}
                viewerHasClaim={task.viewerHasClaim}
              />
            ) : null}
            {task.isPublic ? (
              <TaskShareButtons
                shareText={shareText}
                taskId={task.id}
                taskTitle={task.title}
                variant="icon"
              />
            ) : null}
            {!task.isPublic && userId && task.createdByUserId === userId ? (
              <TaskDeleteButton taskId={task.id} taskTitle={task.title} />
            ) : null}
          </section>

          {viewerClaim ? (
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Your claim: {formatEnumLabel(viewerClaim.status)}
            </p>
          ) : null}

          {viewerClaim &&
          (viewerClaim.status === TaskClaimStatus.CLAIMED ||
            viewerClaim.status === TaskClaimStatus.IN_PROGRESS) ? (
            <div className="mt-5">
              <TaskCompleteForm taskId={task.id} />
            </div>
          ) : null}
        </header>

        <section className="grid gap-8 border-b border-foreground py-6 lg:grid-cols-[280px_1fr]">
          <dl>
            <DetailItem label="Owner" value={ownerDetail} />
            <DetailItem label="Progress" value={progressLabel} />
            <DetailItem label="Due date" value={dueLabel} />
            <DetailItem label="Time needed" value={effortLabel} />
            <DetailItem label="Area" value={formatEnumLabel(task.category)} />
            <DetailItem label="Completed" value={completedLabel} />
            {delayStats.currentHumanLivesLost != null &&
            delayStats.currentHumanLivesLost > 0 ? (
              <DetailItem
                label="Deaths from delay"
                value={formatCompactCount(delayStats.currentHumanLivesLost)}
              />
            ) : null}
            {delayStats.currentEconomicValueUsdLost != null &&
            delayStats.currentEconomicValueUsdLost > 0 ? (
              <DetailItem
                label="Wasted by delay"
                value={formatCompactCurrency(
                  delayStats.currentEconomicValueUsdLost,
                )}
              />
            ) : null}
            <DetailItem
              label="Updates"
              value={commentFeed.total.toLocaleString("en-US")}
            />
          </dl>

          <article className="min-w-0">
            <TaskDescription markdown={task.description} />
          </article>
        </section>

        {viewer?.isAdmin &&
        task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY &&
        task.status !== TaskStatus.VERIFIED ? (
          <details className="border-b border-foreground py-5">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Admin verification
            </summary>
            <div className="mt-4">
              <TaskVerifyForm
                defaultEvidence={task.completionEvidence}
                helperText="For assigned-only public tasks, paste the public evidence used to mark the task complete."
                submitLabel="Verify assigned task"
                taskId={task.id}
              />
            </div>
          </details>
        ) : null}

        {viewer?.isAdmin && reviewableClaims.length > 0 ? (
          <details className="border-b border-foreground py-5">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Pending claim reviews ({reviewableClaims.length})
            </summary>
            <div className="mt-4 space-y-6">
              {reviewableClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="space-y-3 border-t border-foreground pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-base font-black">
                    {getUserDisplayLabel(claim.user) || claim.userId}
                  </p>
                  {claim.completionEvidence ? (
                    <p className="text-sm font-bold text-muted-foreground">
                      {claim.completionEvidence}
                    </p>
                  ) : null}
                  <TaskVerifyForm
                    claimId={claim.id}
                    defaultEvidence={claim.verificationNote}
                    helperText="Add an optional verification note, then mark the claim verified."
                    submitLabel="Verify claim"
                    taskId={task.id}
                  />
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {task.childTasks.length > 0 ? (
          <section id="subtasks" className="border-b border-foreground py-8">
            <h2 className="mb-4 text-xl font-black">
              Steps ({task.childTasks.length})
            </h2>
            <SortableTaskList
              tasks={task.childTasks as unknown as TaskCardTask[]}
              defaultSortKey={
                task.id === TREATY_PARENT_TASK_ID
                  ? "assigneeBudget"
                  : "deathsLockedIn"
              }
              defaultSortDir="desc"
              variant={task.id === TREATY_PARENT_TASK_ID ? "signer" : "default"}
            />
          </section>
        ) : null}

        <section id="discussion" className="py-8">
          <TaskCommentFeed
            taskId={task.id}
            initialComments={commentFeed.comments.map((c) => ({
              ...c,
              createdAt:
                c.createdAt instanceof Date
                  ? c.createdAt.toISOString()
                  : c.createdAt,
              editedAt:
                c.editedAt instanceof Date
                  ? c.editedAt.toISOString()
                  : c.editedAt,
              deletedAt:
                c.deletedAt instanceof Date
                  ? c.deletedAt.toISOString()
                  : c.deletedAt,
            }))}
            initialActivities={activityTimeline.map((a) => ({
              ...a,
              createdAt:
                a.createdAt instanceof Date
                  ? a.createdAt.toISOString()
                  : a.createdAt,
            }))}
            currentUserId={userId}
            currentUserIsAdmin={viewerIsAdmin}
            wishoniaUserId={wishoniaUserId}
            signInHref={signInHref}
          />
        </section>
      </div>
    </main>
  );
}
