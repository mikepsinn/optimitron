import type { Metadata } from "next";
import Link from "next/link";
import {
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskStatus,
} from "@optimitron/db";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { type TaskCardTask } from "@/components/tasks/task-card";
import { TaskCommentFeed } from "@/components/tasks/task-comment-feed";
import { TaskHeroStats } from "@/components/tasks/task-hero-stats";
import { TaskSectionNav } from "@/components/tasks/task-section-nav";
import { getUserDisplayLabel } from "@/lib/user-display";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { TaskCompleteForm } from "@/components/tasks/TaskCompleteForm";
import { TaskDeleteButton } from "@/components/tasks/TaskDeleteButton";
import { TaskMilestoneEditor } from "@/components/tasks/TaskMilestoneEditor";
import { TaskRowShare } from "@/components/tasks/task-row-share";
import { TaskVerifyForm } from "@/components/tasks/TaskVerifyForm";
import { TaskBlockerCard } from "@/components/tasks/blocks/TaskBlockerCard";
import { TaskContextList } from "@/components/tasks/blocks/TaskContextList";
import { TaskCurrentActivities } from "@/components/tasks/blocks/TaskCurrentActivities";
import { TaskHowToSignCard } from "@/components/tasks/blocks/TaskHowToSignCard";
import { TaskRemindEmployee } from "@/components/tasks/blocks/TaskRemindEmployee";
import { TaskTreatyImpactCard } from "@/components/tasks/blocks/TaskTreatyImpactCard";
import { TaskUnlocks } from "@/components/tasks/blocks/TaskUnlocks";
import { Avatar } from "@/components/retroui/Avatar";
import { getPersonHref } from "@/lib/person-href";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildTaskShareText,
  buildTaskShareTokens,
  formatCompactCount,
  formatCompactCurrency,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  GLOBAL_MILITARY_USD,
  getSignerDelayAttribution,
} from "@/lib/tasks/delay-attribution";
import {
  DASHBOARD_INVITE_HREF,
  getSignInPath,
  getTaskPath,
  tasksLink,
  ROUTES,
} from "@/lib/routes";
import { canTaskAcceptMoreClaims } from "@/lib/tasks/rank-tasks";
import { getAssigneeTwitterHandle, readTaskContext } from "@/lib/tasks/task-context";
import { getTaskAncestors, getTaskDetailData } from "@/lib/tasks.server";
import {
  getTaskActivityTimeline,
  getTaskCommentFeed,
} from "@/lib/tasks/task-comments.server";
import {
  isTreatySignerTaskKeyPrefix,
  TREATY_PARENT_TASK_ID,
} from "@/lib/tasks/task-keys";
import { getWishoniaUserId } from "@/lib/wishonia.server";

const PUBLIC_TASK_DETAIL_REVALIDATE_SECONDS = 60;

const getCachedPublicTaskPageData = unstable_cache(
  async (id: string) => {
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
  },
  ["public-task-detail-page"],
  { revalidate: PUBLIC_TASK_DETAIL_REVALIDATE_SECONDS },
);

function getDisplayDate(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDueDate(value: Date | string) {
  const date = getDisplayDate(value);
  if (date == null) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMilestoneStatusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function formatOverdueDays(days: number): string {
  if (days >= 365) {
    const years = days / 365;
    const rounded = Number(years.toFixed(1));
    return `${years.toFixed(1)} ${rounded === 1 ? "year" : "years"} overdue`;
  }
  const rounded = Math.round(days);
  return `${rounded.toLocaleString()} ${rounded === 1 ? "day" : "days"} overdue`;
}

interface ReferralInvitationTaskCardProps {
  invitation: {
    convertedAt: Date | null;
    copiedAt: Date | null;
    messageFormat: string;
    recipientEmail: string | null;
    recipientName: string;
    sentAt: Date | null;
    status: string;
  };
}

function getReferralInvitationTaskStatus(status: string) {
  if (status === "CONVERTED") return "completed";
  if (status === "SENT") return "email sent";
  if (status === "COPIED") return "copied";
  if (status === "DECLINED") return "declined";
  if (status === "CANCELLED") return "cancelled";
  return "pending";
}

function ReferralInvitationTaskCard({ invitation }: ReferralInvitationTaskCardProps) {
  const activityDate =
    invitation.convertedAt ?? invitation.sentAt ?? invitation.copiedAt ?? null;

  return (
    <section className="border-2 border-foreground bg-background p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Earth optimization task
            </p>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-foreground">
              {getReferralInvitationTaskStatus(invitation.status)}
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase leading-tight">
            Help {invitation.recipientName} vote on the 1% Treaty
          </h2>
          <p className="max-w-3xl text-sm font-bold leading-snug text-muted-foreground">
            This is your private task for helping {invitation.recipientName}
            vote. It completes automatically when they verify a vote from your
            invite link.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center border-2 border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.08em] text-background hover:bg-background hover:text-foreground"
          href={DASHBOARD_INVITE_HREF}
        >
          Invite another
        </Link>
      </div>
      <div className="mt-5 grid gap-3 text-xs font-black uppercase sm:grid-cols-3">
        <div className="border border-foreground p-3">
          <p className="text-muted-foreground">Recipient</p>
          <p className="mt-1 break-words text-foreground">
            {invitation.recipientEmail ?? invitation.recipientName}
          </p>
        </div>
        <div className="border border-foreground p-3">
          <p className="text-muted-foreground">Format</p>
          <p className="mt-1 text-foreground">
            {invitation.messageFormat.replaceAll("_", " ").toLowerCase()}
          </p>
        </div>
        <div className="border border-foreground p-3">
          <p className="text-muted-foreground">Last activity</p>
          <p className="mt-1 text-foreground">
            {activityDate ? formatShortDate(activityDate) : "waiting"}
          </p>
        </div>
      </div>
    </section>
  );
}

interface TaskMetaSubtitleProps {
  assigneePerson:
    | {
        displayName: string;
        handle?: string | null;
        id: string;
        image?: string | null;
      }
    | null;
  assigneeOrganization: { name: string } | null;
  dueAt?: Date | string | null;
  currentDelayDays: number;
  isOverdue: boolean;
}

function TaskMetaSubtitle({
  assigneePerson,
  assigneeOrganization,
  dueAt,
  currentDelayDays,
  isOverdue,
}: TaskMetaSubtitleProps) {
  const dueDate = getDisplayDate(dueAt);
  const displayName = assigneePerson?.displayName ?? assigneeOrganization?.name;
  const personHref = assigneePerson ? getPersonHref(assigneePerson) : null;
  const initials = displayName
    ?.split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const assigneeNode = displayName ? (
    <span className="inline-flex items-center gap-2">
      <Avatar className="h-6 w-6 border border-foreground">
        {assigneePerson?.image ? (
          <Avatar.Image src={assigneePerson.image} alt={displayName} />
        ) : null}
        <Avatar.Fallback className="text-[10px] font-black uppercase">
          {initials || "?"}
        </Avatar.Fallback>
      </Avatar>
      {personHref ? (
        <Link href={personHref} className="font-black uppercase hover:underline">
          {displayName}
        </Link>
      ) : (
        <span className="font-black uppercase">{displayName}</span>
      )}
    </span>
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-muted-foreground">
      {assigneeNode}
      {dueDate ? (
        <>
          {assigneeNode ? <span>·</span> : null}
          <span>Due {formatDueDate(dueDate)}</span>
        </>
      ) : null}
      {isOverdue && currentDelayDays > 0 ? (
        <>
          <span>·</span>
          <span className="font-black uppercase text-brutal-red">
            {formatOverdueDays(currentDelayDays)}
          </span>
        </>
      ) : null}
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
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
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
  const publicPageData = userId
    ? null
    : await getCachedPublicTaskPageData(id);
  const [data, commentFeed, activityTimeline, wishoniaUserId, ancestors, viewerIsAdmin] =
    userId
      ? await Promise.all([
          getTaskDetailData(id, userId),
          getTaskCommentFeed({ taskId: id, sort: "new", limit: 100, currentUserId: userId }),
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
  const context = readTaskContext(task.contextJson);
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const completedMilestoneCount = task.milestones.filter(
    (milestone) => milestone.status === "COMPLETED" || milestone.status === "VERIFIED",
  ).length;
  const provenanceArtifacts =
    task.currentImpactEstimateSet?.sourceArtifacts?.length
      ? task.currentImpactEstimateSet.sourceArtifacts
      : task.sourceArtifacts;

  // Canonical per-second rate for live counters — uses the hero's formula so
  // every counter on the page ticks in lockstep with WHO/GBD daily rates
  // scaled by the country's share of global military spending.
  const attributionShare =
    context.assigneeProfile?.budgetUsdPerYear != null
      ? context.assigneeProfile.budgetUsdPerYear / GLOBAL_MILITARY_USD
      : 1;
  const ratePerSecond = {
    deaths: (DAILY_DISEASE_DEATHS * attributionShare) / 86400,
    usd: (DAILY_DISEASE_COST_USD * attributionShare) / 86400,
  };

  // Server-side snapshot of the same numbers for the reminder textarea tokens,
  // so the {deathsLocked}/{moneyDestroyed} values in the shared message always
  // match what the visitor just read in the hero.
  const heroAttribution =
    context.assigneeProfile?.budgetUsdPerYear != null
      ? getSignerDelayAttribution(
          context.assigneeProfile.budgetUsdPerYear,
          delayStats.currentDelayDays,
        )
      : null;
  const snapshotDeaths =
    heroAttribution?.deathsFromDelay ??
    (delayStats.currentDelayDays > 0
      ? DAILY_DISEASE_DEATHS * delayStats.currentDelayDays
      : 0);
  const snapshotWastedUsd =
    heroAttribution?.wastedUsd ??
    (delayStats.currentDelayDays > 0
      ? DAILY_DISEASE_COST_USD * delayStats.currentDelayDays
      : 0);

  // Reminder template tokens resolved server-side.
  const personHandle = task.assigneePerson?.handle ?? null;
  const reminderTokens: Record<string, string | number | null> = {
    handle: personHandle ?? targetLabel,
    name: targetLabel,
    daysOverdue: delayStats.currentDelayDays.toLocaleString(),
    deathsLocked: formatCompactCount(snapshotDeaths),
    moneyDestroyed: formatCompactCurrency(snapshotWastedUsd),
    sufferingHours: formatCompactCount(delayStats.currentSufferingHoursLost ?? 0),
    salaryUsd:
      context.assigneeProfile?.salaryUsdPerYear != null
        ? formatCompactCurrency(context.assigneeProfile.salaryUsdPerYear)
        : "",
    budgetUsd:
      context.assigneeProfile?.budgetUsdPerYear != null
        ? formatCompactCurrency(context.assigneeProfile.budgetUsdPerYear)
        : "",
    taskTitle: task.title,
    taskUrl: getTaskPath(task.id),
  };

  const isTreatySigner = isTreatySignerTaskKeyPrefix(task.taskKey);
  const leaderName = task.assigneePerson?.displayName ?? targetLabel;
  const referralInvitation = task.referralInvitations[0] ?? null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-black uppercase">
          <Link className="underline underline-offset-4" href={ROUTES.tasks}>
            Tasks
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-2">
              <span>/</span>
              <Link
                className="underline underline-offset-4"
                href={getTaskPath(ancestor.id)}
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="text-muted-foreground">{task.title}</span>
        </nav>

        <TaskSectionNav
          links={[
            { id: "overview", label: "Overview" },
            ...(task.childTasks.length > 0
              ? [{ id: "subtasks", label: "Subtasks", count: task.childTasks.length }]
              : []),
            {
              id: "discussion",
              label: "Status Updates",
            },
          ]}
        />

        <section id="overview" className="scroll-mt-32 space-y-4">
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            {task.title}
          </h1>
          <TaskMetaSubtitle
            assigneePerson={task.assigneePerson}
            assigneeOrganization={task.assigneeOrganization}
            dueAt={task.dueAt}
            currentDelayDays={delayStats.currentDelayDays}
            isOverdue={delayStats.isOverdue}
          />
          {task.isPublic ? (
            <TaskRowShare
              shareText={shareText}
              shareTokens={buildTaskShareTokens({
                countryCode: task.assigneePerson?.countryCode ?? null,
                currentDelayDays: delayStats.currentDelayDays,
                currentEconomicValueUsdLost: snapshotWastedUsd,
                currentHumanLivesLost: snapshotDeaths,
                currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
                governmentBudgetUsdPerYear:
                  context.assigneeProfile?.governmentBudgetUsdPerYear ?? null,
                leaderHandle:
                  getAssigneeTwitterHandle(task.contextJson) ??
                  task.assigneePerson?.handle ??
                  null,
                militaryBudgetUsdPerYear:
                  context.assigneeProfile?.budgetUsdPerYear ?? null,
                targetLabel,
                taskTitle: task.title,
              })}
              size="lg"
              targetLabel={targetLabel}
              taskId={task.id}
              taskTitle={task.title}
            />
          ) : null}
          {!task.isPublic && userId && task.createdByUserId === userId ? (
            <TaskDeleteButton taskId={task.id} taskTitle={task.title} />
          ) : null}
          <TaskHeroStats
            effortHours={task.estimatedEffortHours}
            dueAt={task.dueAt}
            attributionShare={attributionShare}
          />
          {referralInvitation ? (
            <ReferralInvitationTaskCard invitation={referralInvitation} />
          ) : null}
          {isTreatySigner ? <TaskHowToSignCard leaderName={leaderName} /> : null}

          {/* Action row lifted above the fold (was previously buried below
              ~6 informational blocks). For tasks the viewer can act on,
              this is the primary CTA and belongs immediately under the
              hero stats. Non-actionable viewers see nothing — the nav
              already has a Sign In link. */}
          {task.status !== TaskStatus.VERIFIED &&
          canShowClaimButton &&
          (canClaim || task.viewerHasClaim) ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <TaskClaimButton
                canClaim={canClaim}
                signedIn={Boolean(userId)}
                signInHref={signInHref}
                taskId={task.id}
                viewerHasClaim={task.viewerHasClaim}
              />
              {viewerClaim ? (
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Your claim: {viewerClaim.status.toLowerCase()}
                </span>
              ) : null}
            </div>
          ) : null}
          {viewerClaim &&
          (viewerClaim.status === TaskClaimStatus.CLAIMED ||
            viewerClaim.status === TaskClaimStatus.IN_PROGRESS) ? (
            <TaskCompleteForm taskId={task.id} />
          ) : null}
        </section>

        {/* Leader-accountability blocks: load-bearing for the treaty-
            signer political-pressure mechanic (each block pressures the
            named leader publicly). Hidden for non-leader tasks (foundation
            outreach, internal work, generic) where they would only confuse
            the recipient — e.g., a foundation lead seeing a "Remind
            Employee" block targeted at themselves. */}
        {isTreatySigner ? (
          <>
            <TaskBlockerCard context={context} />
            <TaskUnlocks context={context} />
            <TaskTreatyImpactCard />
            <TaskRemindEmployee
              reminder={context.reminder}
              assigneeProfile={context.assigneeProfile}
              taskId={task.id}
              tokens={reminderTokens}
            />
            <TaskContextList context={context} tokens={reminderTokens} />
            <TaskCurrentActivities context={context} />
          </>
        ) : null}

        {task.milestones.length > 0 ? (
          <section className="border-2 border-foreground bg-background p-5">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Milestone tracker
                  </p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {completedMilestoneCount} of {task.milestones.length} milestones reached
                  </p>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-foreground">
                  {`${completedMilestoneCount}/${task.milestones.length}`}
                </span>
              </div>
              <div className="space-y-4">
                {task.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="border border-foreground p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-black uppercase">{milestone.title}</p>
                        {milestone.description ? (
                          <p className="text-sm font-bold text-muted-foreground">
                            {milestone.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                        {getMilestoneStatusLabel(milestone.status)}
                      </span>
                    </div>
                    {milestone.evidenceNote ? (
                      <p className="mt-3 text-sm font-bold">{milestone.evidenceNote}</p>
                    ) : null}
                    {milestone.evidenceUrl ? (
                      <Link
                        className="mt-2 inline-block text-sm font-black uppercase underline underline-offset-4"
                        href={milestone.evidenceUrl}
                        target="_blank"
                      >
                        Open evidence
                      </Link>
                    ) : null}
                    {viewer?.isAdmin ? (
                      <TaskMilestoneEditor
                        defaultEvidenceNote={milestone.evidenceNote}
                        defaultEvidenceUrl={milestone.evidenceUrl}
                        defaultStatus={milestone.status}
                        milestoneId={milestone.id}
                        taskId={task.id}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {task.sourceUrl || provenanceArtifacts.length > 0 ? (
          <section className="border-2 border-foreground bg-background p-5">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                Sources
              </p>
              {task.sourceUrl ? (
                <Link
                  className="inline-block max-w-full break-words text-sm font-bold underline underline-offset-4"
                  href={task.sourceUrl}
                  target="_blank"
                >
                  Open primary source
                </Link>
              ) : null}
              {provenanceArtifacts.length > 0 ? (
                <div className="space-y-2">
                  {provenanceArtifacts.map((artifactEntry) =>
                    artifactEntry.sourceArtifact.sourceUrl ? (
                      <Link
                        key={artifactEntry.sourceArtifact.id}
                        className="block max-w-full break-words text-sm font-bold underline underline-offset-4"
                        href={artifactEntry.sourceArtifact.sourceUrl}
                        target="_blank"
                      >
                        {artifactEntry.sourceArtifact.title ?? artifactEntry.sourceArtifact.sourceKey}
                      </Link>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {viewer?.isAdmin &&
        task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY &&
        task.status !== TaskStatus.VERIFIED ? (
          <details className="border-2 border-foreground bg-background p-5">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em] text-muted-foreground marker:text-foreground">
              Admin · Curator verification
            </summary>
            <div className="mt-4 space-y-4">
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
          <details className="border-2 border-foreground bg-background p-5">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em] text-muted-foreground marker:text-foreground">
              Admin · Pending claim reviews ({reviewableClaims.length})
            </summary>
            <div className="mt-4 space-y-6">
              {reviewableClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="space-y-3 border-t border-foreground pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-lg font-black uppercase">
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
          <section id="subtasks" className="scroll-mt-32 space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Subtasks ({task.childTasks.length})
            </h2>
            <SortableTaskList
              tasks={task.childTasks as unknown as TaskCardTask[]}
              defaultSortKey={
                task.id === TREATY_PARENT_TASK_ID ? "assigneeBudget" : "deathsLockedIn"
              }
              defaultSortDir="desc"
              variant={task.id === TREATY_PARENT_TASK_ID ? "signer" : "default"}
            />
          </section>
        ) : null}

        <section id="discussion" className="scroll-mt-32">
          <TaskCommentFeed
          taskId={task.id}
          initialComments={commentFeed.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
            editedAt: c.editedAt instanceof Date ? c.editedAt.toISOString() : c.editedAt,
            deletedAt: c.deletedAt instanceof Date ? c.deletedAt.toISOString() : c.deletedAt,
          }))}
          initialActivities={activityTimeline.map((a) => ({
            ...a,
            createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
          }))}
          currentUserId={userId}
          currentUserIsAdmin={viewerIsAdmin}
          wishoniaUserId={wishoniaUserId}
          signInHref={signInHref}
        />
        </section>
      </div>
    </div>
  );
}
